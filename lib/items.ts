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
}
