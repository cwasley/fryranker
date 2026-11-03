import { categories } from '@/lib/categories'
import { OG_SIZE } from '@/lib/og'
import { rankerCard } from '@/lib/og-cards'

export const revalidate = 3600
export const alt = 'FryRanker: the best fast food fries, ranked by head-to-head votes'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return rankerCard(categories.fries)
}
