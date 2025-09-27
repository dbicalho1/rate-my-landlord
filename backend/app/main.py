import os
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
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    return schemas.Token(access_token=access_token)


def _serialize_review(review: models.Review) -> schemas.ReviewOut:
    base = schemas.ReviewOut.from_orm(review)
    author_email = None if review.is_anonymous else (review.author.email if review.author else None)
    return base.copy(update={"author_email": author_email})


@app.get("/reviews", response_model=List[schemas.ReviewOut])
def list_reviews(
    limit: int = 20,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 100))
    reviews = (
        db.query(models.Review)
        .order_by(models.Review.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_review(review) for review in reviews]


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
        overall_rating=review_in.overall_rating,
        maintenance_rating=review_in.maintenance_rating,
        communication_rating=review_in.communication_rating,
        respect_rating=review_in.respect_rating,
        rent_value_rating=review_in.rent_value_rating,
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

    return _serialize_review(review)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=settings.is_dev,
    )
