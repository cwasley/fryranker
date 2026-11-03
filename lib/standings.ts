import { cache } from 'react'
import type { Category } from './categories'
import { db } from './db'
import { START_SCORE } from './elo'
import type { Item } from './items'

export type Ranked = Item & { score: number; battles: number; rank: number }

export type Standings = { items: Ranked[]; totalVotes: number }

export type HeadToHead = { wins: number; losses: number }

export const getStandings = cache(async (category: Category): Promise<Standings> => {
  const sql = db()
  const rows = (await sql`SELECT id, score, battles FROM ${sql.unsafe(category.table)}`) as {
    id: number
    score: number
    battles: number
  }[]
  const byId = new Map(rows.map((row) => [row.id, row]))
  const items = category.items
    .map((item) => ({
      ...item,
      score: byId.get(item.id)?.score ?? START_SCORE,
      battles: byId.get(item.id)?.battles ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score || b.battles - a.battles || a.name.localeCompare(b.name))
  items.forEach((item, index) => (item.rank = index + 1))
  const totalVotes = Math.round(items.reduce((sum, item) => sum + item.battles, 0) / 2)
  return { items, totalVotes }
})

const pairKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`)

export const getMatchups = cache(async (category: Category) => {
  const rows = (await db()`
    SELECT a, b, a_wins, b_wins FROM matchups WHERE category = ${category.key}
  `) as { a: number; b: number; a_wins: number; b_wins: number }[]
  const pairs = new Map(rows.map((row) => [pairKey(row.a, row.b), row]))
  return {
    /** Head-to-head record of `id` against `opponent`, counted since matchups were first logged. */
    record(id: number, opponent: number): HeadToHead {
      const row = pairs.get(pairKey(id, opponent))
      if (!row) return { wins: 0, losses: 0 }
      return row.a === id
        ? { wins: row.a_wins, losses: row.b_wins }
        : { wins: row.b_wins, losses: row.a_wins }
    },
    pairs: rows,
    rows: rows.map((r): MatchupRow => [r.a, r.b, r.a_wins, r.b_wins]),
  }
})

export type Matchups = Awaited<ReturnType<typeof getMatchups>>

/** Matchup pages stay out of search results until their split comes from direct votes. */
export { DIRECT_VOTES as INDEXABLE_MATCHUP_VOTES } from './reveal'

/** Compact `[a, b, aWins, bWins]` rows for the client, which looks up splits as people vote. */
export type MatchupRow = [number, number, number, number]

export const MATCHUPS_SINCE = 'November 2026'
