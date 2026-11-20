import type { Category } from './categories'
import { dailyPair, dayBefore, dayOf, type DailyTally } from './daily'
import { db } from './db'

/**
 * How today's and yesterday's featured pairs are going, from the `votes` log (any vote on that
 * pair that day counts, whether cast from the daily card or the ranker).
 */
export async function getDailyTallies(category: Category): Promise<DailyTally[]> {
  const today = dayOf(new Date())
  const days = [dayBefore(today), today]
  const rows = (await db()`
    SELECT (created_at AT TIME ZONE 'America/Los_Angeles')::date::text AS day,
           winner, loser, COUNT(*)::int AS n
    FROM votes
    WHERE category = ${category.key}
      AND created_at > NOW() - INTERVAL '3 days'
      AND (created_at AT TIME ZONE 'America/Los_Angeles')::date::text = ANY(${days}::text[])
    GROUP BY 1, 2, 3
  `) as { day: string; winner: number; loser: number; n: number }[]
  return days.map((day) => {
    const [a, b] = dailyPair(category, day)
    const count = (winner: number, loser: number) =>
      rows.find((r) => r.day === day && r.winner === winner && r.loser === loser)?.n ?? 0
    return { day, ids: [a.id, b.id], counts: [count(a.id, b.id), count(b.id, a.id)] }
  })
}
