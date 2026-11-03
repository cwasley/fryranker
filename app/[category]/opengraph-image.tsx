import { notFound } from 'next/navigation'
import { categoryList, getCategory } from '@/lib/categories'
import { OG_SIZE } from '@/lib/og'
import { rankerCard } from '@/lib/og-cards'

export const revalidate = 3600
export const dynamicParams = false
export const alt = 'The best fast food sauces, ranked by head-to-head votes'
export const size = OG_SIZE
export const contentType = 'image/png'

export const generateStaticParams = () =>
  categoryList.filter((c) => c.home !== '/').map((c) => ({ category: c.key }))

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const category = getCategory((await params).category)
  if (!category) notFound()
  return rankerCard(category)
}
