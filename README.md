# Rate My Landlord

A landlord review platform built specifically for Philadelphia renters. Share experiences, browse reviews by neighborhood, and help fellow Philadelphians make better rental decisions.

## The Stack
- Clean REST API with proper validation (based?)
- Seeded with realistic fake data for testing (french for just generating fake data)
- Deployed using railway

**Frontend** - Next.js 15 + TypeScript + Tailwind (silas tried his best..)
- Client-side rendered (needed for auth state and interactivity)
- shadcn/ui components for consistent design
- _ABSOLUTELY AMAZING_ animations that don't suck

## Cool Features
<!-- Force sync -->

- **Neighborhood-specific search** - Filter by actual Philly neighborhoods (Fishtown, Northern Liberties, etc.)
- **Street View integration** - See the actual properties with Google Maps
- **Anonymous reviews** - Users can choose to review anonymously or with their email
- **Bookmark system** - Save reviews you want to reference later
- **Philadelphia-focused** - No generic "city" nonsense, this is built for Philly renters (may change in the fuuch)

## Running Locally

Backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python scripts/seed_reviews.py  # adds fake data
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
bun install && bun run dev
```

You'll need a Google Maps API key for the street view images.

## What's Different

Most rental review sites are generic and clunky. This one:
- Actually understands Philadelphia geography
- Shows you the property with street view
- Has a clean, fast interface that doesn't feel like 2010
- Lets you filter by the neighborhoods that matter
- Doesn't try to monetize your misery (it's free)