"""Populate the database with sample landlord reviews for demos/dev."""

import argparse
from datetime import date, timedelta
import os
import random
import sys
from typing import List

from sqlalchemy import select

# Add the parent directory to the Python path to import from app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, SessionLocal, engine
from app.models import Review, User
from app.auth import get_password_hash

SAMPLE_MARKER = "[Sample Data]"
SAMPLE_USER_EMAILS = [f"tenant{i+1}@example.com" for i in range(5)]
DEFAULT_PASSWORD = "password123"
TARGET_REVIEW_COUNT = 25


def ensure_tables() -> None:
    Base.metadata.create_all(bind=engine)


def create_or_get_users(session) -> List[User]:
    users: List[User] = []
    for email in SAMPLE_USER_EMAILS:
        user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            user = User(email=email, hashed_password=get_password_hash(DEFAULT_PASSWORD))
            session.add(user)
            session.flush()
        users.append(user)
    return users


def delete_existing_samples(session) -> int:
    result = session.query(Review).filter(Review.review_text.contains(SAMPLE_MARKER)).delete(synchronize_session=False)
    session.commit()
    return result or 0


def create_reviews(session, users) -> int:
    existing_samples = (
        session.query(Review)
        .filter(Review.review_text.contains(SAMPLE_MARKER))
        .count()
    )
    if existing_samples >= TARGET_REVIEW_COUNT:
        return 0

    landlords = [
        ("Harborview Management", "12 Seaside Ave, Boston, MA", 4.5),
        ("Maple & Main Realty", "482 Maple Street, Denver, CO", 3.8),
        ("Cedar Grove Holdings", "219 Grove Ave, Portland, OR", 4.0),
        ("Sunset City Rentals", "901 Sunset Blvd, Los Angeles, CA", 2.9),
        ("Riverside Estates", "77 River Rd, Austin, TX", 4.7),
        ("Northstar Property Group", "310 Polaris Way, Minneapolis, MN", 3.5),
        ("Oak & Stone Partners", "55 Oak St, Chicago, IL", 4.2),
        ("Urban Nest Management", "208 Pine St, Seattle, WA", 4.1),
        ("Hilltop Realty", "640 Hilltop Dr, Raleigh, NC", 3.2),
        ("Blue Horizon Leasing", "150 Bayfront Ave, Miami, FL", 4.6),
    ]

    amenities = [
        "fast maintenance turnaround",
        "quiet neighbors",
        "friendly landlord",
        "dated appliances",
        "flexible lease terms",
        "responsive property manager",
        "slow deposit return",
        "excellent sunlight",
        "secure building",
        "limited parking",
    ]

    rnd = random.Random(42)
    reviews_added = 0
    base_date = date(2020, 1, 1)

    for idx in range(TARGET_REVIEW_COUNT):
        landlord_name, address, overall_rating = landlords[idx % len(landlords)]
        author = users[idx % len(users)]

        maintenance = max(0.0, min(5.0, overall_rating + rnd.uniform(-1.0, 1.0)))
        communication = max(0.0, min(5.0, overall_rating + rnd.uniform(-1.2, 0.8)))
        respect = max(0.0, min(5.0, overall_rating + rnd.uniform(-0.6, 0.6)))
        rent_value = max(0.0, min(5.0, overall_rating + rnd.uniform(-1.0, 1.0)))

        move_in = base_date + timedelta(days=90 * idx)
        move_out = move_in + timedelta(days=365 + 15 * (idx % 4))

        review = Review(
            user_id=author.id,
            landlord_name=landlord_name,
            property_address=address if idx % 2 == 0 else None,
            formatted_address=address if idx % 2 == 0 else None,
            overall_rating=round(overall_rating + rnd.uniform(-0.5, 0.5), 1),
            maintenance_rating=round(maintenance, 1),
            communication_rating=round(communication, 1),
            respect_rating=round(respect, 1),
            rent_value_rating=round(rent_value, 1),
            would_rent_again=(overall_rating >= 3.5 and idx % 5 != 0),
            monthly_rent=1400 + (idx % 7) * 85,
            move_in_date=move_in,
            move_out_date=move_out,
            is_anonymous=(idx % 4 == 0),
            review_text=(
                f"{SAMPLE_MARKER} Stayed with {landlord_name} for about a year. "
                f"We appreciated the {rnd.choice(amenities)}, though there was {rnd.choice(amenities)}. "
                f"Overall experience was {'positive' if overall_rating >= 3.5 else 'mixed'}."
            ),
        )
        session.add(review)
        reviews_added += 1

    session.commit()
    return reviews_added


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the database with sample landlord reviews.")
    parser.add_argument("--force", action="store_true", help="Replace existing sample reviews.")
    args = parser.parse_args()

    ensure_tables()

    session = SessionLocal()
    try:
        if args.force:
            deleted = delete_existing_samples(session)
            if deleted:
                print(f"Removed {deleted} existing sample reviews.")

        users = create_or_get_users(session)
        session.commit()

        added = create_reviews(session, users)
        if added:
            print(f"Inserted {added} sample reviews.")
        else:
            print("Sample reviews already present; nothing to do.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
