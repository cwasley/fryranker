import { createHash } from 'node:crypto'
import { getCategory, type Category } from './categories'
import { db } from './db'
import { GLOBAL_K } from './elo'

const DEFAULT_LIMIT_PER_MINUTE = 30

function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const salt = process.env.RATE_LIMIT_SALT || process.env.DATABASE_URL || 'fallback-salt'
  return createHash('sha256').update(`${salt}|${scope}|${ip}|${ua}`).digest('hex')
}

/** Everything one vote writes, in order. The third statement returns the two updated rows. */
export function voteStatements(
  sql: ReturnType<typeof db>,
  category: Category,
  key: string,
  winnerId: number,
  loserId: number
) {
  const table = sql.unsafe(category.table)
  return [
    sql`INSERT INTO vote_events (key, scope) VALUES (${key}, ${category.key})`,
    // Locking both rows first makes the read-modify-write below safe under concurrent votes.
    sql`SELECT id FROM ${table} WHERE id IN (${winnerId}, ${loserId}) ORDER BY id FOR UPDATE`,
    sql`
      WITH d AS (
        SELECT ROUND(${GLOBAL_K} * (1 - 1 / (1 + POWER(10, (l.score - w.score) / 400.0))))::int AS delta
        FROM ${table} w, ${table} l WHERE w.id = ${winnerId} AND l.id = ${loserId}
      )
      UPDATE ${table} t
      SET score = t.score + CASE WHEN t.id = ${winnerId} THEN d.delta ELSE -d.delta END,
          battles = t.battles + 1
      FROM d WHERE t.id IN (${winnerId}, ${loserId})
      RETURNING t.id, t.score, t.battles
    `,
    sql`
      INSERT INTO matchups (category, a, b, a_wins, b_wins)
      VALUES (
        ${category.key}, LEAST(${winnerId}::int, ${loserId}::int), GREATEST(${winnerId}::int, ${loserId}::int),
        CASE WHEN ${winnerId}::int < ${loserId}::int THEN 1 ELSE 0 END,
        CASE WHEN ${winnerId}::int < ${loserId}::int THEN 0 ELSE 1 END
      )
      ON CONFLICT (category, a, b) DO UPDATE
      SET a_wins = matchups.a_wins + EXCLUDED.a_wins, b_wins = matchups.b_wins + EXCLUDED.b_wins
    `,
    sql`INSERT INTO votes (category, winner, loser) VALUES (${category.key}, ${winnerId}, ${loserId})`,
  ]
}

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

export async function recordVote(request: Request, categoryKey: string) {
  const category = getCategory(categoryKey)
  if (!category) return json({ error: 'Unknown category' }, 404)

  const body = await request.json().catch(() => null)
  const winnerId = body?.winnerId
  const loserId = body?.loserId
  const ids = new Set(category.items.map((item) => item.id))
  if (!ids.has(winnerId) || !ids.has(loserId) || winnerId === loserId) {
    return json({ error: 'Invalid winner or loser ID' }, 400)
  }

  const sql = db()
  const key = clientKey(request, category.key)
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE || DEFAULT_LIMIT_PER_MINUTE)

  try {
    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count FROM vote_events
      WHERE key = ${key} AND scope = ${category.key} AND created_at > NOW() - INTERVAL '1 minute'
    `) as { count: number }[]
    if (count >= limit) {
      return json({ error: 'Rate limited. Please slow down.' }, 429, { 'Retry-After': '60' })
    }

    const [, , updated] = await sql.transaction(
      voteStatements(sql, category, key, winnerId, loserId)
    )

    if (Math.random() < 0.01) {
      await sql`DELETE FROM vote_events WHERE created_at < NOW() - INTERVAL '2 days'`
    }

    const rows = updated as { id: number; score: number; battles: number }[]
    const winner = rows.find((row) => row.id === winnerId)
    const loser = rows.find((row) => row.id === loserId)
    if (!winner || !loser) return json({ error: 'Item not found' }, 404)

    return json({
      success: true,
      updates: {
        winner: { id: winnerId, newScore: winner.score, battles: winner.battles },
        loser: { id: loserId, newScore: loser.score, battles: loser.battles },
      },
    })
  } catch (error) {
    console.error('Error recording vote:', error)
    return json({ error: 'Failed to record vote' }, 500)
  }
}
