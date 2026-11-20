import { clientKeys } from './vote'
import type { db } from './db'

/**
 * A per-IP allowance for actions other than votes, counted in `vote_events` under its own scope
 * (old rows are swept after two days, so windows up to a day work).
 */
export async function allow(
  sql: ReturnType<typeof db>,
  request: Request,
  scope: string,
  limit: number,
  window: '1 minute' | '1 hour' | '1 day'
) {
  const { network } = clientKeys(request, scope)
  const [{ count }] = (await sql`
    SELECT COUNT(*)::int AS count FROM vote_events
    WHERE key = ${network.key} AND scope = ${network.scope}
      AND created_at > NOW() - ${window}::interval
  `) as { count: number }[]
  if (count >= limit) return false
  await sql`INSERT INTO vote_events (key, scope) VALUES (${network.key}, ${network.scope})`
  return true
}
