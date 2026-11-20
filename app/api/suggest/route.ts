import { citiesFor, getCategory } from '@/lib/categories'
import { getCity } from '@/lib/cities'
import { db } from '@/lib/db'
import { allow } from '@/lib/limits'
import { FRY_STYLES } from '@/lib/places'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''

/** A visitor suggests a spot for a city board. It waits for review; nothing is published. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  // Bots fill every field; people never see this one.
  if (!body || body.website) return json({ ok: true })

  const category = getCategory(text(body.category, 20))
  const city = getCity(text(body.city, 40))
  if (!category || !city || !citiesFor(category).includes(city)) {
    return json({ error: 'Unknown city.' }, 400)
  }
  const name = text(body.name, 80)
  const kind = text(body.kind, 30)
  if (name.length < 2) return json({ error: 'Add the spot’s name.' }, 400)
  if (!(FRY_STYLES as readonly string[]).includes(kind)) {
    return json({ error: 'Pick a fry style.' }, 400)
  }

  const sql = db()
  if (!(await allow(sql, request, 'suggest', 5, '1 hour'))) {
    return json({ error: 'Thanks! That’s plenty for now. Try again in an hour.' }, 429)
  }
  await sql`
    INSERT INTO spot_suggestions (category, city, name, neighborhood, address, place_id, kind, note)
    VALUES (
      ${category.key}, ${city.key}, ${name},
      ${text(body.neighborhood, 60) || null}, ${text(body.address, 160) || null},
      ${text(body.placeId, 80) || null}, ${kind}, ${text(body.note, 200) || null}
    )
  `
  return json({ ok: true })
}
