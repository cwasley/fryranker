import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Chips from '@/components/Chips'
import { findItem, getCategory, itemPath, matchupPath } from '@/lib/categories'
import { expected } from '@/lib/elo'
import {
  getMatchups,
  getStandings,
  INDEXABLE_MATCHUP_VOTES,
  MATCHUPS_SINCE,
  type Ranked,
} from '@/lib/standings'
import { formatCount, pct } from '@/lib/text'

export const revalidate = 600

// Rendered on first request, then cached: there are hundreds of pairs.
export const generateStaticParams = () => []

type Params = PageProps<'/[category]/[slug]/vs/[other]'>['params']

async function load(params: Params) {
  const { category: key, slug, other } = await params
  const category = getCategory(key)
  const a = category && findItem(category, slug)
  const b = category && findItem(category, other)
  if (!category || !a || !b || a.id === b.id) notFound()
  const canonical = matchupPath(category, a, b)
  if (canonical !== `${category.base}/${slug}/vs/${other}`) permanentRedirect(canonical)

  const [standings, matchups] = await Promise.all([getStandings(category), getMatchups(category)])
  const left = standings.items.find((item) => item.id === a.id)!
  const right = standings.items.find((item) => item.id === b.id)!
  const record = matchups.record(left.id, right.id)
  const votes = record.wins + record.losses
  return {
    category,
    left,
    right,
    record,
    votes,
    canonical,
    odds: expected(left.score, right.score),
  }
}

function verdict(left: Ranked, right: Ranked, wins: number, votes: number, odds: number) {
  if (votes > 0) {
    const leader = wins * 2 >= votes ? left : right
    const share = leader === left ? wins / votes : 1 - wins / votes
    return `${pct(share)} of ${formatCount(votes)} FryRanker voters pick ${leader.name} over ${leader === left ? right.name : left.name}.`
  }
  const favorite = odds >= 0.5 ? left : right
  return `By Elo score, ${favorite.name} would win ${pct(Math.max(odds, 1 - odds))} of head-to-head votes against ${favorite === left ? right.name : left.name}.`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, left, right, record, votes, canonical, odds } = await load(params)
  const title = `${category.matchupTitle(left, right)}: Which Is Better?`
  const description = `${verdict(left, right, record.wins, votes, odds)} ${left.name} is #${left.rank} and ${right.name} is #${right.rank} of ${category.items.length} ${category.plural}.`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
    robots: votes >= INDEXABLE_MATCHUP_VOTES ? undefined : { index: false, follow: true },
  }
}

export default async function MatchupPage({ params }: { params: Params }) {
  const { category, left, right, record, votes, odds } = await load(params)
  const share = votes > 0 ? record.wins / votes : odds

  const side = (item: Ranked) => (
    <div className="vs-card">
      <div className="emoji" aria-hidden>
        {item.emoji}
      </div>
      <h2>
        <Link href={itemPath(category, item)}>{item.name}</Link>
      </h2>
      <p className="style-line">{item.kind}</p>
      <dl className="vs-stats">
        <div>
          <dt>Global rank</dt>
          <dd>#{item.rank}</dd>
        </div>
        <div>
          <dt>Elo score</dt>
          <dd>{item.score}</dd>
        </div>
        <div>
          <dt>Battles</dt>
          <dd>{formatCount(item.battles)}</dd>
        </div>
      </dl>
      <Chips tags={item.tags} spicy={category.spicy} />
      <p className="note">{item.note}</p>
    </div>
  )

  return (
    <main className="wrap page">
      <Breadcrumbs
        trail={[
          { name: category.brand.join(''), href: category.home },
          { name: left.name, href: itemPath(category, left) },
          { name: `vs ${right.name}`, href: matchupPath(category, left, right) },
        ]}
      />

      <header className="item-hero">
        <div className="item-emoji" aria-hidden>
          {left.emoji} <span className="vs-word">vs</span> {right.emoji}
        </div>
        <h1>{category.matchupTitle(left, right)}</h1>
        <p className="subtitle">{verdict(left, right, record.wins, votes, odds)}</p>
      </header>

      <section className="verdict" aria-label="Head-to-head split">
        <div className="split-labels">
          <span>
            {left.name} {pct(share)}
          </span>
          <span>
            {pct(1 - share)} {right.name}
          </span>
        </div>
        <div className="split-bar">
          <div style={{ width: pct(share) }} />
        </div>
        <p className="muted">
          {votes > 0
            ? `${record.wins}–${record.losses} in direct votes since ${MATCHUPS_SINCE}.`
            : `No direct votes on this pair yet, so the split is predicted from Elo scores.`}
        </p>
        <div className="cta-row">
          <Link className="share-btn" href={`${category.home}?a=${left.slug}&b=${right.slug}`}>
            {category.emoji} Settle it yourself
          </Link>
        </div>
      </section>

      <div className="vs-grid">
        {side(left)}
        {side(right)}
      </div>

      <p className="back-link">
        <Link href={category.home}>
          ← All {category.items.length} {category.plural}
        </Link>
      </p>
    </main>
  )
}
