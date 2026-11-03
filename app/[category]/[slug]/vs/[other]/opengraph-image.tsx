import { notFound } from 'next/navigation'
import { findItem, getCategory } from '@/lib/categories'
import { OG_SIZE } from '@/lib/og'
import { matchupCard } from '@/lib/og-cards'

export const revalidate = 3600
export const alt = 'Head-to-head split between two picks on FryRanker'
export const size = OG_SIZE
export const contentType = 'image/png'

export const generateStaticParams = () => []

type Params = Promise<{ category: string; slug: string; other: string }>

export default async function Image({ params }: { params: Params }) {
  const { category: key, slug, other } = await params
  const category = getCategory(key)
  const a = category && findItem(category, slug)
  const b = category && findItem(category, other)
  if (!category || !a || !b || a.id === b.id) notFound()
  return matchupCard(category, a, b)
}
