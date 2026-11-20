export type Item = {
  /** With the category, the primary key in `items`. Never renumber: votes and matchups reference it. */
  id: number
  /** URL segment for the item's page. Never change one that has shipped: it breaks inbound links. */
  slug: string
  name: string
  fullName: string
  /** Fry style or the sauce's restaurant. */
  kind: string
  /** Sauce color for its dipping-cup glyph. */
  color?: string
  tags: string[]
  note: string
  /**
   * Set for local spots: the city whose board they're on (a key from `lib/cities.ts`). Chains leave
   * it unset and appear on the national board.
   */
  city?: string
  /** Where to find a local spot. */
  place?: { neighborhood: string; address: string }
}

export const isLocal = (item: Item) => item.city !== undefined

/** Opens the spot in the visitor's maps app. No API key: it's a plain search link. */
export const directionsUrl = (item: Item) =>
  item.place &&
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name}, ${item.place.address}`)}`
