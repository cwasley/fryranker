import { notFound } from 'next/navigation'
import { categoryList, citiesFor, getCategory } from '@/lib/categories'
import { getCity } from '@/lib/cities'
import { OG_SIZE } from '@/lib/og'
import { rankerCard } from '@/lib/og-cards'

export const revalidate = 3600
export const dynamicParams = false
export const alt = 'The best local fries in the city, ranked by head-to-head votes'
export const size = OG_SIZE
export const contentType = 'image/png'

export const generateStaticParams = () =>
  categoryList.flatMap((category) =>
    citiesFor(category).map((city) => ({ category: category.key, city: city.key }))
  )

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; city: string }>
}) {
  const { category: key, city: cityKey } = await params
  const category = getCategory(key)
  const city = getCity(cityKey)
  if (!category || !city) notFound()
  return rankerCard(category, city)
}
