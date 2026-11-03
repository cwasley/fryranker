import { notFound } from 'next/navigation'
import RankerPage, { rankerMetadata } from '@/components/RankerPage'
import { categoryList, getCategory } from '@/lib/categories'

export const revalidate = 300
export const dynamicParams = false

// Fries live at `/`; next.config redirects `/fries` there.
export const generateStaticParams = () =>
  categoryList.filter((c) => c.home !== '/').map((c) => ({ category: c.key }))

export async function generateMetadata({ params }: PageProps<'/[category]'>) {
  const category = getCategory((await params).category)
  return category ? rankerMetadata(category) : {}
}

export default async function CategoryPage({ params }: PageProps<'/[category]'>) {
  const category = getCategory((await params).category)
  if (!category) notFound()
  return <RankerPage category={category} />
}
