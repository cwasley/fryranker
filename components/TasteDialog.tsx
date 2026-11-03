'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { itemPath, type Category } from '@/lib/categories'
import type { Item } from '@/lib/items'
import { confidencePct, rankedTaste, topTag, type Taste } from '@/lib/taste'
import ShareButton from './ShareButton'

type Props = {
  category: Category
  taste: Taste
  open: boolean
  unlocked: boolean
  onClose: () => void
  onReset: () => void
}

export default function TasteDialog({ category, taste, open, unlocked, onClose, onReset }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const pct = confidencePct(category, taste.comparisons).toFixed(0)
  const remaining = category.thresholds.reveal - taste.comparisons
  const ranked = rankedTaste(taste)
  const items = ranked.flatMap((entry) => category.items.find((item) => item.id === entry.id) ?? [])
  const top5 = items.slice(0, 5)
  const tag = topTag(items.slice(0, 3))
  const insights = category.insights(top5)

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      aria-labelledby="taste-title"
    >
      <div className="modal-body">
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="modal-head">
          <div className="modal-emoji" aria-hidden>
            {unlocked ? '🧠' : '🔒'}
          </div>
          <div>
            <h2 id="taste-title">{unlocked ? 'Your Taste Profile' : 'Taste Profile (Locked)'}</h2>
            <p>
              {taste.comparisons} comparisons • {pct}% confidence
            </p>
          </div>
        </div>

        {unlocked ? (
          <>
            <div className="chips">
              <span className="chip">{tag || 'Still learning'}</span>
            </div>
            <div className="note">
              <p>This is your personal read based on your head-to-head votes on this device.</p>
              <p className="profile-line">
                Profile:{' '}
                {insights.map((insight, i) => (
                  <span key={insight.label}>
                    {i > 0 && ' • '}
                    <strong>{insight.value}</strong>
                  </span>
                ))}
                .
              </p>
              <p className="muted">
                {tag ? (
                  <>
                    You seem to love: <strong>{tag}</strong>.
                  </>
                ) : (
                  "We're still learning what you like most."
                )}
              </p>
              <div className="statgrid">
                {insights.map((insight) => (
                  <div key={insight.label} className="stat">
                    <div className="k">{insight.label}</div>
                    <p className="v">{insight.value}</p>
                    <p className="s">{insight.hint}</p>
                  </div>
                ))}
              </div>
              <details className="top5">
                <summary>Top 5</summary>
                <ol>
                  {top5.map((item: Item) => {
                    const entry = ranked.find((e) => e.id === item.id)!
                    const played = entry.wins + entry.losses
                    const winPct = played ? Math.round((entry.wins / played) * 100) : 0
                    return (
                      <li key={item.id}>
                        <div>
                          <Link href={itemPath(category, item)} className="top5-name">
                            {item.name}
                          </Link>
                          <div className="top5-meta">
                            {item.kind} • {entry.comps} comps • {winPct}% win
                          </div>
                        </div>
                        <span aria-hidden>{item.emoji}</span>
                      </li>
                    )
                  })}
                </ol>
              </details>
            </div>
          </>
        ) : (
          <>
            <div className="chips">
              <span className="chip">Keep it unbiased</span>
              <span className="chip red">{remaining} to unlock</span>
            </div>
            <div className="note">
              You&apos;re still calibrating. Rank <strong>{remaining}</strong> more matchup
              {remaining === 1 ? '' : 's'} and we&apos;ll reveal your current #1 + style lean.
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="pill-btn" onClick={onClose}>
            Back
          </button>
          {unlocked && <ShareButton category={category} taste={taste} className="pill-btn" />}
          <button className="pill-btn red" onClick={onReset}>
            {unlocked ? 'Reset taste profile' : 'Reset'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
