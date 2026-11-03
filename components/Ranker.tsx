'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, itemPath, type Category } from '@/lib/categories'
import { eloDelta, GLOBAL_K } from '@/lib/elo'
import type { Item } from '@/lib/items'
import type { Ranked } from '@/lib/standings'
import {
  confidenceHint,
  confidencePct,
  rankedTaste,
  topTag,
  useTaste,
  type Taste,
} from '@/lib/taste'
import Chips from './Chips'
import ShareButton from './ShareButton'
import TasteDialog from './TasteDialog'

type Props = {
  categoryKey: Category['key']
  standings: Ranked[]
}

const VOTE_COOLDOWN_MS = 1000
const RATE_LIMIT_MS = 60_000

type Pair = [number, number]

function randomPair(items: Item[], include?: number): Pair {
  const pick = () => items[Math.floor(Math.random() * items.length)].id
  const first = include ?? pick()
  let second = pick()
  while (second === first) second = pick()
  return Math.random() < 0.5 ? [first, second] : [second, first]
}

/** `?a=slug&b=slug` starts on that matchup; `?with=slug` starts with that item. */
function pairFromUrl(items: Item[]): Pair | undefined {
  const params = new URLSearchParams(window.location.search)
  const find = (slug: string | null) => items.find((item) => item.slug === slug)?.id
  const a = find(params.get('a'))
  const b = find(params.get('b'))
  const only = find(params.get('with'))
  if (a === undefined && b === undefined && only === undefined) return undefined
  window.history.replaceState(null, '', window.location.pathname)
  if (a !== undefined && b !== undefined && a !== b) return [a, b]
  return randomPair(items, a ?? b ?? only)
}

function summary(category: Category, taste: Taste, byId: Map<number, Item>) {
  const { reveal } = category.thresholds
  if (taste.comparisons < reveal) {
    const remaining = reveal - taste.comparisons
    return {
      headline: 'Hidden until you vote a bit…',
      sub: `Rank ${remaining} more matchup${remaining === 1 ? '' : 's'} to unlock your taste read.`,
      emoji: '🔒',
    }
  }
  const ranked = rankedTaste(taste)
  const top = byId.get(ranked[0].id)
  if (!top)
    return {
      headline: 'Warming up…',
      sub: 'Your favorites will sharpen as you vote.',
      emoji: category.emoji,
    }
  const tag = topTag(ranked.slice(0, 3).flatMap((entry) => byId.get(entry.id) ?? []))
  return {
    headline: `Your #1 right now: ${top.name}`,
    sub: tag ? `You seem to love: ${tag}.` : 'Keep going to refine your style.',
    emoji: top.emoji,
  }
}

