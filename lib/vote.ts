import { createHash } from 'node:crypto'
import { getCategory, type Category } from './categories'
import { db } from './db'
import { GLOBAL_K } from './elo'

/** Votes a minute from one visitor (IP plus browser). */
const DEFAULT_LIMIT_PER_MINUTE = 30
/**
 * Votes a minute from one IP address, across every browser on it. Higher than the visitor limit
 * so people sharing a network (phone carriers, offices, campuses) don't block each other, but it
 * stops a script from dodging the visitor limit by sending a new user agent with each vote.
 */
const DEFAULT_IP_LIMIT_PER_MINUTE = 120

function clientKeys(request: Request, scope: string) {
  // On Vercel, x-forwarded-for is set by the platform, so clients can't spoof it.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const salt = process.env.RATE_LIMIT_SALT || process.env.DATABASE_URL || 'fallback-salt'
  const hash = (value: string) => createHash('sha256').update(`${salt}|${value}`).digest('hex')
  return {
    visitor: { key: hash(`${scope}|${ip}|${ua}`), scope },
    network: { key: hash(`${scope}|ip|${ip}`), scope: `${scope}:ip` },
  }
}

type Keys = ReturnType<typeof clientKeys>

/** Everything one vote writes, in order. The fourth statement returns the two updated rows. */
export function voteStatements(
  sql: ReturnType<typeof db>,
  category: Category,
  keys: Keys,
  winnerId: number,
  loserId: number
) {
  return [
    sql`
      INSERT INTO vote_events (key, scope)
      VALUES (${keys.visitor.key}, ${keys.visitor.scope}), (${keys.network.key}, ${keys.network.scope})
    `,
    // Locking both rows first makes the read-modify-write below safe under concurrent votes.
    sql`
      SELECT id FROM items
      WHERE category = ${category.key} AND id IN (${winnerId}, ${loserId})
      ORDER BY id FOR UPDATE
    `,
    sql`
      WITH d AS (
        SELECT ROUND(${GLOBAL_K} * (1 - 1 / (1 + POWER(10, (l.score - w.score) / 400.0))))::int AS delta
        FROM items w, items l
        WHERE w.category = ${category.key} AND w.id = ${winnerId}
          AND l.category = ${category.key} AND l.id = ${loserId}
      )
      UPDATE items t
      SET score = t.score + CASE WHEN t.id = ${winnerId} THEN d.delta ELSE -d.delta END,
          battles = t.battles + 1
      FROM d WHERE t.category = ${category.key} AND t.id IN (${winnerId}, ${loserId})
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

/** Votes logged in the last minute for this visitor and for their whole IP address. */
export function recentVotes(sql: ReturnType<typeof db>, keys: Keys) {
  return sql`
    SELECT
      COUNT(*) FILTER (WHERE key = ${keys.visitor.key} AND scope = ${keys.visitor.scope})::int AS visitor,
      COUNT(*) FILTER (WHERE key = ${keys.network.key} AND scope = ${keys.network.scope})::int AS network
    FROM vote_events
    WHERE key IN (${keys.visitor.key}, ${keys.network.key}) AND created_at > NOW() - INTERVAL '1 minute'
  `
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
  const keys = clientKeys(request, category.key)
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE || DEFAULT_LIMIT_PER_MINUTE)
  const ipLimit = Number(process.env.RATE_LIMIT_PER_IP_PER_MINUTE || DEFAULT_IP_LIMIT_PER_MINUTE)

  try {
    const [recent] = (await recentVotes(sql, keys)) as { visitor: number; network: number }[]
    if (recent.visitor >= limit || recent.network >= ipLimit) {
      return json({ error: 'Rate limited. Please slow down.' }, 429, { 'Retry-After': '60' })
    }

    const [, , updated] = await sql.transaction(
      voteStatements(sql, category, keys, winnerId, loserId)
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
