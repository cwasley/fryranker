import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import MenuBoard from '@/components/MenuBoard'
import Ranker from '@/components/Ranker'
import { itemPath, type Category } from '@/lib/categories'
import { absoluteUrl, site } from '@/lib/site'
import { getMatchups, getStandings } from '@/lib/standings'
import { formatCount, list, roundedCount, titleCase } from '@/lib/text'
import { social } from '@/lib/metadata'

export async function rankerMetadata(category: Category): Promise<Metadata> {
  const { items, totalVotes } = await getStandings(category)
  const [first, second, third] = items
  const title = `Best ${titleCase(category.plural)}, Ranked by ${roundedCount(totalVotes)} Votes | ${site.name}`
  const description = `${first.name} leads the ${category.plural} rankings, then ${list([second.name, third.name])}. Pick between two ${category.many} at a time and see where all ${items.length} land.`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: category.home },
    ...social(title, description, category.home),
  }
}

export default async function RankerPage({ category }: { category: Category }) {
  const [{ items, totalVotes }, matchups] = await Promise.all([
    getStandings(category),
    getMatchups(category),
  ])
  const half = Math.ceil(items.length / 2)

  return (
    <main className="page">
      <h1 className="sr-only">
        The best {category.plural}, ranked by {formatCount(totalVotes)} head-to-head votes
      </h1>
      <Ranker
        categoryKey={category.key}
        standings={items}
        totalVotes={totalVotes}
        matchups={matchups.rows}
      />

      <section id="menu" className="menu" aria-label={`All ${category.plural}`}>
        <div className="menu-wrap">
          <MenuBoard
            category={category}
            items={items.slice(0, half)}
            title="Today's menu"
            sub={`${formatCount(totalVotes)} votes so far. Tap any ${category.one} for its matchups.`}
          />
          <MenuBoard
            category={category}
            items={items.slice(half)}
            title="Also serving"
            sub="Points go up with every win and down with every loss."
          />
        </div>
        <p className="about">
          <Link href="/how-it-works">How the rankings work</Link>
        </p>
      </section>

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
