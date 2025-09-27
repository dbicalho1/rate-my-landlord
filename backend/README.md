# RateMyLandlord Backend

FastAPI backend for landlord review platform.

## Development

```sh
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deployment

Deployed on Railway: https://railway.com/project/59cc92ac-d9d8-4e45-ad0e-a271bbb9dda9

## Features

- User authentication (JWT)
- Create and list landlord reviews
- Multi-dimensional ratings
- Google Maps address geocoding (WIP)
- Rate limiting
- Anonymous reviews

## Sample Data

Generate demo data:
```sh
python scripts/seed_reviews.py
```