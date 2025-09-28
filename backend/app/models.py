from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, CheckConstraint
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviews = relationship("Review", back_populates="author", cascade="all,delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all,delete-orphan")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("overall_rating >= 0 AND overall_rating <= 5", name="ck_reviews_overall_rating_range"),
        CheckConstraint("maintenance_rating IS NULL OR (maintenance_rating >= 0 AND maintenance_rating <= 5)", name="ck_reviews_maintenance_rating_range"),
        CheckConstraint("communication_rating IS NULL OR (communication_rating >= 0 AND communication_rating <= 5)", name="ck_reviews_communication_rating_range"),
        CheckConstraint("respect_rating IS NULL OR (respect_rating >= 0 AND respect_rating <= 5)", name="ck_reviews_respect_rating_range"),
        CheckConstraint("rent_value_rating IS NULL OR (rent_value_rating >= 0 AND rent_value_rating <= 5)", name="ck_reviews_rent_value_rating_range"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    landlord_name = Column(String(255), nullable=False)
    property_address = Column(String(512))
    formatted_address = Column(String(512))
    latitude = Column(Float)
    longitude = Column(Float)

    overall_rating = Column(Float, nullable=False)
    maintenance_rating = Column(Float)
    communication_rating = Column(Float)
    respect_rating = Column(Float)
    rent_value_rating = Column(Float)
    would_rent_again = Column(Boolean, default=True, nullable=False)
    monthly_rent = Column(Integer)

    move_in_date = Column(Date)
    move_out_date = Column(Date)

    is_anonymous = Column(Boolean, default=False, nullable=False)

    review_text = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    author = relationship("User", back_populates="reviews")
    bookmarks = relationship("Bookmark", back_populates="review", cascade="all,delete-orphan")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookmarks")
    review = relationship("Review", back_populates="bookmarks")
