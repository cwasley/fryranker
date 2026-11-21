/**
 * Merch designs. No chain names or logos on anything: the jokes are about fry culture, not brands.
 * The mockups on /merch are placeholders for the ideas, not final art.
 * Until a design has a `buyUrl` (a print-on-demand store link), its button asks "Want this?" and
 * counts interest, so we know what to print first.
 */
export type Design = {
  /** Stable key: stored with interest votes. Never change one that's shipped. */
  id: string
  name: string
  product: 'Tee' | 'Hoodie' | 'Sticker pack' | 'Hat'
  blurb: string
  /** Garment and ink colors for the mockup. */
  color: string
  ink: string
  /** What's printed. `personal` designs fill in from the visitor's own picks. */
  print:
    { kind: 'text'; lines: string[]; accent?: string } | { kind: 'profile' } | { kind: 'receipt' }
  buyUrl?: string
}

export const designs: Design[] = [
  {
    id: 'soggy-fry-apologist',
    name: 'Soggy Fry Apologist',
    product: 'Tee',
    blurb: 'For people who think limp fries have a certain charm. You know who you are.',
    color: '#22140c',
    ink: '#ffbf1f',
    print: { kind: 'text', lines: ['Soggy', 'Fry', 'Apologist'] },
  },
  {
    id: 'hot-take',
    name: 'Hot Take',
    product: 'Tee',
    blurb: 'Wear your most unpopular pick with pride.',
    color: '#d62718',
    ink: '#fff6e5',
    print: { kind: 'text', lines: ['Hot take', 'Only 31%', 'agree'], accent: '#ffbf1f' },
  },
  {
    id: 'your-order',
    name: 'Your Order',
    product: 'Tee',
    blurb: 'Your taste profile, printed. Crunch-chaser, soft-center loyalist, whatever you are.',
    color: '#fff6e5',
    ink: '#22140c',
    print: { kind: 'profile' },
  },
  {
    id: 'print-my-receipt',
    name: 'Print My Receipt',
    product: 'Tee',
    blurb: 'Your own top 5, printed like a drive-thru receipt. One of one.',
    color: '#fffdf7',
    ink: '#22140c',
    print: { kind: 'receipt' },
  },
  {
    id: 'ketchup-is-a-crutch',
    name: 'Ketchup Is a Crutch',
    product: 'Hoodie',
    blurb: 'A good fry stands on its own. Start an argument at any table.',
    color: '#ffbf1f',
    ink: '#22140c',
    print: { kind: 'text', lines: ['Ketchup', 'is a', 'crutch'], accent: '#d62718' },
  },
  {
    id: 'dip-responsibly',
    name: 'Dip Responsibly',
    product: 'Sticker pack',
    blurb: 'Six stickers: the fry cuts, a dipping cup and a little public-service reminder.',
    color: '#fff6e5',
    ink: '#22140c',
    print: { kind: 'text', lines: ['Dip', 'responsibly'], accent: '#d62718' },
  },
]

export const getDesign = (id: string) => designs.find((design) => design.id === id)

/** Interest counts show publicly from this many, so a brand-new shop doesn't read "0 want this". */
export const SHOW_COUNT_FROM = 10
