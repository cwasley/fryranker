'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { categoryList } from '@/lib/categories'

const activeKey = (pathname: string) =>
  categoryList.find(
    (category) =>
      category.key !== 'fries' &&
      (pathname.startsWith(category.base) || pathname.startsWith(`/top/${category.key}`))
  )?.key ?? 'fries'

export default function CategoryNav() {
  const active = activeKey(usePathname())

  return (
    <nav className="category-nav" aria-label="Rankings">
      {categoryList.map((category) => (
        <Link
          key={category.key}
          href={category.home}
          className={`category-tab${active === category.key ? ' active' : ''}`}
          aria-current={active === category.key ? 'page' : undefined}
        >
          <span className="category-emoji" aria-hidden>
            {category.emoji}
          </span>
          <span className="category-name">{category.navLabel}</span>
        </Link>
      ))}
    </nav>
  )
}
