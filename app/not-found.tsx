import Link from 'next/link'

export const metadata = { title: 'Not found', robots: { index: false } }

export default function NotFound() {
  return (
    <main className="wrap page">
      <header className="item-hero">
        <div className="item-emoji" aria-hidden>
          🍟
        </div>
        <h1>That page fell under the seat</h1>
        <p className="subtitle">We couldn&apos;t find what you were looking for.</p>
      </header>
      <div className="cta-row">
        <Link className="share-btn" href="/">
          Back to the rankings
        </Link>
      </div>
    </main>
  )
}
