import type { Category } from './categories'

/**
 * Per-visitor state that stays on the device. Fired whenever the visitor's spots change, so the
 * map can redraw its checkmarks.
 */
export const SPOTS_EVENT = 'fryranker:spots'

export const visitorKeys = (category: Category) => ({
  untried: `${category.storageKey}_untried`,
  been: `${category.storageKey}_been`,
  /** The spots the checklist listed when it was answered, so spots added later count as unknown. */
  asked: `${category.storageKey}_asked`,
})

export function writeIds(key: string, ids: Set<number>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch {
    // Storage blocked: remember for this visit only.
  }
  window.dispatchEvent(new Event(SPOTS_EVENT))
}

export function readIds(key: string): Set<number> | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw) as number[]) : null
  } catch {
    return null
  }
}
