import { cache } from 'react'
import type { Category } from './categories'
import { db } from './db'
import { START_SCORE } from './elo'
import type { Item } from './items'

export type Ranked = Item & {
  score: number
  battles: number
  /** Position among the board's established items. New spots come after them. */
  rank: number
  /** Too few votes for a rank yet (new chains and local spots alike). */
  isNew: boolean
}

/** Items show as "New" instead of a rank until they have this many votes. */
export const NEW_UNTIL = 15

/** "#4", or "New" for a spot still being ranked. */
export const rankLabel = (item: Ranked) => (item.isNew ? 'New' : `#${item.rank}`)

export type Standings = {
  /** Established items by points, then new spots by points. */
  items: Ranked[]
  /** How many items have a rank: "#4 of `ranked`". */
  ranked: number
  totalVotes: number
}

export type HeadToHead = { wins: number; losses: number }

/** Every item's score and battle count, read once per render. */
const getScores = cache(async (category: Category) => {
  const rows = (await db()`
    SELECT id, score, battles FROM items WHERE category = ${category.key}
  `) as { id: number; score: number; battles: number }[]
  return new Map(rows.map((row) => [row.id, row]))
})

/**
 * The board for a scope: the national board (chains only) when `cityKey` is unset, or a city's
 * board (the chains plus that city's local spots). Everyone shares one points scale, so a local
 * spot's points mean the same as a chain's. `totalVotes` always counts every vote in the category.
 */
export const getStandings = cache(
  async (category: Category, cityKey?: string): Promise<Standings> => {
    const scores = await getScores(category)
    const withScores = category.items.map((item) => ({
      ...item,
      score: scores.get(item.id)?.score ?? START_SCORE,
      battles: scores.get(item.id)?.battles ?? 0,
      rank: 0,
      isNew: false,
    }))
    const totalVotes = Math.round(withScores.reduce((sum, item) => sum + item.battles, 0) / 2)
    const items = withScores
      .filter((item) => item.city === undefined || item.city === cityKey)
      .map((item) => ({ ...item, isNew: item.battles < NEW_UNTIL }))
      .sort(
        (a, b) =>
          Number(a.isNew) - Number(b.isNew) ||
          b.score - a.score ||
          b.battles - a.battles ||
          a.name.localeCompare(b.name)
      )
    items.forEach((item, index) => (item.rank = index + 1))
    const ranked = items.filter((item) => !item.isNew).length
    return { items, ranked, totalVotes }
  }
)

/** The board a page about these items should rank them on: a local spot's city, else national. */
export const scopeOf = (...items: Item[]) => items.find((item) => item.city)?.city

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
