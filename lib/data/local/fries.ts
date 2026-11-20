import type { Item } from '../../items'

/**
 * Independent spots, ranked on their city's board alongside the chains. Ids start at 1000 so
 * they never collide with chains. Same rules as chains: never renumber, never change a shipped slug.
 *
 * Los Angeles launch list, checked against best-fries coverage from October 2026 (The Infatuation,
 * Resy, LAist, menus). Re-check a spot is still open before featuring it anywhere.
 */
const la = (place: Item['place']) => ({ city: 'los-angeles', place })

export const localFries: Item[] = [
  {
    id: 1000,
    slug: 'amboy-quality-meats',
    name: 'Amboy',
    fullName: 'Amboy Quality Meats Fries',
    kind: 'Shoestring',
    tags: ['Skinny shoestring', 'Golden crisp', 'Well salted', 'Not greasy'],
    note: 'Fast-food-style shoestrings done better: crisper, saltier and lighter on the oil.',
    ...la({ neighborhood: 'Chinatown', address: '727 N Broadway #117, Los Angeles, CA 90012' }),
  },
  {
    id: 1001,
    slug: 'daglas-drive-in',
    name: 'Daglas Drive-In',
    fullName: 'Daglas Drive-In Fries',
    kind: 'Seasoned',
    tags: ['Paprika garlic', 'Secret seasoning', 'Giant bags', 'Order well done'],
    note: 'Straight cuts in a secret paprika-garlic blend, served by the bagful.',
    ...la({ neighborhood: 'Winnetka', address: '20036 Vanowen St, Winnetka, CA 91306' }),
  },
  {
    id: 1002,
    slug: 'wurstkuche',
    name: 'Wurstküche',
    fullName: 'Wurstküche Belgian Fries',
    kind: 'Belgian Frites',
    tags: ['Belgian style', 'Double fried', 'Dipping sauces', 'Curry ketchup'],
    note: 'Twice-fried Belgian fries with a lineup of dips. Curry ketchup is the move.',
    ...la({ neighborhood: 'Arts District', address: '800 E 3rd St, Los Angeles, CA 90013' }),
  },
  {
    id: 1003,
    slug: 'max-and-helens',
    name: "Max & Helen's",
    fullName: "Max & Helen's Fries",
    kind: 'Battered',
    tags: ['Beef tallow', 'Battered', 'Craggy crunch', 'Fluffy inside'],
    note: 'Battered, craggy fries in beef tallow. Diner fries, turned all the way up.',
    ...la({ neighborhood: 'Larchmont', address: '127 N Larchmont Blvd, Los Angeles, CA 90004' }),
  },
  {
    id: 1004,
    slug: 'dinos-famous-chicken',
    name: "Dino's Chicken",
    fullName: "Dino's Famous Chicken Fries",
    kind: 'Juice-Soaked',
    tags: ['Greek marinade', 'Spicy vinegar', 'Rough cut', 'Bring napkins'],
    note: 'Thin fries soaked in "the juice," a spicy, vinegary marinade. Fork recommended.',
    ...la({ neighborhood: 'Pico-Union', address: '2575 W Pico Blvd, Los Angeles, CA 90006' }),
  },
  {
    id: 1005,
    slug: 'pawn-shop',
    name: 'Pawn Shop',
    fullName: 'Pawn Shop Tallow Fries',
    kind: 'Tallow Fries',
    tags: ['Beef tallow', 'Light + airy', 'Subtly beefy', 'Sports bar'],
    note: 'Beef tallow fries at a sports bar that takes its fries more seriously than its games.',
    ...la({ neighborhood: 'Hollywood', address: '5901 Melrose Ave, Los Angeles, CA 90038' }),
  },
  {
    id: 1006,
    slug: 'brents-deli',
    name: "Brent's Deli",
    fullName: "Brent's Deli Curly Fries",
    kind: 'Curly',
    tags: ['Curly spirals', 'Seasoned', 'Golden', 'Deli side'],
    note: 'Seasoned curly fries at a Valley deli institution. Always take the upgrade.',
    ...la({ neighborhood: 'Northridge', address: '19565 Parthenia St, Northridge, CA 91324' }),
  },
  {
    id: 1007,
    slug: 'sichuan-impression',
    name: 'Sichuan Impression',
    fullName: 'Sichuan Impression Crinkle Fries',
    kind: 'Crinkle Cut',
    tags: ['Numbing peppercorn', 'Dried chiles', 'Garlic', 'Very spicy'],
    note: 'Crinkle cuts tossed with numbing peppercorns, dried chiles and garlic. Keep a drink close.',
    ...la({ neighborhood: 'West LA', address: '11057 Santa Monica Blvd, Los Angeles, CA 90025' }),
  },
  {
    id: 1008,
    slug: 'josephine',
    name: 'Josephine',
    fullName: 'Josephine Duck Fat Fries',
    kind: 'Thick Cut',
    tags: ['Duck fat', 'Triple fried', 'Starch rolled', 'Garlic aioli'],
    note: 'Thick duck fat fries, fried three times and served with garlic aioli.',
    ...la({
      neighborhood: 'Silver Lake',
      address: '4156 Santa Monica Blvd, Los Angeles, CA 90029',
    }),
  },
  {
    id: 1009,
    slug: 'mizlala',
    name: 'Mizlala',
    fullName: 'Mizlala Sumac Fries',
    kind: 'Seasoned',
    tags: ['Sumac', 'Garlic oil', 'Whipped garlic', 'Fresh parsley'],
    note: 'Sumac fries in garlic oil and parsley, with whipped garlic for dunking.',
    ...la({ neighborhood: 'Sherman Oaks', address: '4515 Sepulveda Blvd, Sherman Oaks, CA 91403' }),
  },
]
