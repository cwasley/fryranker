import Link from 'next/link'

export const metadata = { title: 'Not found', robots: { index: false } }

export default function NotFound() {
  return (
    <main className="page">
      <header className="share-hero">
        <h1 className="cond">
          Order <span>not found</span>
        </h1>
        <p>That page fell under the seat. Let&apos;s get you back to the counter.</p>
      </header>
      <div className="row-actions">
        <Link className="btn primary" href="/">
          Back to the rankings
        </Link>
      </div>
    </main>
  )
}
