"""Populate the database with sample landlord reviews for demos/dev.

Changes:
- Use only Philadelphia, PA addresses (apartments and houses) that are real, curated.
- When run with --force, also reset the local SQLite DB file before seeding.
"""

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

# Curated list of real Philadelphia addresses (apartments and houses)
# Format: (landlord_name_or_building, full_street_address, category)
PHILLY_LOCATIONS = [
    # Apartments / Buildings (Center City, University City, etc.)
    ("The Franklin Residences", "834 Chestnut St, Philadelphia, PA 19107", "apartment"),
    ("The Murano", "2101 Market St, Philadelphia, PA 19103", "apartment"),
    ("The Drake", "1512 Spruce St, Philadelphia, PA 19102", "apartment"),
    ("Two Liberty Place Residences", "50 S 16th St, Philadelphia, PA 19102", "apartment"),
    ("2116 Chestnut", "2116 Chestnut St, Philadelphia, PA 19103", "apartment"),
    ("The Ludlow", "1101 Ludlow St, Philadelphia, PA 19107", "apartment"),
    ("One Water Street", "250 N Columbus Blvd, Philadelphia, PA 19106", "apartment"),
    ("3737 Chestnut", "3737 Chestnut St, Philadelphia, PA 19104", "apartment"),
    ("Domus", "3411 Chestnut St, Philadelphia, PA 19104", "apartment"),
    ("The Collins", "1125 Sansom St, Philadelphia, PA 19107", "apartment"),
    ("The Broadridge", "1300 Fairmount Ave, Philadelphia, PA 19123", "apartment"),
    ("Piazza Alta", "1001 N 2nd St, Philadelphia, PA 19123", "apartment"),
    ("The Avenir", "42 S 15th St, Philadelphia, PA 19102", "apartment"),
    ("The Hamilton", "1500 Hamilton St, Philadelphia, PA 19130", "apartment"),
    ("Park Towne Place", "2200 Benjamin Franklin Pkwy, Philadelphia, PA 19130", "apartment"),
    # Houses / Rowhomes in various neighborhoods
    ("Private Owner", "2017 Tasker St, Philadelphia, PA 19145", "house"),
    ("Private Owner", "1624 Catharine St, Philadelphia, PA 19146", "house"),
    ("Private Owner", "2231 E Susquehanna Ave, Philadelphia, PA 19125", "house"),
    ("Private Owner", "808 N 24th St, Philadelphia, PA 19130", "house"),
    ("Private Owner", "1333 S 17th St, Philadelphia, PA 19146", "house"),
    ("Private Owner", "611 Carpenter St, Philadelphia, PA 19147", "house"),
    ("Private Owner", "1927 E York St, Philadelphia, PA 19125", "house"),
    ("Private Owner", "5017 Hazel Ave, Philadelphia, PA 19143", "house"),
    ("Private Owner", "1528 N 28th St, Philadelphia, PA 19121", "house"),
    ("Private Owner", "829 S 8th St, Philadelphia, PA 19147", "house"),
]


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

    # Each entry: (name, address, base_overall_rating)
    # Assign a plausible base rating per location to vary output
    landlords = [
        (name, addr, rating)
        for (name, addr, _cat), rating in zip(
            PHILLY_LOCATIONS,
            [4.4, 4.1, 3.6, 4.3, 3.8, 4.0, 3.7, 4.2, 4.0, 3.9, 3.5, 4.1, 3.8, 3.7, 4.2, 3.6, 3.7, 3.9, 3.4, 3.8, 3.6, 3.7, 3.5, 3.9, 3.8],
        )
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

        # Clamp overall rating to [0, 5]
        adjusted_overall = overall_rating + rnd.uniform(-0.5, 0.5)
        adjusted_overall = max(0.0, min(5.0, adjusted_overall))

        review = Review(
            user_id=author.id,
            landlord_name=landlord_name,
            property_address=address,
            formatted_address=address,
            overall_rating=round(adjusted_overall, 1),
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
                f"{SAMPLE_MARKER} Lived at {landlord_name} in Philadelphia. "
                f"We appreciated the {rnd.choice(amenities)}, though there was {rnd.choice(amenities)}. "
                f"Overall experience was {'positive' if overall_rating >= 3.5 else 'mixed'}."
            ),
        )
        session.add(review)
        reviews_added += 1

    session.commit()
    return reviews_added


def reset_sqlite_db_if_requested() -> bool:
    """If using a SQLite file DB and --force was passed, delete the file.

    Returns True if a reset was performed.
    """
    # Detect if engine is SQLite and points to a local file
    url = engine.url
    if url.get_backend_name() != "sqlite":
        return False

    db_path = url.database  # may be relative like './rate_my_landlord.db'
    if not db_path:
        return False
    abs_path = os.path.abspath(db_path)
    if os.path.exists(abs_path):
        os.remove(abs_path)
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the database with sample landlord reviews.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reset SQLite DB (if used) and replace existing sample reviews.",
    )
    args = parser.parse_args()

    if args.force:
        did_reset = reset_sqlite_db_if_requested()
        if did_reset:
            print("Reset local SQLite database file.")

    ensure_tables()

    session = SessionLocal()
    try:
        if args.force:
            # On non-SQLite or if DB file wasn't removed, clear old sample rows
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
