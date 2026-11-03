import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategory, itemPath } from '@/lib/categories'
import { parseShare } from '@/lib/share'
import { getStandings } from '@/lib/standings'
import { list } from '@/lib/text'

export const revalidate = 3600

// Every ordering of five is a valid link, so these render on first request.
export const generateStaticParams = () => []

type Params = PageProps<'/top/[category]/[ids]'>['params']

async function load(params: Params) {
  const { category: key, ids } = await params
  const category = getCategory(key)
  const picks = category && parseShare(category, ids)
  if (!category || !picks) notFound()
  return { category, picks }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, picks } = await load(params)
  const title = `My top 5 ${category.many}`
  const description = `${list(picks.map((item) => item.name))}. What's your #1? Rank ${category.plural} head to head on FryRanker.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
    robots: { index: false, follow: true },
  }
}

export default async function SharePage({ params }: { params: Params }) {
  const { category, picks } = await load(params)
  const { items } = await getStandings(category)

  return (
    <main className="wrap page">
      <header className="item-hero">
        <div className="item-emoji" aria-hidden>
          {picks[0].emoji}
        </div>
        <h1>My top 5 {category.many}</h1>
        <p className="subtitle">Picked one head-to-head matchup at a time on FryRanker.</p>
      </header>

      <ol className="share-list">
        {picks.map((item, i) => {
          const global = items.find((entry) => entry.id === item.id)
          return (
            <li key={item.id}>
              <Link href={itemPath(category, item)} className="fry-row">
                <span className="row-left">
                  <span className="rank-number">{i + 1}</span>
                  <span className="info">
                    <span className="info-name">
                      {item.emoji} {item.name}
                    </span>
                    <span className="info-meta">{item.kind}</span>
                  </span>
                </span>
                {global && <span className="score-badge">Global #{global.rank}</span>}
              </Link>
            </li>
          )
        })}
      </ol>

      <div className="cta-row">
        <Link className="share-btn" href={category.home}>
          {category.emoji} Rank your own
        </Link>
      </div>
    </main>
  )
}
