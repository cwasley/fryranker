/** Cities with a local board. A city's key is its URL segment: `/fries/in/<key>`. */
export type City = {
  key: string
  name: string
  /** Short name for tight spots: "In LA?" */
  short: string
  lat: number
  lng: number
  /** How far out from the center counts as "near" this city. */
  radiusKm: number
}

export const cities: City[] = [
  {
    key: 'los-angeles',
    name: 'Los Angeles',
    short: 'LA',
    lat: 34.0522,
    lng: -118.2437,
    radiusKm: 80,
  },
]

export const getCity = (key: string | undefined) => cities.find((city) => city.key === key)

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLng = (bLng - aLng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** The closest city with a board, if the point is inside its radius. */
export function nearestCity(lat: number, lng: number): City | undefined {
  let best: { city: City; km: number } | undefined
  for (const city of cities) {
    const km = distanceKm(lat, lng, city.lat, city.lng)
    if (km <= city.radiusKm && (!best || km < best.km)) best = { city, km }
  }
  return best?.city
}
