import { db } from '@/lib/db'
import { allow } from '@/lib/limits'
import { getDesign } from '@/lib/merch'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/**
 * `POST /api/merch {design}`: one "Want this?" tap. The page only lets each device tap a design
 * once; the server caps each IP at 20 taps a day so nobody can stuff the counts.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const design = typeof body?.design === 'string' ? getDesign(body.design) : undefined
  if (!design) return json({ error: 'Unknown design' }, 400)
  const sql = db()
  if (!(await allow(sql, request, 'merch', 20, '1 day'))) {
    return json({ error: 'Thanks! We got the message.' }, 429)
  }
  const [row] = (await sql`
    INSERT INTO merch_interest (design, count) VALUES (${design.id}, 1)
    ON CONFLICT (design) DO UPDATE SET count = merch_interest.count + 1
    RETURNING count
  `) as { count: number }[]
  return json({ count: row.count })
}
