import type { MetadataRoute } from 'next'
import { categoryList, citiesFor, cityPath, itemPath, matchupPath } from '@/lib/categories'
import { absoluteUrl } from '@/lib/site'
import { getMatchups, INDEXABLE_MATCHUP_VOTES } from '@/lib/standings'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/how-it-works'), changeFrequency: 'yearly', priority: 0.3 },
  ]
  for (const category of categoryList) {
    entries.push({ url: absoluteUrl(category.home), changeFrequency: 'hourly', priority: 1 })
    for (const city of citiesFor(category)) {
      entries.push({
        url: absoluteUrl(cityPath(category, city)),
        changeFrequency: 'hourly',
        priority: 0.9,
      })
    }
    for (const item of category.items) {
      entries.push({
        url: absoluteUrl(itemPath(category, item)),
        changeFrequency: 'daily',
        priority: 0.8,
      })
    }
    const { pairs } = await getMatchups(category)
    for (const pair of pairs) {
      if (pair.a_wins + pair.b_wins < INDEXABLE_MATCHUP_VOTES) continue
      const a = category.items.find((item) => item.id === pair.a)
      const b = category.items.find((item) => item.id === pair.b)
      if (a && b) {
        entries.push({
          url: absoluteUrl(matchupPath(category, a, b)),
          changeFrequency: 'weekly',
          priority: 0.5,
        })
      }
    }
  }
  return entries
}
