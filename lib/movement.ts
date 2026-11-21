import { cache } from 'react'
import type { Category } from './categories'
import { db } from './db'
import type { Ranked } from './standings'

/** How far back "this week" looks. */
export const WINDOW_DAYS = 7

/** Net points each item gained in the window, or null until the vote log covers a full window. */
const getWeekChanges = cache(async (category: Category) => {
  const sql = db()
  const [{ since }] = (await sql`
    SELECT MIN(created_at) <= NOW() - ${`${WINDOW_DAYS} days`}::interval AS since
    FROM votes WHERE category = ${category.key} AND delta IS NOT NULL
  `) as { since: boolean | null }[]
  if (!since) return null
  const rows = (await sql`
    SELECT id, SUM(change)::int AS change FROM (
      SELECT winner AS id, delta AS change FROM votes
      WHERE category = ${category.key} AND delta IS NOT NULL
        AND created_at > NOW() - ${`${WINDOW_DAYS} days`}::interval
      UNION ALL
      SELECT loser AS id, -delta AS change FROM votes
      WHERE category = ${category.key} AND delta IS NOT NULL
        AND created_at > NOW() - ${`${WINDOW_DAYS} days`}::interval
    ) moves GROUP BY id
  `) as { id: number; change: number }[]
  return new Map(rows.map((row) => [row.id, row.change]))
})

/**
 * Places each ranked item moved this week on a board (positive = up), from the points it gained
 * or lost. Empty until the vote log covers a full week; new items never get an entry.
 */
export function movementOf(items: Ranked[], changes: Map<number, number> | null) {
  const moved = new Map<number, number>()
  if (!changes) return moved
  const ranked = items.filter((item) => !item.isNew)
  const before = [...ranked]
    .map((item) => ({ item, score: item.score - (changes.get(item.id) ?? 0) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.item.battles - a.item.battles ||
        a.item.name.localeCompare(b.item.name)
    )
  before.forEach(({ item }, index) => moved.set(item.id, index + 1 - item.rank))
  return moved
}

export async function getMovement(category: Category, items: Ranked[]) {
  return movementOf(items, await getWeekChanges(category))
}

/** "▲3" / "▼1", or nothing for no change. */
export const movementLabel = (n: number | undefined) => (!n ? '' : n > 0 ? `▲${n}` : `▼${-n}`)
