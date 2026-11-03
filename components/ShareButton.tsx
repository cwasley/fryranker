'use client'

import { useState } from 'react'
import type { Category } from '@/lib/categories'
import { rankedTaste, type Taste } from '@/lib/taste'
import { sharePath } from '@/lib/share'

type Props = { category: Category; taste: Taste; className: string }

export default function ShareButton({ category, taste, className }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const ids = rankedTaste(taste)
      .slice(0, 5)
      .map((entry) => entry.id)
    const names = ids.map(
      (id, i) => `${i + 1}. ${category.items.find((item) => item.id === id)?.name}`
    )
    const url = `${window.location.origin}${sharePath(category, ids)}`
    const text = `My top 5 ${category.many}: ${names.join(', ')}. What's yours?`

    if (navigator.share) {
      await navigator.share({ title: `My top 5 ${category.many}`, text, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(url, '_blank', 'noopener')
    }
  }

  return (
    <button className={className} onClick={share}>
      {copied ? 'Link copied!' : `${category.emoji} Share my top 5`}
    </button>
  )
}
