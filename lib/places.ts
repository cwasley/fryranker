import type { City } from './cities'

/** Fry styles a visitor can pick when suggesting a spot. Matches the glyph cuts plus a few extras. */
export const FRY_STYLES = [
  'Shoestring',
  'Classic',
  'Thick Cut',
  'Crinkle Cut',
  'Waffle',
  'Curly',
  'Wedge',
  'Tots',
  'Seasoned',
  'Belgian Frites',
  'Loaded',
  'Something else',
] as const

export type PlaceResult = {
  placeId: string
  name: string
  address: string
  neighborhood: string
}

/** Place search is on when Foursquare's service key is set (`FOURSQUARE_API_KEY`). */
export const placeSearchEnabled = () => Boolean(process.env.FOURSQUARE_API_KEY)

/**
 * Restaurants matching `query` near the city's center, from Foursquare's Places API
 * (places-api.foursquare.com, version 2025-06-17). Returns [] when search is off.
 */
export async function searchPlaces(city: City, query: string): Promise<PlaceResult[]> {
  const key = process.env.FOURSQUARE_API_KEY
  if (!key) return []
  const url = new URL('https://places-api.foursquare.com/places/search')
  url.searchParams.set('query', query)
  url.searchParams.set('ll', `${city.lat},${city.lng}`)
  url.searchParams.set('radius', String(Math.min(city.radiusKm * 1000, 100_000)))
  url.searchParams.set('limit', '8')
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Places-Api-Version': '2025-06-17',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Foursquare place search failed: ${res.status}`)
  const body = (await res.json()) as {
    results?: {
      fsq_place_id?: string
      fsq_id?: string
      name?: string
      location?: { formatted_address?: string; address?: string; locality?: string }
    }[]
  }
  return (body.results ?? []).flatMap((place) => {
    const placeId = place.fsq_place_id ?? place.fsq_id
    if (!placeId || !place.name) return []
    const location = place.location ?? {}
    return [
      {
        placeId,
        name: place.name,
        address: location.formatted_address ?? location.address ?? '',
        neighborhood: location.locality ?? '',
      },
    ]
  })
}
