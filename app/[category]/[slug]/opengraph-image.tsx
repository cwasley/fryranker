import { notFound } from 'next/navigation'
import { categoryList, findItem, getCategory } from '@/lib/categories'
import { OG_SIZE } from '@/lib/og'
import { itemCard } from '@/lib/og-cards'

export const revalidate = 3600
export const dynamicParams = false
export const alt = 'Where this pick ranks on FryRanker'
export const size = OG_SIZE
export const contentType = 'image/png'

export const generateStaticParams = () =>
  categoryList.flatMap((category) =>
    category.items.map((item) => ({ category: category.key, slug: item.slug }))
  )

type Params = Promise<{ category: string; slug: string }>

export default async function Image({ params }: { params: Params }) {
  const { category: key, slug } = await params
  const category = getCategory(key)
  const item = category && findItem(category, slug)
  if (!category || !item) notFound()
  return itemCard(category, item)
}
