'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { SuggestionGroup } from '@/lib/suggestions'

/** Approve, reject or undo suggested spots, and copy the approved list to hand off. */
export default function AdminSpots({ groups }: { groups: SuggestionGroup[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const pending = groups.filter((g) => g.status === 'pending')
  const approved = groups.filter((g) => g.status === 'approved')

  const set = async (group: SuggestionGroup, status: 'pending' | 'approved' | 'rejected') => {
    setBusy(group.key)
    setError('')
    const res = await fetch('/api/admin/spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: group.ids, status }),
    }).catch(() => null)
    setBusy(null)
    if (!res?.ok) return setError('That didn’t save. Log in again and retry.')
    router.refresh()
  }

  const copy = async () => {
    const text = approved
      .map(
        (g) =>
          `- ${g.name} (${g.city}${g.neighborhood ? `, ${g.neighborhood}` : ''})` +
          `${g.address ? `, ${g.address}` : ''}. Suggested ${g.count}x as ${g.kinds.join('/')}.` +
          ` Ids ${g.ids.join(' ')}.${g.notes.length ? ` Notes: ${g.notes.slice(0, 3).join(' | ')}` : ''}`
      )
      .join('\n')
    await navigator.clipboard.writeText(`Add these approved FryRanker spots:\n${text}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const row = (group: SuggestionGroup) => (
    <li key={group.key} className="admin-row">
      <div>
        <b>{group.name}</b>{' '}
        <small>
          · {group.city} · suggested {group.count}x
        </small>
        <p>
          {[group.neighborhood, group.address].filter(Boolean).join(' · ') || 'No location given'}
          {' · '}
          {group.kinds.join(', ')}
        </p>
        {group.notes.slice(0, 3).map((note, i) => (
          <q key={i}>{note}</q>
        ))}
      </div>
      <div className="admin-acts">
        {group.status === 'pending' ? (
          <>
            <button
              type="button"
              className="btn primary"
              disabled={busy === group.key}
              onClick={() => set(group, 'approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy === group.key}
              onClick={() => set(group, 'rejected')}
            >
              Reject
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={busy === group.key}
            onClick={() => set(group, 'pending')}
          >
            Undo
          </button>
        )}
      </div>
    </li>
  )

  return (
    <>
      {error && (
        <p role="alert" className="suggest-error">
          {error}
        </p>
      )}
      <section className="me-card">
        <h2 className="cond">Suggested spots ({pending.length})</h2>
        {pending.length ? (
          <ul className="admin-list">{pending.map(row)}</ul>
        ) : (
          <p className="me-note">Nothing waiting.</p>
        )}
      </section>
      <section className="me-card">
        <h2 className="cond">Approved, to add ({approved.length})</h2>
        {approved.length ? (
          <>
            <ul className="admin-list">{approved.map(row)}</ul>
            <div className="row-actions">
              <button type="button" className="btn primary" onClick={copy}>
                {copied ? 'Copied!' : 'Copy approved list'}
              </button>
            </div>
            <p className="me-note">
              Paste the list to Claude: it checks each spot is real and open, adds it to the board,
              and marks it added.
            </p>
          </>
        ) : (
          <p className="me-note">Approve a suggestion and it lands here.</p>
        )}
      </section>
    </>
  )
}
