import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Barcode from '@/components/Barcode'
import { getCategory, itemPath } from '@/lib/categories'
import { parseShare } from '@/lib/share'
import { getStandings, rankLabel, scopeOf } from '@/lib/standings'
import { list } from '@/lib/text'
import { social } from '@/lib/metadata'

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
  const description = `${list(picks.map((item) => item.name))}. What's yours? Pick between two ${category.many} at a time on FryRanker.`
  return {
    title,
    description,
    ...social(title, description),
    robots: { index: false, follow: true },
  }
}

export default async function SharePage({ params }: { params: Params }) {
  const { category, picks } = await load(params)
  const { items } = await getStandings(category, scopeOf(...picks))
  const crowdRank = (id: number) => {
    const entry = items.find((other) => other.id === id)
    return entry ? rankLabel(entry) : ''
  }

  return (
    <main className="page">
      <header className="share-hero">
        <h1 className="cond">
          What&apos;s <span>yours?</span>
        </h1>
        <p>
          Someone sent you their order. Pick between two {category.many} at a time to make your own.
        </p>
      </header>
      <div className="receipt">
        <h2 className="cond">My top 5 {category.many}</h2>
        <p className="meta">FryRanker · {category.navLabel}</p>
        <hr />
        <ol>
          {picks.map((item) => (
            <li key={item.id}>
              <Link href={itemPath(category, item)}>{item.name}</Link>
              <span className="crowd-rank">Crowd {crowdRank(item.id)}</span>
            </li>
          ))}
        </ol>
        <hr />
        <p className="thanks">Thank you, come again</p>
        <Barcode />
      </div>
      <div className="row-actions">
        <Link className="btn primary" href={category.home}>
          Rank your own
        </Link>
      </div>
    </main>
  )
}
