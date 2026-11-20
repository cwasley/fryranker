import type { Category } from './categories'
import type { Item } from './items'

/** Days roll over at midnight Los Angeles time, for every visitor. */
const ZONE = 'America/Los_Angeles'

/** "2026-11-20" for the given moment, in Los Angeles. */
export function dayOf(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** The day before `day` ("2026-11-20" → "2026-11-19"). */
export function dayBefore(day: string) {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Small seeded generator, so a day always gives the same pair on every device and server. */
function seeded(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(category: Category, day: string) {
  let h = 2166136261
  for (const c of `${category.key}:${day}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h
}

/**
 * The day's featured matchup: two national items (never local spots, since everyone should be
 * able to answer it), the same for everyone. Never repeats the previous day's pair.
 */
export function dailyPair(category: Category, day: string): [Item, Item] {
  const pool = category.items.filter((item) => item.city === undefined)
  const pick = (d: string): [Item, Item] => {
    const random = seeded(seedOf(category, d))
    const a = Math.floor(random() * pool.length)
    let b = Math.floor(random() * (pool.length - 1))
    if (b >= a) b += 1
    return [pool[a], pool[b]]
  }
  const pair = pick(day)
  const [x, y] = pick(dayBefore(day))
  const same = (p: [Item, Item]) =>
    (p[0].id === x.id && p[1].id === y.id) || (p[0].id === y.id && p[1].id === x.id)
  return same(pair) ? pick(`${day}+`) : pair
}

/** Votes on a day's featured pair: `[votes for pair[0], votes for pair[1]]`. */
export type DailyTally = { day: string; ids: [number, number]; counts: [number, number] }
