import type { Category } from './categories'
import type { Item } from './items'

export const SHARE_SIZE = 5

export const sharePath = (category: Category, ids: number[]) =>
  `/top/${category.key}/${ids.join('-')}`

/** The items a share link names, or undefined if the link isn't one we would have made. */
export function parseShare(category: Category, raw: string): Item[] | undefined {
  const parts = raw.split('-')
  if (parts.length !== SHARE_SIZE || parts.some((part) => !/^\d{1,3}$/.test(part))) return undefined
  const items = parts.map((part) => category.items.find((item) => item.id === Number(part)))
  if (items.some((item) => !item)) return undefined
  if (new Set(parts).size !== parts.length) return undefined
  return items as Item[]
}
