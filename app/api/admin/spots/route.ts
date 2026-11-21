import { adminFromRequest } from '@/lib/admin'
import { db } from '@/lib/db'

const STATUSES = ['pending', 'approved', 'added', 'rejected'] as const

/** `POST /api/admin/spots {ids, status}`: approve, reject or undo suggestions. Admin only. */
export async function POST(request: Request) {
  if (!adminFromRequest(request)) return Response.json({ error: 'Log in first.' }, { status: 401 })
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Send JSON.' }, { status: 415 })
  }
  const body = await request.json().catch(() => null)
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown) => Number.isInteger(id)).slice(0, 200)
    : []
  const status = STATUSES.find((s) => s === body?.status)
  if (!ids.length || !status)
    return Response.json({ error: 'Need ids and a status.' }, { status: 400 })
  const rows = await db()`
    UPDATE spot_suggestions SET status = ${status} WHERE id = ANY(${ids}::bigint[]) RETURNING id
  `
  return Response.json({ updated: rows.length }, { headers: { 'Cache-Control': 'no-store' } })
}
