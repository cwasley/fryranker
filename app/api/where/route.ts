import { nearestCity } from '@/lib/cities'

/**
 * Which city board, if any, the visitor is near. Uses the rough location Vercel adds to every
 * request from the visitor's IP address: no permission prompt, and nothing is stored.
 */
export function GET(request: Request) {
  const lat = Number(request.headers.get('x-vercel-ip-latitude'))
  const lng = Number(request.headers.get('x-vercel-ip-longitude'))
  const known = request.headers.has('x-vercel-ip-latitude') && Number.isFinite(lat + lng)
  const city = known ? (nearestCity(lat, lng)?.key ?? null) : null
  return Response.json({ city }, { headers: { 'Cache-Control': 'private, no-store' } })
}
