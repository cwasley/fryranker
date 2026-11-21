import { cutOf } from './glyphs'
import type { Item } from './items'

/** Traits we can read off an item's style, tags and note, each with how to say it to a person. */
const TRAITS: { key: string; label: string; test: RegExp }[] = [
  {
    key: 'crunch',
    label: 'extra crunch',
    test: /crisp|crunch|snappy|craggy|shell|double fried|twice/i,
  },
  { key: 'soft', label: 'soft, fluffy middles', test: /soft|fluffy|plush|melt/i },
  {
    key: 'spice',
    label: 'some heat',
    test: /spic|cajun|chile|chili flake|pepper|heat|nacho|numbing/i,
  },
  {
    key: 'loaded',
    label: 'loaded fries',
    test: /chili|cheese|gravy|loaded|asada|disco|smothered/i,
  },
  { key: 'garlic', label: 'garlic', test: /garlic|aioli/i },
  { key: 'fat', label: 'tallow or duck fat', test: /tallow|duck fat/i },
  { key: 'seasoned', label: 'bold seasoning', test: /season|dust|sumac|paprika|old bay|cajun/i },
  { key: 'dip', label: 'great dips', test: /dip|sauce|aioli|ketchup/i },
]

const CUT_LABEL: Record<string, string> = {
  shoestring: 'thin shoestrings',
  thick: 'thick cuts',
  crinkle: 'crinkle cuts',
  waffle: 'waffle fries',
  curly: 'curly fries',
  wedge: 'wedges',
  tots: 'tots',
  seasoned: 'seasoned fries',
}

function profile(item: Item) {
  const text = [item.kind, ...item.tags, item.note].join(' ')
  return {
    cut: cutOf(item.kind),
    traits: new Set(TRAITS.filter((t) => t.test.test(text)).map((t) => t.key)),
  }
}

export type Suggestion = { item: Item; reason: string; score: number }

/**
 * Spots to try next, ranked by how much they share with the visitor's favorites. `liked` is the
 * visitor's own top picks, best first; earlier picks count more.
 */
export function suggestSpots(liked: Item[], spots: Item[], count = 3): Suggestion[] {
  if (!liked.length) return []
  const likes = liked.slice(0, 5).map((item, i) => ({ weight: 5 - i, ...profile(item) }))

  // What the visitor leans toward overall, so the reason names their taste, not one fry.
  const traitWeight = new Map<string, number>()
  const cutWeight = new Map<string, number>()
  for (const like of likes) {
    for (const t of like.traits) traitWeight.set(t, (traitWeight.get(t) ?? 0) + like.weight)
    if (like.cut !== 'classic')
      cutWeight.set(like.cut, (cutWeight.get(like.cut) ?? 0) + like.weight)
  }

  return spots
    .map((item) => {
      const spot = profile(item)
      const shared = [...spot.traits].filter((t) => traitWeight.has(t))
      // "Seasoned fries and bold seasoning" says the same thing twice.
      const sayable = spot.cut === 'seasoned' ? shared.filter((t) => t !== 'seasoned') : shared
      const score =
        (cutWeight.get(spot.cut) ?? 0) * 2 +
        shared.reduce((sum, t) => sum + (traitWeight.get(t) ?? 0), 0)
      const reasons = [
        ...(cutWeight.has(spot.cut)
          ? [{ label: CUT_LABEL[spot.cut], weight: cutWeight.get(spot.cut)! * 2 }]
          : []),
        ...sayable.map((t) => ({
          label: TRAITS.find((trait) => trait.key === t)!.label,
          weight: traitWeight.get(t)!,
        })),
      ]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 2)
        .map((r) => r.label)
      const reason = reasons.length
        ? `Because you like ${reasons.join(' and ')}.`
        : 'Something different from your usual order.'
      return { item, reason, score }
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, count)
}
