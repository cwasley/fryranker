import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import Disc from '@/components/Disc'
import Name from '@/components/Name'
import { findItem, getCategory, itemPath, matchupPath } from '@/lib/categories'
import { source, split } from '@/lib/reveal'
import {
  getMatchups,
  getStandings,
  INDEXABLE_MATCHUP_VOTES,
  rankLabel,
  scopeOf,
  type Ranked,
} from '@/lib/standings'
import { formatCount } from '@/lib/text'
import { social } from '@/lib/metadata'

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

  const [standings, matchups] = await Promise.all([
    getStandings(category, scopeOf(a, b)),
    getMatchups(category),
  ])
  const left = standings.items.find((item) => item.id === a.id)!
  const right = standings.items.find((item) => item.id === b.id)!
  const { wins, losses } = matchups.record(left.id, right.id)
  return {
    category,
    standings,
    left,
    right,
    canonical,
    split: split(left.score, right.score, wins, losses),
  }
}

function headline(left: Ranked, right: Ranked, pct: number, direct: boolean) {
  const leader = pct >= 50 ? left : right
  const share = Math.max(pct, 100 - pct)
  const other = leader === left ? right.name : left.name
  return direct
    ? `${share}% of voters pick ${leader.name} over ${other}.`
    : `${leader.name} beats ${other} ${share}% of the time.`
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, standings, left, right, canonical, split: s } = await load(params)
  const title = `${category.matchupTitle(left, right)}: Which Is Better?`
  const description = `${headline(left, right, s.pct, s.direct)} Based on ${formatCount(s.direct ? s.votes : standings.totalVotes)} votes on FryRanker, where ${left.name} is ${rankLabel(left)} and ${right.name} is ${rankLabel(right)}.`
  return {
    title,
    description,
    alternates: { canonical },
    ...social(title, description, canonical),
    robots: s.votes >= INDEXABLE_MATCHUP_VOTES ? undefined : { index: false, follow: true },
  }
}

export default async function MatchupPage({ params }: { params: Params }) {
  const { category, standings, left, right, split: s } = await load(params)
  const others = standings.items.filter((o) => o.id !== left.id && o.id !== right.id).slice(0, 8)

  const row = (label: string, a: string, b: string, aWins: boolean | null) => (
    <div>
      <span>
        <b className={`cond${aWins === true ? ' win' : ''}`}>{a}</b>
      </span>
      <small>{label}</small>
      <span>
        <b className={`cond${aWins === false ? ' win' : ''}`}>{b}</b>
      </span>
    </div>
  )

  const side = (item: Ranked, pct: number) => (
    <Link className="vs-side" href={itemPath(category, item)}>
      <Disc category={category} item={item} />
      <span className="nm cond">
        <Name text={item.name} />
      </span>
      <span className="pc cond">{pct}%</span>
    </Link>
  )

  return (
    <main className="page">
      <Breadcrumbs
        trail={[
          { name: category.navLabel, href: category.home },
          { name: left.name, href: itemPath(category, left) },
          { name: `vs ${right.name}`, href: matchupPath(category, left, right) },
        ]}
      />
      <header className="vs-head">
        <p className="kicker">{headline(left, right, s.pct, s.direct)}</p>
        <h1 className="cond">
          <Name text={left.name} /> <em>vs</em> <Name text={right.name} />
        </h1>
      </header>

      <div className="vs-pair">
        {side(left, s.pct)}
        <span className="or-s cond" aria-hidden>
          or
        </span>
        {side(right, 100 - s.pct)}
      </div>

      <div className="split">
        <div className="bar">
          <b style={{ width: `${s.pct}%` }} />
        </div>
        <p>{source(s, standings.totalVotes)}</p>
      </div>

      <div className="tape">
        {row('Rank', rankLabel(left), rankLabel(right), left.rank < right.rank)}
        {row('Points', String(left.score), String(right.score), left.score > right.score)}
        {row('Votes', formatCount(left.battles), formatCount(right.battles), null)}
        {row(category.kindLabel, left.kind, right.kind, null)}
      </div>

      <div className="note-row">
        <p>
          <b>{left.name}</b>
          {left.note}
        </p>
        <p>
          <b>{right.name}</b>
          {right.note}
        </p>
      </div>

      <div className="row-actions">
        <a className="btn primary" href={`${category.home}?a=${left.slug}&b=${right.slug}`}>
          Settle it yourself
        </a>
      </div>

      <section className="more">
        <h2 className="cond">More {left.name} matchups</h2>
        {others.map((o) => (
          <Link key={o.id} href={matchupPath(category, left, o)}>
            vs {o.name}
          </Link>
        ))}
      </section>
    </main>
  )
}
