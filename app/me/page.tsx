import type { Metadata } from 'next'
import MyFries from '@/components/MyFries'
import { categoryList, citiesFor } from '@/lib/categories'
import { getStandings, rankLabel } from '@/lib/standings'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'My Fries',
  description: 'Your FryRanker ranking, taste profile, streak and spots to try next.',
  alternates: { canonical: '/me' },
  robots: { index: false, follow: true },
}

/**
 * The visitor's own page. Everything personal comes from their device; the server only adds
 * where the crowd ranks each item.
 */
export default async function MePage() {
  const crowd: Record<string, Record<number, string>> = {}
  for (const category of categoryList) {
    const labels: Record<number, string> = {}
    for (const item of (await getStandings(category)).items) labels[item.id] = rankLabel(item)
    for (const city of citiesFor(category)) {
      for (const item of (await getStandings(category, city.key)).items) {
        if (item.city) labels[item.id] = `${rankLabel(item)} in ${city.short}`
      }
    }
    crowd[category.key] = labels
  }
  return (
    <main className="page">
      <MyFries crowd={crowd} />
    </main>
  )
}
