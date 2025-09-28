import os
import subprocess
import sys
from datetime import timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .config import get_settings
from .database import Base, engine, get_db
from .google_maps import geocode_address
from .rate_limiter import ensure_can_submit, note_submission

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RateMyLandlord API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Additional CORS headers for stubborn browsers
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@app.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = auth.get_password_hash(user_in.password)
    user = models.User(email=user_in.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db=db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token({"sub": str(user.id)}, expires_delta=access_token_expires)

    user_out = schemas.UserOut.model_validate(user)
    return schemas.Token(access_token=access_token, user=user_out)


def _clamp_rating(value):
    if value is None:
        return None
    try:
        return max(0.0, min(float(value), 5.0))
    except (TypeError, ValueError):
        return None


def _serialize_review(review: models.Review, current_user: models.User = None, db: Session = None) -> schemas.ReviewOut:
    author_email = None if review.is_anonymous else (review.author.email if review.author else None)
    
    # Check if user has bookmarked this review
    is_bookmarked = False
    if current_user and db:
        bookmark = db.query(models.Bookmark).filter(
            models.Bookmark.user_id == current_user.id,
            models.Bookmark.review_id == review.id
        ).first()
        is_bookmarked = bookmark is not None
    
    return schemas.ReviewOut(
        id=review.id,
        landlord_name=review.landlord_name,
        overall_rating=_clamp_rating(review.overall_rating),
        maintenance_rating=_clamp_rating(review.maintenance_rating),
        communication_rating=_clamp_rating(review.communication_rating),
        respect_rating=_clamp_rating(review.respect_rating),
        rent_value_rating=_clamp_rating(review.rent_value_rating),
        would_rent_again=review.would_rent_again,
        monthly_rent=review.monthly_rent,
        review_text=review.review_text,
        property_address=review.property_address,
        is_anonymous=review.is_anonymous,
        move_in_date=review.move_in_date,
        move_out_date=review.move_out_date,
        formatted_address=review.formatted_address,
        latitude=review.latitude,
        longitude=review.longitude,
        created_at=review.created_at,
        author_email=author_email,
        is_bookmarked=is_bookmarked,
    )


@app.get("/reviews", response_model=List[schemas.ReviewOut])
def list_reviews(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_optional),
):
    limit = max(1, min(limit, 100))
    reviews = (
        db.query(models.Review)
        .order_by(models.Review.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_review(review, current_user, db) for review in reviews]


@app.post("/reviews", response_model=schemas.ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: schemas.ReviewCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    ensure_can_submit(current_user.id)

    location_data = None
    if review_in.property_address:
        location_data = geocode_address(review_in.property_address)

    review = models.Review(
        user_id=current_user.id,
        landlord_name=review_in.landlord_name,
        property_address=review_in.property_address,
        formatted_address=location_data.get("formatted_address") if location_data else None,
        latitude=location_data.get("latitude") if location_data else None,
        longitude=location_data.get("longitude") if location_data else None,
        overall_rating=_clamp_rating(review_in.overall_rating),
        maintenance_rating=_clamp_rating(review_in.maintenance_rating),
        communication_rating=_clamp_rating(review_in.communication_rating),
        respect_rating=_clamp_rating(review_in.respect_rating),
        rent_value_rating=_clamp_rating(review_in.rent_value_rating),
        would_rent_again=review_in.would_rent_again,
        monthly_rent=review_in.monthly_rent,
        move_in_date=review_in.move_in_date,
        move_out_date=review_in.move_out_date,
        is_anonymous=review_in.is_anonymous,
        review_text=review_in.review_text,
    )

    db.add(review)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(review)

    note_submission(current_user.id)

    return _serialize_review(review, current_user, db)


# Bookmark endpoints
@app.post("/bookmarks", response_model=schemas.BookmarkOut, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    bookmark_in: schemas.BookmarkCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Check if review exists
    review = db.query(models.Review).filter(models.Review.id == bookmark_in.review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    
    # Check if bookmark already exists
    existing = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id,
        models.Bookmark.review_id == bookmark_in.review_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review already bookmarked")
    
    # Create bookmark
    bookmark = models.Bookmark(
        user_id=current_user.id,
        review_id=bookmark_in.review_id
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    
    return bookmark


@app.delete("/bookmarks/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(
    review_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id,
        models.Bookmark.review_id == review_id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()


@app.get("/bookmarks", response_model=List[schemas.BookmarkOut])
def list_bookmarks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(models.Bookmark)
        .filter(models.Bookmark.user_id == current_user.id)
        .join(models.Review)
        .order_by(models.Bookmark.created_at.desc())
        .all()
    )
    return bookmarks


@app.get("/my-reviews", response_model=List[schemas.ReviewOut])
def list_my_reviews(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(models.Review)
        .filter(models.Review.user_id == current_user.id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [_serialize_review(review, current_user, db) for review in reviews]


@app.post("/seed-database")
def seed_database(
    force: bool = False,
    db: Session = Depends(get_db),
):
    """
    Endpoint to trigger the seed script programmatically.
    Available for development and testing purposes.
    """
    try:
        # Get the path to the seed script
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(script_dir, "scripts", "seed_reviews.py")
        
        if not os.path.exists(script_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Seed script not found"
            )
        
        # Build command to run the script
        cmd = [sys.executable, script_path]
        if force:
            cmd.append("--force")
        
        # Run the script
        result = subprocess.run(
            cmd,
            cwd=script_dir,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Seed script failed: {result.stderr}"
            )
        
        return {
            "success": True,
            "message": "Database seeded successfully",
            "output": result.stdout.strip(),
            "force_mode": force
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Seed script timed out"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run seed script: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=settings.is_dev,
    )
