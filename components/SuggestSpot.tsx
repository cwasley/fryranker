'use client'

import { useEffect, useState } from 'react'
import type { PlaceResult } from '@/lib/places'
import { FRY_STYLES } from '@/lib/places'

type Props = {
  categoryKey: string
  cityKey: string
  cityName: string
  /** Foursquare search is configured; otherwise visitors type the name and neighborhood. */
  search: boolean
}

type Status = 'closed' | 'open' | 'sending' | 'sent'

export default function SuggestSpot({ categoryKey, cityKey, cityName, search }: Props) {
  const [status, setStatus] = useState<Status>('closed')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [name, setName] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [kind, setKind] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    if (!search || place || query.trim().length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/places?city=${cityKey}&q=${encodeURIComponent(query.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((body: { results: PlaceResult[] }) => setResults(body.results))
        .catch(() => {})
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, cityKey, query, place])

  if (status === 'closed') {
    return (
      <button type="button" className="btn" onClick={() => setStatus('open')}>
        Suggest a spot
      </button>
    )
  }

  if (status === 'sent') {
    return (
      <p className="suggest-done" role="status">
        Got it, thanks! We check suggestions every week and add the good ones to the {cityName}{' '}
        board.
      </p>
    )
  }

  const spotName = place?.name ?? name.trim()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (spotName.length < 2) return setError('Add the spot’s name.')
    if (!kind) return setError('Pick a fry style.')
    setStatus('sending')
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: categoryKey,
        city: cityKey,
        name: spotName,
        neighborhood: place?.neighborhood || neighborhood,
        address: place?.address,
        placeId: place?.placeId,
        kind,
        note,
        website,
      }),
    }).catch(() => null)
    if (res?.ok) return setStatus('sent')
    const body = await res?.json().catch(() => null)
    setError(body?.error ?? 'That didn’t go through. Try again in a moment.')
    setStatus('open')
  }

  return (
    <form className="suggest" onSubmit={submit}>
      <h3 className="cond">Suggest a spot</h3>
      {search ? (
        place ? (
          <p className="picked">
            <b>{place.name}</b>
            <small>{place.address}</small>
            <button type="button" onClick={() => setPlace(null)}>
              Change
            </button>
          </p>
        ) : (
          <label>
            Spot
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${cityName} restaurants`}
              autoComplete="off"
              maxLength={60}
            />
            {results.length > 0 && (
              <ul className="results">
                {results.map((result) => (
                  <li key={result.placeId}>
                    <button type="button" onClick={() => setPlace(result)}>
                      <b>{result.name}</b>
                      <small>{result.address}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>
        )
      ) : (
        <>
          <label>
            Spot name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
            />
          </label>
          <label>
            Neighborhood
            <input
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              maxLength={60}
            />
          </label>
        </>
      )}
      <label>
        Fry style
        <select value={kind} onChange={(event) => setKind(event.target.value)} required>
          <option value="">Pick one</option>
          {FRY_STYLES.map((style) => (
            <option key={style}>{style}</option>
          ))}
        </select>
      </label>
      <label>
        What makes them great? <small>(optional)</small>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} />
      </label>
      <label className="hp" aria-hidden>
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </label>
      {error && (
        <p className="suggest-error" role="alert">
          {error}
        </p>
      )}
      <div className="row-actions">
        <button type="submit" className="btn primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send suggestion'}
        </button>
        <button type="button" className="btn" onClick={() => setStatus('closed')}>
          Cancel
        </button>
      </div>
    </form>
  )
}
