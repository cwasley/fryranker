import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Chips from '@/components/Chips'
import { categoryList, findItem, getCategory, matchupPath } from '@/lib/categories'
import { expected } from '@/lib/elo'
import { getMatchups, getStandings, MATCHUPS_SINCE } from '@/lib/standings'
import { formatCount, pct, titleCase } from '@/lib/text'

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
  const standings = await getStandings(category)
  const ranked = standings.items.find((entry) => entry.id === item.id)!
  return { category, standings, ranked }
}

export async function generateMetadata({
  params,
}: PageProps<'/[category]/[slug]'>): Promise<Metadata> {
  const { category, standings, ranked } = await load(params)
  const title = `${ranked.fullName}: Ranked #${ranked.rank} of ${standings.items.length} ${titleCase(category.plural)}`
  const description = `${ranked.fullName} rank #${ranked.rank} of ${standings.items.length} ${category.plural} on FryRanker after ${formatCount(ranked.battles)} head-to-head votes. ${ranked.note}`
  const path = `${category.base}/${ranked.slug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    twitter: { title, description },
  }
}

export default async function ItemPage({ params }: PageProps<'/[category]/[slug]'>) {
  const { category, standings, ranked } = await load(params)
  const matchups = await getMatchups(category)
  const total = standings.items.length

  const opponents = standings.items
    .filter((other) => other.id !== ranked.id)
    .map((other) => ({
      other,
      odds: expected(ranked.score, other.score),
      record: matchups.record(ranked.id, other.id),
    }))
  const favoredAgainst = opponents.filter((o) => o.odds > 0.5).length
  const above = standings.items[ranked.rank - 2]
  const below = standings.items[ranked.rank]

  return (
    <main className="wrap page">
      <Breadcrumbs
        trail={[
          { name: category.brand.join(''), href: category.home },
          { name: ranked.name, href: `${category.base}/${ranked.slug}` },
        ]}
      />

      <header className="item-hero">
        <div className="item-emoji" aria-hidden>
          {ranked.emoji}
        </div>
        <h1>{ranked.fullName}</h1>
        <p className="subtitle">
          {category.kindLabel}: {ranked.kind}
        </p>
      </header>

      <section className="stat-row" aria-label="Global standing">
        <div className="stat">
          <div className="k">Rank</div>
          <p className="v">
            #{ranked.rank} <small>of {total}</small>
          </p>
        </div>
        <div className="stat">
          <div className="k">Elo score</div>
          <p className="v">{ranked.score}</p>
        </div>
        <div className="stat">
          <div className="k">Battles</div>
          <p className="v">{formatCount(ranked.battles)}</p>
        </div>
      </section>

      <div className="item-body">
        <Chips tags={ranked.tags} spicy={category.spicy} />
        <p className="note">{ranked.note}</p>
        <p className="lede">
          Ranked #{ranked.rank} of {total} {category.plural}
          {above && (
            <>
              , behind <Link href={`${category.base}/${above.slug}`}>{above.name}</Link>
            </>
          )}
          {below && (
            <>
              {above ? ' and ahead of ' : ', ahead of '}
              <Link href={`${category.base}/${below.slug}`}>{below.name}</Link>
            </>
          )}
          . Going by Elo, {ranked.name} would be favored against {favoredAgainst} of the other{' '}
          {total - 1}.
        </p>
        <div className="cta-row">
          <Link className="share-btn" href={`${category.home}?with=${ranked.slug}`}>
            {category.emoji} Vote on {ranked.name}
          </Link>
        </div>
      </div>

      <section className="h2h" aria-labelledby="h2h">
        <h2 id="h2h">{ranked.name} head to head</h2>
        <p className="muted">
          Odds come from each {category.one}&apos;s Elo score. Records count votes since{' '}
          {MATCHUPS_SINCE}.
        </p>
        <ol className="h2h-list">
          {opponents.map(({ other, odds, record }) => {
            const played = record.wins + record.losses
            return (
              <li key={other.id}>
                <Link href={matchupPath(category, ranked, other)} className="h2h-row">
                  <span className="h2h-name">
                    <span aria-hidden>{other.emoji}</span> vs {other.name}
                    <span className="h2h-rank">#{other.rank}</span>
                  </span>
                  <span className="h2h-numbers">
                    <span className={odds > 0.5 ? 'favored' : 'underdog'}>{pct(odds)} odds</span>
                    {played > 0 && (
                      <span className="h2h-record">
                        {record.wins}–{record.losses}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <p className="back-link">
        <Link href={category.home}>
          ← All {total} {category.plural}
        </Link>
      </p>
    </main>
  )
}
