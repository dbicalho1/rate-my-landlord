# Rate My Philly Landlord

A simple web app for Philadelphia renters to share and browse landlord reviews.

## Running the app

```bash
bun install && bun run dev
```

Then go to http://localhost:3000

## Environment variables

Create one of the following files depending on environment:

- `.env.local` for local development
- `.env.production` for production builds

Required vars:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — your Google Maps API key
- `NEXT_PUBLIC_API_URL` — backend base URL (e.g. `http://localhost:8000` in dev)

This repo includes a `.env.production` pointing to the production backend:

```
NEXT_PUBLIC_API_URL=https://railway.com/project/59cc92ac-d9d8-4e45-ad0e-a271bbb9dda9
```

Note: ensure this points to your publicly accessible backend URL.

## What you need

- A Google Maps API key (for street view images)
- The backend running on port 8000

## Production build

```bash
bun run build
bun run start
```

The frontend reads `NEXT_PUBLIC_API_URL` in production and will error during build if it is not set. Set it via `.env.production` or your hosting platform’s env settings.

## Features

- Browse landlord reviews for Philadelphia neighborhoods
- Submit your own reviews (with custom auth)
- Search by neighborhood or address
- Save reviews you want to remember
