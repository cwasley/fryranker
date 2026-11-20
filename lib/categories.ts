import { fries } from './data/fries'
import { localFries } from './data/local/fries'
import { sauces } from './data/sauces'
import { cities, type City } from './cities'
import type { Item } from './items'

export type Insight = { label: string; value: string; hint: string }

export type Category = {
  /** Also the `category` value on this category's rows in `items`, `matchups` and `votes`. */
  key: 'fries' | 'sauces'
  items: Item[]
  /** Where the ranker lives. */
  home: string
  /** Prefix for item, matchup and share pages. */
  base: string
  navLabel: string
  one: string
  many: string
  /** "fast food fries": the phrase people search for. */
  plural: string
  kindLabel: string
  /** Heading for the item page's tag list. */
  ticketTitle: string
  voteApi: string
  storageKey: string
  insights: (top: Item[]) => Insight[]
  matchupTitle: (a: Item, b: Item) => string
}

const countMatches = (items: Item[], pattern: RegExp) =>
  items.filter((item) => item.tags.some((tag) => pattern.test(tag))).length

const leading = (counts: Map<string, number>, fallback: string) => {
  let best = fallback
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key
      bestCount = count
    }
  }
  return best
}

const styleBucket = (style: string) => {
  const s = style.toLowerCase()
  if (s.includes('waffle')) return 'Waffle'
  if (s.includes('curly')) return 'Curly'
  if (s.includes('wedge')) return 'Wedges'
  if (s.includes('tots')) return 'Tots'
  if (s.includes('crinkle')) return 'Crinkle'
  if (s.includes('shoestring') || s.includes('thin')) return 'Shoestring'
  if (s.includes('thick') || s.includes('boardwalk')) return 'Thick Cut'
  if (s.includes('fresh')) return 'Fresh Cut'
  return 'Classic'
}

const fryInsights = (top: Item[]): Insight[] => {
  const styles = new Map<string, number>()
  for (const item of top) {
    const bucket = styleBucket(item.kind)
    styles.set(bucket, (styles.get(bucket) ?? 0) + 1)
  }
  const spice = countMatches(top, /spice|cajun|nacho|pepper|heat|cumin|max seasoning/i)
  const crunch = countMatches(top, /crisp|crispy|snappy|crunch|shell|edges/i)
  const soft = countMatches(top, /soft|fluffy|plush|melt/i)
  return [
    {
      label: 'Texture',
      value:
        crunch > soft
          ? 'Crunch-chaser'
          : soft > crunch
            ? 'Soft-center loyalist'
            : 'Texture-agnostic',
      hint: 'Crunch vs soft',
    },
    {
      label: 'Seasoning',
      value: spice >= 3 ? 'Seasoning-forward' : spice === 2 ? 'Balanced' : 'Clean + classic',
      hint: 'Based on winners',
    },
    { label: 'Style lane', value: leading(styles, 'Mixed bag'), hint: 'Top 5 trend' },
  ]
}

const sauceInsights = (top: Item[]): Insight[] => {
  const heat = countMatches(top, /spice|spicy|heat|hot|fire|diablo|cajun/i)
  const creamy = countMatches(top, /creamy|mayo|ranch/i)
  const tangy = countMatches(top, /tangy|vinegar|mustard|sweet/i)
  return [
    {
      label: 'Texture',
      value: creamy > tangy ? 'Creamy lover' : tangy > creamy ? 'Tangy fan' : 'Texture-agnostic',
      hint: 'Creamy vs tangy',
    },
    {
      label: 'Heat level',
      value: heat >= 3 ? 'Heat-seeker' : heat === 2 ? 'Balanced' : 'Mild & creamy',
      hint: 'Based on winners',
    },
  ]
}

export const categories: Record<Category['key'], Category> = {
  fries: {
    key: 'fries',
    items: [...fries, ...localFries],
    home: '/',
    base: '/fries',
    navLabel: 'Fries',
    one: 'fry',
    many: 'fries',
    plural: 'fast food fries',
    kindLabel: 'Cut',
    ticketTitle: "What you're getting",
    voteApi: '/api/vote',
    storageKey: 'fryranker',
    insights: fryInsights,
    matchupTitle: (a, b) => `${a.name} vs ${b.name} Fries`,
  },
  sauces: {
    key: 'sauces',
    items: sauces,
    home: '/sauces',
    base: '/sauces',
    navLabel: 'Sauces',
    one: 'sauce',
    many: 'sauces',
    plural: 'fast food sauces',
    kindLabel: 'From',
    ticketTitle: "What's in the cup",
    voteApi: '/api/sauces/vote',
    storageKey: 'sauceranker',
    insights: sauceInsights,
    matchupTitle: (a, b) => `${a.fullName} vs ${b.fullName}`,
  },
}

export const categoryList = Object.values(categories)

export const getCategory = (key: string): Category | undefined =>
  Object.hasOwn(categories, key) ? categories[key as Category['key']] : undefined

export const itemPath = (category: Category, item: Item) => `${category.base}/${item.slug}`

/** Matchup pages list the pair in slug order so each pair has one URL. */
export const matchupPath = (category: Category, a: Item, b: Item) => {
  const [first, second] = a.slug < b.slug ? [a, b] : [b, a]
  return `${category.base}/${first.slug}/vs/${second.slug}`
}

export const findItem = (category: Category, slug: string) =>
  category.items.find((item) => item.slug === slug)

/** Local spots on a city's board. */
export const localsIn = (category: Category, cityKey: string) =>
  category.items.filter((item) => item.city === cityKey)

/** Cities where this category has local spots. */
export const citiesFor = (category: Category) =>
  cities.filter((city) => category.items.some((item) => item.city === city.key))

/** The city board's URL, e.g. `/fries/in/los-angeles`. */
export const cityPath = (category: Category, city: City) => `${category.base}/in/${city.key}`
