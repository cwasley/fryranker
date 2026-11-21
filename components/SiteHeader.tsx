'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { categories, categoryList } from '@/lib/categories'

export default function SiteHeader() {
  const pathname = usePathname()
  const active =
    categoryList.find(
      (c) => c.home !== '/' && (pathname.startsWith(c.base) || pathname.startsWith(`/top/${c.key}`))
    ) ?? categories.fries
  const onMine = pathname === '/me'
  const onShop = pathname === '/merch'
  const onPick = !onMine && pathname === active.home
  const onMenu = pathname.startsWith(`${active.base}/`)

  return (
    <header className="top">
      <div className="liner" />
      <div className="bar-row">
        <Link className="logo cond" href="/">
          Fry<span>Ranker</span>
        </Link>
        <nav className="tabs" aria-label="Sections">
          <Link href={active.home} aria-current={onPick ? 'page' : undefined}>
            Pick
          </Link>
          <Link href={`${active.home}#menu`} aria-current={onMenu ? 'page' : undefined}>
            Menu
          </Link>
          <Link href="/me" aria-current={onMine ? 'page' : undefined}>
            Mine
          </Link>
        </nav>
      </div>
      <nav className="cats" aria-label="Rankings">
        {categoryList.map((c) => (
          <Link
            key={c.key}
            href={c.home}
            aria-current={c.key === active.key && !onShop ? 'page' : undefined}
          >
            {c.navLabel}
          </Link>
        ))}
        <Link href="/merch" aria-current={onShop ? 'page' : undefined}>
          Merch
        </Link>
      </nav>
    </header>
  )
}
