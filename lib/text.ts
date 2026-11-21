export const formatCount = (n: number) => n.toLocaleString('en-US')

/** "1 vote", "2,401 votes". */
export const votes = (n: number) => `${formatCount(n)} ${n === 1 ? 'vote' : 'votes'}`

/** 36,512 → "36,000+"; small counts stay exact. */
export const roundedCount = (n: number) =>
  n >= 1000 ? `${formatCount(Math.floor(n / 1000) * 1000)}+` : formatCount(n)

export const pct = (fraction: number) => `${Math.round(fraction * 100)}%`

export function list(items: string[]) {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

export const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
