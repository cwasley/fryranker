'use client'

import { useState } from 'react'

type Props = { path: string; title: string; text: string; label: string; className: string }

export default function ShareButton({ path, title, text, label, className }: Props) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = `${window.location.origin}${path}`
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => {})
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
    <button type="button" className={className} onClick={share}>
      {copied ? 'Link copied!' : label}
    </button>
  )
}
