'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, itemPath, type Category } from '@/lib/categories'
import { eloDelta, GLOBAL_K } from '@/lib/elo'
import type { Item } from '@/lib/items'
import { badge, isHotTake, split, verdict, type Split } from '@/lib/reveal'
import { sharePath } from '@/lib/share'
import type { MatchupRow, Ranked } from '@/lib/standings'
import { rankedTaste, useTaste } from '@/lib/taste'
import { list } from '@/lib/text'
import Barcode from './Barcode'
import Disc from './Disc'
import Name from './Name'
import ShareButton from './ShareButton'

type Props = {
  categoryKey: Category['key']
  standings: Ranked[]
  totalVotes: number
  matchups: MatchupRow[]
}

const ROUND = 10
const REVEAL_MS = 1500
const VOTE_COOLDOWN_MS = 1000
const RATE_LIMIT_MS = 60_000

type Pair = [number, number]
type Pick = { winner: Item; loser: Item; split: Split }

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

const SQUIGGLE =
  'M 55 4 C 88 1, 99 20, 98 52 C 97 84, 76 98, 45 96 C 14 94, 1 76, 3 48 C 5 20, 22 5, 62 8 C 70 9, 74 12, 76 15'

export default function Ranker({ categoryKey, standings: initial, totalVotes, matchups }: Props) {
  const category = categories[categoryKey]
  const { taste, record, reset } = useTaste(category)
  const [standings, setStandings] = useState(initial)
  const [pair, setPair] = useState<Pair | null>(null)
  const [picked, setPicked] = useState<{ index: 0 | 1; split: Split } | null>(null)
  const [round, setRound] = useState<{ n: number; picks: Pick[] }>({ n: 1, picks: [] })
  const [cast, setCast] = useState(0)
  const [rateLimited, setRateLimited] = useState(false)
  const lastVote = useRef(-Infinity)

  const byId = useMemo(() => new Map(standings.map((item) => [item.id, item])), [standings])
  const records = useMemo(() => {
    const map = new Map<string, [number, number]>()
    for (const [a, b, aWins, bWins] of matchups) {
      map.set(`${a}:${b}`, [aWins, bWins])
      map.set(`${b}:${a}`, [bWins, aWins])
    }
    return map
  }, [matchups])

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

  const next = () => {
    setPicked(null)
    setPair(randomPair(category.items))
  }

  const vote = (index: 0 | 1, now: number) => {
    if (!pair || picked || rateLimited || now - lastVote.current < VOTE_COOLDOWN_MS) return
    lastVote.current = now
    const winner = byId.get(pair[index])
    const loser = byId.get(pair[index === 0 ? 1 : 0])
    if (!winner || !loser) return

    const [wins, losses] = records.get(`${winner.id}:${loser.id}`) ?? [0, 0]
    const result = split(winner.score, loser.score, wins, losses)
    setPicked({ index, split: result })
    setRound((r) => ({ ...r, picks: [...r.picks, { winner, loser, split: result }] }))
    setCast((n) => n + 1)
    record(winner.id, loser.id)
    navigator.vibrate?.(12)

    const delta = eloDelta(winner.score, loser.score, GLOBAL_K)
    applyScores([
      { id: winner.id, score: winner.score + delta, battles: winner.battles + 1 },
      { id: loser.id, score: loser.score - delta, battles: loser.battles + 1 },
    ])
    const undo = () => applyScores([winner, loser])
    fetch(category.voteApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId: winner.id, loserId: loser.id }),
    })
      .then(async (res) => {
        if (res.status === 429) setRateLimited(true)
        if (!res.ok) return undo()
        const { updates } = await res.json()
        applyScores([
          { id: winner.id, score: updates.winner.newScore, battles: updates.winner.battles },
          { id: loser.id, score: updates.loser.newScore, battles: updates.loser.battles },
        ])
      })
      .catch(undo)

    setTimeout(next, REVEAL_MS)
  }

  if (round.picks.length >= ROUND && !picked) {
    return (
      <Receipt
        category={category}
        round={round}
        top={rankedTaste(taste)
          .slice(0, 5)
          .flatMap((entry) => byId.get(entry.id) ?? [])}
        onAgain={() => {
          setRound((r) => ({ n: r.n + 1, picks: [] }))
          next()
        }}
        onReset={() => {
          reset()
          setRound({ n: 1, picks: [] })
          next()
        }}
      />
    )
  }

  const current = pair ? [byId.get(pair[0]), byId.get(pair[1])] : null
  const pickedItem = picked && current?.[picked.index]
  const leftPct = picked ? (picked.index === 0 ? picked.split.pct : 100 - picked.split.pct) : 50

  return (
    <div>
      <div className="ticket">
        <div className="order">
          Order #{(totalVotes + cast + 1).toLocaleString('en-US')}
          <small>
            Round {round.n} · pick {Math.min(round.picks.length + 1, ROUND)} of {ROUND}
          </small>
        </div>
        <div className="dots" aria-label={`${round.picks.length} of ${ROUND} picks this round`}>
          {Array.from({ length: ROUND }, (_, i) => {
            const p = round.picks[i]
            return <i key={i} className={p ? (isHotTake(p.split) ? 'hot' : 'agree') : ''} />
          })}
        </div>
      </div>

      <h2 className="ask cond">
        Which is <em>better?</em>
      </h2>

      <div className={`duel${picked ? ' revealed' : ''}`}>
        {([0, 1] as const).map((index) => {
          const item = current?.[index]
          if (!item) return <div key={index} className="choice placeholder" aria-hidden />
          const state = picked ? (picked.index === index ? ' won' : ' lost') : ''
          return (
            <button
              key={`${index}-${item.id}`}
              type="button"
              className={`choice${state}`}
              onClick={(event) => vote(index, event.timeStamp)}
              disabled={rateLimited}
            >
              <span className="plate">#{item.rank}</span>
              <Disc category={category} item={item} />
              <span>
                <span className="name cond">
                  <Name text={item.name} />
                </span>
                <span className="kind-tag">{item.kind}</span>
                <span className="tags">{item.tags.slice(0, 3).join(' · ')}</span>
              </span>
              {picked?.index === index && (
                <>
                  <svg
                    className="squiggle"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path vectorEffect="non-scaling-stroke" d={SQUIGGLE} />
                  </svg>
                  <span className={`badge cond${isHotTake(picked.split) ? '' : ' agree'}`}>
                    {badge(picked.split)}
                  </span>
                </>
              )}
            </button>
          )
        })}
        <span className="or cond" aria-hidden>
          or
        </span>
      </div>

      <div className="split" role="status">
        {picked && pickedItem && current[0] && current[1] && (
          <>
            <div className="bar">
              <b style={{ width: `${leftPct}%` }} />
            </div>
            <p>
              {verdict(picked.split, pickedItem.name)}
              <span className="counts">
                <span>
                  {current[0].name} {leftPct}%
                </span>
                <span>
                  {100 - leftPct}% {current[1].name}
                </span>
              </span>
            </p>
          </>
        )}
      </div>

      {rateLimited && (
        <p className="rate-limit" role="status">
          Easy on the {category.many}. Let the grease cool for a minute, then keep the rankings
          honest.
        </p>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={next} disabled={Boolean(picked)}>
          Too close to call
        </button>
      </div>
    </div>
  )
}

type ReceiptProps = {
  category: Category
  round: { n: number; picks: Pick[] }
  top: Ranked[]
  onAgain: () => void
  onReset: () => void
}

function Receipt({ category, round, top, onAgain, onReset }: ReceiptProps) {
  const agreed = round.picks.filter((p) => !isHotTake(p.split)).length
  const hottest = [...round.picks].sort((a, b) => a.split.pct - b.split.pct)[0]
  const profile = category
    .insights(top)
    .slice(0, 2)
    .map((insight) => insight.value)
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="recap">
      <div className="receipt">
        <h2 className="cond">Round {round.n} receipt</h2>
        <p className="meta">
          FryRanker · {category.navLabel} · {today}
        </p>
        <div className="line">
          <span>Picks</span>
          <span>{round.picks.length}</span>
        </div>
        <div className="line">
          <span>Sided with the crowd</span>
          <span>{agreed}</span>
        </div>
        <div className="line">
          <span>Hot takes</span>
          <span>{round.picks.length - agreed}</span>
        </div>
        <hr />
        {hottest && (
          <p className="hot">
            {isHotTake(hottest.split) ? 'Hottest take' : 'Boldest pick'}: {hottest.winner.name} over{' '}
            {hottest.loser.name}.{' '}
            {hottest.split.direct
              ? `${hottest.split.pct}% of voters agree.`
              : `The rankings give it ${hottest.split.pct}%.`}
          </p>
        )}
        <hr />
        <p className="profile">
          Your order<b>{profile.join(' · ')}</b>
        </p>
        <hr />
        <div className="line">
          <span>Your top 5 so far</span>
        </div>
        <ol>
          {top.map((item) => (
            <li key={item.id}>
              <Link href={itemPath(category, item)}>{item.name}</Link>
            </li>
          ))}
        </ol>
        <hr />
        <div className="line total cond">
          <span>Total</span>
          <span>{round.picks.length} picks</span>
        </div>
        <p className="thanks">Thank you, come again</p>
        <Barcode />
      </div>
      <div>
        <div className="row-actions">
          <button type="button" className="btn primary" onClick={onAgain}>
            Another round
          </button>
          <ShareButton
            className="btn"
            label="Share receipt"
            path={sharePath(
              category,
              top.map((item) => item.id)
            )}
            title={`My top 5 ${category.many}`}
            text={`My top 5 ${category.many}: ${list(top.map((item) => item.name))}. What's yours?`}
          />
        </div>
        <button type="button" className="start-over" onClick={onReset}>
          Start my rankings over
        </button>
      </div>
    </div>
  )
}
