import Link from 'next/link'
import { site } from '@/lib/site'

export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="liner" />
      <p>
        <b>{site.name}</b>
        <span>
          {site.credit} · <Link href="/how-it-works">How the rankings work</Link>
        </span>
      </p>
    </footer>
  )
}
