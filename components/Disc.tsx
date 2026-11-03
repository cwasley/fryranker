import type { Category } from '@/lib/categories'
import { glyphSvg } from '@/lib/glyphs'
import type { Item } from '@/lib/items'

export default function Disc({ category, item }: { category: Category; item: Item }) {
  return (
    <span
      className={`disc${category.key === 'sauces' ? ' sauce' : ''}`}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: glyphSvg(category, item) }}
    />
  )
}
