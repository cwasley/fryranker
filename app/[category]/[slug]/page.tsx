import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Disc from '@/components/Disc'
import Name from '@/components/Name'
import {
  categoryList,
  cityPath,
  findItem,
  getCategory,
  itemPath,
  matchupPath,
} from '@/lib/categories'
import { getCity } from '@/lib/cities'
import { directionsUrl } from '@/lib/items'
import { DIRECT_VOTES, split } from '@/lib/reveal'
import { getMatchups, getStandings } from '@/lib/standings'
import { formatCount, titleCase } from '@/lib/text'
import { social } from '@/lib/metadata'

export const revalidate = 600
export const dynamicParams = false

export const generateStaticParams = () =>
  categoryList.flatMap((category) =>
    category.items.map((item) => ({ category: category.key, slug: item.slug }))
  )

async function load(params: PageProps<'/[category]/[slug]'>['params']) {
  const { category: key, slug } = await params
  const category = getCategory(key)
  const item = category && findItem(category, slug)
  if (!category || !item) notFound()
  const city = getCity(item.city)
  const standings = await getStandings(category, city?.key)
  const ranked = standings.items.find((entry) => entry.id === item.id)!
  // "fast food fries" nationally, "fries in Los Angeles" on a city board.
  const scope = city ? `${category.many} in ${city.name}` : category.plural
  const scopeTitle = city
    ? `${titleCase(category.many)} in ${city.name}`
    : titleCase(category.plural)
  return { category, city, standings, ranked, scope, scopeTitle }
}

export async function generateMetadata({
  params,
}: PageProps<'/[category]/[slug]'>): Promise<Metadata> {
  const { category, standings, ranked, scope, scopeTitle } = await load(params)
  const title = `${ranked.fullName}: Ranked #${ranked.rank} of ${standings.items.length} ${scopeTitle}`
  const description = `${ranked.fullName} rank #${ranked.rank} of ${standings.items.length} ${scope} on FryRanker after ${formatCount(ranked.battles)} head-to-head votes. ${ranked.note}`
  const path = itemPath(category, ranked)
  return {
    title,
    description,
    alternates: { canonical: path },
    ...social(title, description, path),
  }
}

export default async function ItemPage({ params }: PageProps<'/[category]/[slug]'>) {
  const { category, city, standings, ranked, scope } = await load(params)
  const matchups = await getMatchups(category)
  const total = standings.items.length

  const opponents = standings.items
    .filter((other) => other.id !== ranked.id)
    .map((other) => {
      const { wins, losses } = matchups.record(ranked.id, other.id)
      return { other, split: split(ranked.score, other.score, wins, losses) }
    })
  const favored = opponents.filter((o) => o.split.pct > 50).length
  const above = standings.items[ranked.rank - 2]
  const below = standings.items[ranked.rank]
  const tags = category.key === 'fries' ? [ranked.kind, ...ranked.tags] : ranked.tags

  return (
    <main className="page">
      <Breadcrumbs
        trail={[
          { name: category.navLabel, href: category.home },
          ...(city ? [{ name: city.name, href: cityPath(category, city) }] : []),
          { name: ranked.name, href: itemPath(category, ranked) },
        ]}
      />
      <div className="item-cols">
        <div>
          <header className="hero">
            <Disc category={category} item={ranked} />
            <div>
              <p className="rank">
                #{ranked.rank} of {total} {scope}
              </p>
              <h1 className="cond">
                <Name text={ranked.fullName} />
              </h1>
            </div>
          </header>

          <div className="prices">
            <div className="price">
              <b className="cond">#{ranked.rank}</b>
              <small>Rank</small>
            </div>
            <div className="price">
              <b className="cond">{ranked.score}</b>
              <small>Points</small>
            </div>
            <div className="price">
              <b className="cond">{formatCount(ranked.battles)}</b>
              <small>Votes</small>
            </div>
          </div>

          <p className="lede">
            Ranked #{ranked.rank} of {total}
            {above && (
              <>
                , behind <Link href={itemPath(category, above)}>{above.name}</Link>
              </>
            )}
            {below && (
              <>
                {above ? ' and ahead of ' : ', ahead of '}
                <Link href={itemPath(category, below)}>{below.name}</Link>
              </>
            )}
            . Going by every vote so far, {ranked.name} would beat {favored} of the other{' '}
            {total - 1}.
          </p>

          <section className="order-ticket">
            <h2 className="cond">{category.ticketTitle}</h2>
            <ul>
              {tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <p>{ranked.note}</p>
          </section>

          {ranked.place && (
            <section className="order-ticket">
              <h2 className="cond">Where to get them</h2>
              <p>
                {ranked.place.address} · {ranked.place.neighborhood}
              </p>
              <a className="btn" href={directionsUrl(ranked)} target="_blank" rel="noopener">
                Get directions
              </a>
            </section>
          )}

          <a
            className="btn primary"
            href={`${city ? cityPath(category, city) : category.home}?with=${ranked.slug}`}
          >
            Vote on {ranked.name}
          </a>
        </div>

        <section className="odds" aria-labelledby="h2h">
          <h2 id="h2h" className="cond">
            Head to head
          </h2>
          <p>
            How often {ranked.name} wins each matchup, based on all the votes. A pair switches to
            its own direct votes once it has {DIRECT_VOTES}.
          </p>
          <ol>
            {opponents.map(({ other, split: s }) => (
              <li key={other.id}>
                <Link href={matchupPath(category, ranked, other)}>
                  <Disc category={category} item={other} />
                  <span>
                    <span className="who">
                      vs {other.name}
                      <small>#{other.rank}</small>
                    </span>
                    <span className="meter">
                      <i style={{ width: `${s.pct}%` }} />
                    </span>
                  </span>
                  <b className="cond">
                    {s.pct}%<small>{s.direct ? `${s.votes} votes` : 'wins'}</small>
                  </b>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
