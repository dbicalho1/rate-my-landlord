export interface StreetViewOptions {
  address: string;
  width?: number;
  height?: number;
  fov?: number; // field of view (10-120 degrees)
  heading?: number; // compass heading (0-360 degrees)
  pitch?: number; // up/down angle (-90 to 90 degrees)
}

export function generateStreetViewUrl(options: StreetViewOptions): string {
  const {
    address,
    width = 400,
    height = 300,
    fov = 80,
    heading = 0,
    pitch = 0
  } = options;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  console.log('API Key available:', !!apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);

  if (!apiKey) {
    console.warn('Google Maps API key not found in environment variables');
    return '';
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
  const params = new URLSearchParams({
    location: address,
    size: `${width}x${height}`,
    fov: fov.toString(),
    heading: heading.toString(),
    pitch: pitch.toString(),
    key: apiKey
  });

  const finalUrl = `${baseUrl}?${params.toString()}`;
  console.log('Generated Street View URL:', finalUrl);

  return finalUrl;
}

export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;

  // Basic validation - address should have some meaningful content
  const trimmed = address.trim();
  return trimmed.length > 5 &&
    /[a-zA-Z]/.test(trimmed) && // Contains letters
    /\d/.test(trimmed); // Contains numbers (likely address numbers)
}

export function getFallbackMapUrl(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgNzVMMTc1IDEwMEgxNjJWMTI1SDE0VjEwMEgxMjVMMTUwIDc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE0NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2Qjc2ODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1hcCBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
}
