import { useCallback, useSyncExternalStore } from 'react'
import type { Category } from './categories'
import { eloDelta, START_SCORE, TASTE_K } from './elo'

export type TasteEntry = { id: number; score: number; wins: number; losses: number; comps: number }
export type Taste = { entries: TasteEntry[]; comparisons: number }

const fresh = (category: Category): Taste => ({
  entries: category.items.map((item) => ({
    id: item.id,
    score: START_SCORE,
    wins: 0,
    losses: 0,
    comps: 0,
  })),
  comparisons: 0,
})

const keys = (category: Category) => ({
  taste: `${category.storageKey}_taste`,
  comparisons: `${category.storageKey}_comparisons`,
})

function parse(category: Category, rawTaste: string | null, rawComparisons: string | null): Taste {
  const base = fresh(category)
  try {
    const saved = rawTaste ? (JSON.parse(rawTaste) as TasteEntry[]) : []
    const byId = new Map(saved.map((entry) => [entry.id, entry]))
    return {
      entries: base.entries.map((entry) => byId.get(entry.id) ?? entry),
      comparisons: Number.parseInt(rawComparisons ?? '0', 10) || 0,
    }
  } catch {
    return base
  }
}

// useSyncExternalStore needs a stable snapshot, so each category's parsed value is
// cached against the raw strings it came from.
const snapshots = new Map<string, { raw: string; taste: Taste }>()
const serverSnapshots = new Map<string, Taste>()
const listeners = new Set<() => void>()
let storageWorks = true

function read(category: Category): Taste {
  const cached = snapshots.get(category.key)
  if (!storageWorks && cached) return cached.taste
  let rawTaste: string | null = null
  let rawComparisons: string | null = null
  try {
    rawTaste = localStorage.getItem(keys(category).taste)
    rawComparisons = localStorage.getItem(keys(category).comparisons)
  } catch {
    storageWorks = false
  }
  const raw = `${rawTaste}\n${rawComparisons}`
  if (cached?.raw === raw) return cached.taste
  const taste = parse(category, rawTaste, rawComparisons)
  snapshots.set(category.key, { raw, taste })
  return taste
}

function write(category: Category, taste: Taste) {
  const rawTaste = JSON.stringify(taste.entries)
  const rawComparisons = String(taste.comparisons)
  try {
    localStorage.setItem(keys(category).taste, rawTaste)
    localStorage.setItem(keys(category).comparisons, rawComparisons)
  } catch {
    storageWorks = false
  }
  snapshots.set(category.key, { raw: `${rawTaste}\n${rawComparisons}`, taste })
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function useTaste(category: Category) {
  const taste = useSyncExternalStore(
    subscribe,
    () => read(category),
    () => {
      if (!serverSnapshots.has(category.key)) serverSnapshots.set(category.key, fresh(category))
      return serverSnapshots.get(category.key)!
    }
  )

  const record = useCallback(
    (winnerId: number, loserId: number) => {
      const current = read(category)
      const winner = current.entries.find((entry) => entry.id === winnerId)
      const loser = current.entries.find((entry) => entry.id === loserId)
      if (!winner || !loser) return
      const delta = eloDelta(winner.score, loser.score, TASTE_K)
      write(category, {
        comparisons: current.comparisons + 1,
        entries: current.entries.map((entry) =>
          entry.id === winnerId
            ? { ...entry, score: entry.score + delta, wins: entry.wins + 1, comps: entry.comps + 1 }
            : entry.id === loserId
              ? {
                  ...entry,
                  score: entry.score - delta,
                  losses: entry.losses + 1,
                  comps: entry.comps + 1,
                }
              : entry
        ),
      })
    },
    [category]
  )

  const reset = useCallback(() => write(category, fresh(category)), [category])

  return { taste, record, reset }
}

export const rankedTaste = (taste: Taste) => [...taste.entries].sort((a, b) => b.score - a.score)
