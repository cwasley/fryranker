'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import './CategoryNav.css'

export type Category = {
  slug: string
  name: string
  emoji: string
}

export const categories: Category[] = [
  { slug: 'fries', name: 'Fries', emoji: '🍟' },
  { slug: 'sauces', name: 'Sauces', emoji: '🌶️' },
]

export default function CategoryNav() {
  const pathname = usePathname()

  // Determine active category (default to 'fries' for '/')
  const activeSlug = pathname === '/' ? 'fries' : pathname.slice(1)

  return (
    <nav className="category-nav">
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug
        const href = cat.slug === 'fries' ? '/' : `/${cat.slug}`

        return (
          <Link key={cat.slug} href={href} className={`category-tab ${isActive ? 'active' : ''}`}>
            <span className="category-emoji">{cat.emoji}</span>
            <span className="category-name">{cat.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
