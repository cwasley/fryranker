import type { Metadata } from 'next'
import JsonLd from '@/components/JsonLd'
import Ranker from '@/components/Ranker'
import { itemPath, type Category } from '@/lib/categories'
import { absoluteUrl } from '@/lib/site'
import { getStandings } from '@/lib/standings'
import { list, roundedCount, titleCase } from '@/lib/text'

export async function rankerMetadata(category: Category): Promise<Metadata> {
  const { items, totalVotes } = await getStandings(category)
  const [first, second, third] = items
  const title = `${category.brand.join('')} | Best ${titleCase(category.plural)}, Ranked by ${roundedCount(totalVotes)} Votes`
  const description = `${first.name} leads the ${category.plural} rankings, then ${list([second.name, third.name])}. Pick between two ${category.many} at a time and see where all ${items.length} land.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: category.home },
    openGraph: { title, description, url: category.home },
    twitter: { title, description },
  }
}

export default async function RankerPage({ category }: { category: Category }) {
  const { items, totalVotes } = await getStandings(category)

  return (
    <main className="wrap">
      <header className="masthead">
        <h1>
          {category.brand[0]}
          <span>{category.brand[1]}</span>
        </h1>
        <p className="subtitle">{category.tagline}</p>
      </header>
      <Ranker categoryKey={category.key} standings={items} />
      <p className="about">
        The global standings are Elo ratings built from {totalVotes.toLocaleString('en-US')}{' '}
        head-to-head votes. Tap any {category.one} to see how it fares against the rest.
      </p>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Best ${category.plural}`,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          numberOfItems: items.length,
          itemListElement: items.map((item) => ({
            '@type': 'ListItem',
            position: item.rank,
            name: item.fullName,
            url: absoluteUrl(itemPath(category, item)),
          })),
        }}
      />
    </main>
  )
}
