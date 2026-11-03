import type { Category } from './categories'
import type { Item } from './items'

// Colors are inline rather than CSS classes so the same markup works in the
// link-preview cards, which render outside the page stylesheet.
const INK = '#22140c'
const FRY = '#ffe089'
const SPECK = '#d62718'

type Cut =
  | 'classic'
  | 'shoestring'
  | 'thick'
  | 'crinkle'
  | 'seasoned'
  | 'waffle'
  | 'curly'
  | 'wedge'
  | 'tots'

export function cutOf(kind: string): Cut {
  const k = kind.toLowerCase()
  if (k.includes('waffle')) return 'waffle'
  if (k.includes('curly')) return 'curly'
  if (k.includes('wedge')) return 'wedge'
  if (k.includes('tots')) return 'tots'
  if (k.includes('crinkle')) return 'crinkle'
  if (k.includes('shoestring')) return 'shoestring'
  if (k.includes('thick') || k.includes('boardwalk')) return 'thick'
  if (k.includes('seasoned') || k.includes('cajun') || k.includes('nacho')) return 'seasoned'
  return 'classic'
}

const body = `fill="${FRY}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"`

const stick = (x: number, y: number, w: number, h: number, r = 0) =>
  `<rect ${body} x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w / 2.5, 2)}" transform="rotate(${r} ${x + w / 2} ${y + h})"/>`

function zig(x: number, y: number, w: number, h: number, r: number) {
  const n = 7
  const step = h / n
  let d = `M${x},${y}`
  for (let i = 1; i <= n; i++) d += ` L${x + (i % 2 ? -1.6 : 0)},${(y + i * step).toFixed(1)}`
  d += ` L${x + w},${y + h}`
  for (let i = n - 1; i >= 0; i--)
    d += ` L${x + w + (i % 2 ? 1.6 : 0)},${(y + i * step).toFixed(1)}`
  return `<path ${body} d="${d} Z" transform="rotate(${r} ${x + w / 2} ${y + h})"/>`
}

const classic = () =>
  stick(15, 15, 7, 34, -9) +
  stick(24, 10, 7, 40, -2) +
  stick(33, 12, 7, 38, 4) +
  stick(42, 17, 7, 33, 11)

const shapes: Record<Cut, () => string> = {
  classic,
  shoestring: () =>
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => stick(13 + i * 5, 12 + (i % 3) * 3, 3.4, 38 - (i % 3) * 3, (i - 3.5) * 2.2))
      .join(''),
  thick: () => stick(12, 16, 10, 34, -6) + stick(24, 11, 10, 39, 0) + stick(36, 14, 10, 36, 7),
  crinkle: () => zig(15, 14, 7, 35, -8) + zig(27, 10, 7, 39, 0) + zig(39, 14, 7, 35, 8),
  seasoned: () =>
    classic() +
    [
      [20, 22],
      [29, 30],
      [37, 20],
      [45, 30],
      [27, 42],
      [40, 40],
      [33, 15],
    ]
      .map(([cx, cy]) => `<circle fill="${SPECK}" cx="${cx}" cy="${cy}" r="1.7"/>`)
      .join(''),
  waffle: () => {
    let holes = ''
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) holes += ` M${19 + c * 9},${19 + r * 9} h5 v5 h-5 Z`
    return `<path ${body} fill-rule="evenodd" transform="rotate(-10 32 32)" d="M16,12 h32 a4,4 0 0 1 4,4 v32 a4,4 0 0 1 -4,4 h-32 a4,4 0 0 1 -4,-4 v-32 a4,4 0 0 1 4,-4 Z${holes}"/>`
  },
  curly: () => {
    let d = ''
    for (let t = 0; t <= Math.PI * 4.4; t += 0.16) {
      const r = 2 + 1.75 * t
      d += `${d ? ' L' : 'M'}${(32 + r * Math.cos(t)).toFixed(1)},${(32 + r * Math.sin(t)).toFixed(1)}`
    }
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`
  },
  wedge: () =>
    [10, 25, 40]
      .map(
        (x, i) =>
          `<path ${body} transform="rotate(${(i - 1) * 8} ${x + 7} 50)" d="M${x},50 L${x + 4},14 Q${x + 12},11 ${x + 15},20 L${x + 14},50 Z"/>`
      )
      .join(''),
  tots: () =>
    [
      [12, 34],
      [34, 34],
      [23, 16],
    ]
      .map(([x, y]) => `<rect ${body} x="${x}" y="${y}" width="18" height="16" rx="6"/>`)
      .join(''),
}

const cup = 'M12,27 L52,27 L47.5,52 Q47,55 44,55 L20,55 Q17,55 16.5,52 Z'

const dipCup = (color: string) =>
  `<path fill="#ffffff" d="${cup}"/>` +
  `<path fill="${color}" d="M14.2,33 C20,29 26,35 32,31 C38,27 44,34 49.8,31 L47.5,52 Q47,55 44,55 L20,55 Q17,55 16.5,52 Z"/>` +
  `<path fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" d="${cup}"/>` +
  `<path fill="#d9d4c7" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" d="M10,26 L30,26 C39,25 46,18 49,10 Q51,6 55,8 Q58,10 56,14 C52,23 44,29 32,30 L10,30 Z"/>`

/** The item's glyph as a standalone SVG document. */
export function glyphSvg(category: Category, item: Item) {
  const inner =
    category.key === 'sauces' ? dipCup(item.color ?? '#c8231a') : shapes[cutOf(item.kind)]()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`
}
