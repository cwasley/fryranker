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

type ImageProps = { path: string; text: string; label: string; className: string }

/**
 * Shares the story-size receipt image (`<share path>/story`). Phones get the share sheet with the
 * PNG attached; anywhere that can't share files downloads it instead.
 */
export function ShareImageButton({ path, text, label, className }: ImageProps) {
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'failed'>('idle')

  const share = async () => {
    setState('busy')
    try {
      const res = await fetch(`${path}/story`)
      if (!res.ok) throw new Error(`Image failed: ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], 'my-fry-order.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text }).catch(() => {})
        setState('idle')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = Object.assign(document.createElement('a'), { href: url, download: file.name })
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setState('saved')
    } catch {
      setState('failed')
    }
    setTimeout(() => setState('idle'), 2500)
  }

  return (
    <button type="button" className={className} onClick={share} disabled={state === 'busy'}>
      {state === 'busy'
        ? 'Making image…'
        : state === 'saved'
          ? 'Image saved!'
          : state === 'failed'
            ? 'Try again'
            : label}
    </button>
  )
}
