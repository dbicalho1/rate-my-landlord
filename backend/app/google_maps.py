import os
from typing import Optional

import requests

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def geocode_address(address: str) -> Optional[dict]:
    if not GOOGLE_MAPS_API_KEY:
        # Without an API key we cannot make the request; callers should degrade gracefully.
        return None

    params = {"address": address, "key": GOOGLE_MAPS_API_KEY}
    try:
        response = requests.get(GEOCODE_URL, params=params, timeout=5)
        response.raise_for_status()
    except requests.RequestException:
        return None

    payload = response.json()
    if payload.get("status") != "OK":
        return None

    first_result = payload.get("results", [{}])[0]
    geometry = first_result.get("geometry", {}).get("location", {})

    return {
        "formatted_address": first_result.get("formatted_address"),
        "latitude": geometry.get("lat"),
        "longitude": geometry.get("lng"),
    }
