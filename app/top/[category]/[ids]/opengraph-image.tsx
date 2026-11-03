import { notFound } from 'next/navigation'
import { getCategory } from '@/lib/categories'
import { OG_SIZE } from '@/lib/og'
import { topCard } from '@/lib/og-cards'
import { parseShare } from '@/lib/share'

export const alt = 'A FryRanker top 5'
export const size = OG_SIZE
export const contentType = 'image/png'

export const generateStaticParams = () => []

type Params = Promise<{ category: string; ids: string }>

export default async function Image({ params }: { params: Params }) {
  const { category: key, ids } = await params
  const category = getCategory(key)
  const picks = category && parseShare(category, ids)
  if (!category || !picks) notFound()
  return topCard(category, picks)
}
