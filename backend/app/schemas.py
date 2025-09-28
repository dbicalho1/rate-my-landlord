from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional["UserOut"] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewBase(BaseModel):
    landlord_name: str = Field(..., max_length=255)
    overall_rating: float = Field(..., ge=0, le=5)
    maintenance_rating: Optional[float] = Field(None, ge=0, le=5)
    communication_rating: Optional[float] = Field(None, ge=0, le=5)
    respect_rating: Optional[float] = Field(None, ge=0, le=5)
    rent_value_rating: Optional[float] = Field(None, ge=0, le=5)
    would_rent_again: Optional[bool] = True
    monthly_rent: Optional[int] = Field(None, ge=0)
    review_text: str = Field(..., min_length=20, max_length=5000)
    property_address: Optional[str] = Field(None, max_length=512)
    is_anonymous: Optional[bool] = False
    move_in_date: Optional[date]
    move_out_date: Optional[date]

    @field_validator("move_out_date")
    @classmethod
    def validate_move_out_date(cls, v, info):
        if v and info.data.get("move_in_date") and v < info.data.get("move_in_date"):
            raise ValueError("move_out_date cannot be before move_in_date")
        return v


class ReviewCreate(ReviewBase):
    pass


class ReviewOut(ReviewBase):
    id: int
    created_at: datetime
    formatted_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    author_email: Optional[EmailStr] = None
    is_bookmarked: Optional[bool] = False

    model_config = {"from_attributes": True}


# Bookmark schemas
class BookmarkBase(BaseModel):
    review_id: int


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkOut(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime
    review: ReviewOut

    model_config = {"from_attributes": True}
