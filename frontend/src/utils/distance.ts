export function calculateDistanceInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function getCoordinatesForZip(zip: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('NEXT_PUBLIC_MAPBOX_API_KEY is not defined in environment');
      return null;
    }

    // Query Mapbox Geocoding API with zip code
    // Adding ", USA" helps ensure we get US zip codes
    const query = encodeURIComponent(`${zip}, USA`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&country=us&types=postcode`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature || !feature.geometry?.coordinates) return null;

    // Mapbox returns coordinates as [longitude, latitude]
    const [longitude, latitude] = feature.geometry.coordinates;

    return {
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error fetching coordinates from Mapbox:', error);
    return null;
  }
}
