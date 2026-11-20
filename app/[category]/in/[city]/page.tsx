import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import JsonLd from '@/components/JsonLd'
import MenuBoard from '@/components/MenuBoard'
import Ranker from '@/components/Ranker'
import SuggestSpot from '@/components/SuggestSpot'
import { categoryList, citiesFor, cityPath, getCategory, itemPath } from '@/lib/categories'
import { getCity } from '@/lib/cities'
import { directionsUrl, isLocal } from '@/lib/items'
import { social } from '@/lib/metadata'
import { placeSearchEnabled } from '@/lib/places'
import { absoluteUrl } from '@/lib/site'
import { getMatchups, getStandings } from '@/lib/standings'
import { formatCount, titleCase } from '@/lib/text'

export const revalidate = 300
export const dynamicParams = false

export const generateStaticParams = () =>
  categoryList.flatMap((category) =>
    citiesFor(category).map((city) => ({ category: category.key, city: city.key }))
  )

type Params = PageProps<'/[category]/in/[city]'>['params']

async function load(params: Params) {
  const { category: key, city: cityKey } = await params
  const category = getCategory(key)
  const city = getCity(cityKey)
  if (!category || !city || !citiesFor(category).includes(city)) notFound()
  const standings = await getStandings(category, city.key)
  const locals = standings.items.filter(isLocal)
  return { category, city, standings, locals }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, city, locals } = await load(params)
  const [first, second] = locals
  const title = `Best ${titleCase(category.many)} in ${city.name}: ${locals.length} Local Spots vs the Chains`
  const description = `${first.name} leads ${city.name}'s local ${category.many}, then ${second.name}. Vote head to head between local spots and the big chains to settle the city's best ${category.many}.`
  const path = cityPath(category, city)
  return {
    title,
    description,
    alternates: { canonical: path },
    ...social(title, description, path),
  }
}

export default async function CityPage({ params }: { params: Params }) {
  const { category, city, standings, locals } = await load(params)
  const matchups = await getMatchups(category)
  const path = cityPath(category, city)

  return (
    <main className="page">
      <Breadcrumbs
        trail={[
          { name: category.navLabel, href: category.home },
          { name: city.name, href: path },
        ]}
      />
      <header className="share-hero">
        <h1 className="cond">
          Best {category.many} in <span>{city.short}</span>
        </h1>
        <p>{locals.length} local spots take on the chains. Every matchup has at least one local.</p>
      </header>

      <Ranker
        categoryKey={category.key}
        standings={standings.items}
        totalVotes={standings.totalVotes}
        matchups={matchups.rows}
        cityKey={city.key}
      />

      <section className="menu" aria-label={`${titleCase(category.many)} in ${city.name}`}>
        <div className="menu-wrap">
          <MenuBoard
            category={category}
            items={locals}
            title={`${city.short} locals`}
            sub={`Ranked against each other and the chains. Tap a spot for where to find it.`}
          />
          <MenuBoard
            category={category}
            items={standings.items.slice(0, locals.length)}
            title={`${city.short}'s full board`}
            sub={`Locals and chains together, by points. ${formatCount(standings.totalVotes)} votes so far.`}
          />
        </div>
      </section>

      <section className="spots" aria-labelledby="where">
        <h2 id="where" className="cond">
          Where to find them
        </h2>
        <ul>
          {locals.map((item) => (
            <li key={item.id}>
              <Link href={itemPath(category, item)}>
                <b>{item.name}</b>
                <small>
                  {item.place?.neighborhood} · {item.kind}
                </small>
              </Link>
              <a href={directionsUrl(item)} target="_blank" rel="noopener">
                Directions
              </a>
            </li>
          ))}
        </ul>
        <div className="suggest-wrap">
          <p>Missing a spot? Tell us and we&apos;ll check it out.</p>
          <SuggestSpot
            categoryKey={category.key}
            cityKey={city.key}
            cityName={city.name}
            search={placeSearchEnabled()}
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
          name: `Best ${category.many} in ${city.name}`,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          numberOfItems: locals.length,
          itemListElement: locals.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.fullName,
            url: absoluteUrl(itemPath(category, item)),
          })),
        }}
      />
    </main>
  )
}
