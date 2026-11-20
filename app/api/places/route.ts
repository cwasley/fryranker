import { getCity } from '@/lib/cities'
import { db } from '@/lib/db'
import { allow } from '@/lib/limits'
import { placeSearchEnabled, searchPlaces } from '@/lib/places'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** `GET /api/places?city=los-angeles&q=josephine`: restaurants for the suggest form. */
export async function GET(request: Request) {
  if (!placeSearchEnabled()) return json({ error: 'Place search is off' }, 404)
  const params = new URL(request.url).searchParams
  const city = getCity(params.get('city') ?? undefined)
  const query = (params.get('q') ?? '').trim().slice(0, 60)
  if (!city || query.length < 2) return json({ results: [] })
  if (!(await allow(db(), request, 'places', 30, '1 minute'))) {
    return json({ error: 'Slow down a little.' }, 429)
  }
  try {
    return json({ results: await searchPlaces(city, query) })
  } catch (error) {
    console.error(error)
    return json({ error: 'Search is unavailable right now.' }, 502)
  }
}