export default function Ranker({ categoryKey, standings: initial }: Props) {
  const category = categories[categoryKey]
  const { taste, record, reset } = useTaste(category)
  const [standings, setStandings] = useState(initial)
  const [pair, setPair] = useState<Pair | null>(null)
  const [pressed, setPressed] = useState<number | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const lastVote = useRef(-Infinity)

  const byId = useMemo(() => new Map(category.items.map((item) => [item.id, item])), [category])
  const sorted = useMemo(() => [...standings].sort((a, b) => b.score - a.score), [standings])
  const totalVotes = Math.round(standings.reduce((sum, item) => sum + item.battles, 0) / 2)

  useEffect(() => {
    // The first matchup is random, so it can only be picked after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPair(pairFromUrl(category.items) ?? randomPair(category.items))
  }, [category])

  useEffect(() => {
    if (!rateLimited) return
    const timer = setTimeout(() => setRateLimited(false), RATE_LIMIT_MS)
    return () => clearTimeout(timer)
  }, [rateLimited])

  const applyScores = (updates: { id: number; score: number; battles: number }[]) =>
    setStandings((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.id === item.id)
        return update ? { ...item, score: update.score, battles: update.battles } : item
      })
    )

  const vote = (winnerIndex: 0 | 1, now: number) => {
    if (!pair || rateLimited || now - lastVote.current < VOTE_COOLDOWN_MS) return
    lastVote.current = now
    setPressed(winnerIndex)
    setTimeout(() => setPressed(null), 500)

    const winnerId = pair[winnerIndex]
    const loserId = pair[winnerIndex === 0 ? 1 : 0]
    record(winnerId, loserId)

    const winner = standings.find((item) => item.id === winnerId)
    const loser = standings.find((item) => item.id === loserId)
    if (winner && loser) {
      const delta = eloDelta(winner.score, loser.score, GLOBAL_K)
      applyScores([
        { id: winnerId, score: winner.score + delta, battles: winner.battles + 1 },
        { id: loserId, score: loser.score - delta, battles: loser.battles + 1 },
      ])
      const undo = () => applyScores([winner, loser])
      fetch(category.voteApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId }),
      })
        .then(async (res) => {
          if (res.status === 429) setRateLimited(true)
          if (!res.ok) return undo()
          const { updates } = await res.json()
          applyScores([
            { id: winnerId, score: updates.winner.newScore, battles: updates.winner.battles },
            { id: loserId, score: updates.loser.newScore, battles: updates.loser.battles },
          ])
        })
        .catch(undo)
    }

    setTimeout(() => setPair(randomPair(category.items)), 100)
  }

  const read = summary(category, taste, byId)
  const pct = confidencePct(category, taste.comparisons)
  const unlocked = taste.comparisons >= category.thresholds.reveal

  return (
    <>
      <section className="confidence" aria-label="Your taste profile">
        <div className="confidence-top">
          <h2 className="confidence-title">Your Taste Confidence</h2>
          <div className="confidence-meta">
            <span>{taste.comparisons}</span> comparisons
          </div>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-label="Taste confidence"
        >
          <div style={{ width: `${pct.toFixed(0)}%` }} />
        </div>
        <p className="confidence-hint">{confidenceHint(category, taste.comparisons)}</p>

        <div className="taste-card">
          <div className="taste-left">
            <p className="taste-kicker">Current read</p>
            <p className="taste-main">{read.headline}</p>
            <p className="taste-sub">{read.sub}</p>
          </div>
          <div className="taste-emoji" aria-hidden>
            {read.emoji}
          </div>
          <button className="taste-btn" onClick={() => setDialogOpen(true)}>
            View
          </button>
        </div>
        {unlocked && <ShareButton category={category} taste={taste} className="share-btn" />}
      </section>

      <div className="grid">
        <section className="duel-container" aria-label="Matchup">
          <p className="duel-kicker">Which is better?</p>
          {rateLimited && (
            <div className="rate-limit-notice" role="status">
              <strong>Easy on the {category.many}.</strong>
              <br />
              We love the passion, but let the grease cool for a sec.
              <br />
              Come back in a bit and keep the rankings honest.
            </div>
          )}
          <div className={`duel-cards${rateLimited ? ' disabled' : ''}`}>
            {([0, 1] as const).map((index) => {
              const item = pair ? byId.get(pair[index]) : undefined
              if (!item) return <div key={index} className="duel-card placeholder" aria-hidden />
              return (
                <button
                  key={`${index}-${item.id}`}
                  type="button"
                  className={`duel-card${pressed === index ? ' active-vote vote-animate' : ''}`}
                  onClick={(event) => vote(index, event.timeStamp)}
                  disabled={rateLimited}
                >
                  <span className="emoji" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="duel-name">{item.name}</span>
                  <span className="style-line">{item.kind}</span>
                  <Chips tags={item.tags.slice(0, 3)} spicy={category.spicy} />
                </button>
              )
            })}
          </div>
          <div className="duel-actions">
            <button className="pill-btn" onClick={() => setPair(randomPair(category.items))}>
              Skip matchup
            </button>
          </div>
        </section>

        <section className="leaderboard-container" aria-labelledby="standings">
          <div className="section-title">
            <h2 id="standings">Global Standings</h2>
            <small>{totalVotes.toLocaleString('en-US')} total votes</small>
          </div>
          <ol className="standings">
            {sorted.map((item, index) => (
              <li key={item.id}>
                <Link href={itemPath(category, item)} className="fry-row">
                  <span className="row-left">
                    <span className="rank-number">{index + 1}</span>
                    <span className="info">
                      <span className="info-name">{item.name}</span>
                      <span className="info-meta">
                        {item.kind} • {item.battles.toLocaleString('en-US')} battles
                      </span>
                    </span>
                  </span>
                  <span className="score-badge">{item.score}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <TasteDialog
        category={category}
        taste={taste}
        open={dialogOpen}
        unlocked={unlocked}
        onClose={() => setDialogOpen(false)}
        onReset={() => {
          reset()
          setDialogOpen(false)
        }}
      />
    </>
  )
}
