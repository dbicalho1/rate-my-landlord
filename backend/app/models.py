from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviews = relationship("Review", back_populates="author", cascade="all,delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

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
