'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  categories,
  citiesFor,
  cityPath,
  itemPath,
  localsIn,
  type Category,
} from '@/lib/categories'
import { getCity, type City } from '@/lib/cities'
import { eloDelta, GLOBAL_K } from '@/lib/elo'
import { isLocal, type Item } from '@/lib/items'
import { badge, isHotTake, split, verdict, type Split } from '@/lib/reveal'
import { sharePath } from '@/lib/share'
import { rankLabel, type MatchupRow, type Ranked } from '@/lib/standings'
import { rankedTaste, useTaste } from '@/lib/taste'
import { list } from '@/lib/text'
import { readIds, SPOTS_EVENT, visitorKeys, writeIds } from '@/lib/visitor'
import Barcode from './Barcode'
import Disc from './Disc'
import Name from './Name'
import ShareButton, { ShareImageButton } from './ShareButton'

type Props = {
  categoryKey: Category['key']
  standings: Ranked[]
  totalVotes: number
  matchups: MatchupRow[]
  /** Set on a city board: every matchup includes at least one of the city's local spots. */
  cityKey?: string
}

const ROUND = 10
const REVEAL_MS = 1500
const VOTE_COOLDOWN_MS = 1000
const RATE_LIMIT_MS = 60_000

type Pair = [number, number]
type Pick = { winner: Item; loser: Item; split: Split }

/**
 * A random pair from the pool, leaving out anything the visitor hasn't tried (unless that leaves
 * too few). `include` pins one side. On a city board, with nothing pinned, one side is always a
 * local spot.
 */
function randomPair(pool: Item[], skip: Set<number>, cityBoard: boolean, include?: number): Pair {
  const tried = pool.filter((item) => !skip.has(item.id))
  const usable = tried.length >= 2 ? tried : pool
  const any = (items: Item[]) => items[Math.floor(Math.random() * items.length)].id
  const locals = usable.filter(isLocal)
  const first = include ?? (cityBoard && locals.length ? any(locals) : any(usable))
  const others = usable.filter((item) => item.id !== first)
  const second = any(others.length ? others : pool.filter((item) => item.id !== first))
  return Math.random() < 0.5 ? [first, second] : [second, first]
}

/** `?a=slug&b=slug` starts on that matchup; `?with=slug` starts with that item. */
function pairFromUrl(pool: Item[], skip: Set<number>, cityBoard: boolean): Pair | undefined {
  const params = new URLSearchParams(window.location.search)
  const find = (slug: string | null) => pool.find((item) => item.slug === slug)?.id
  const a = find(params.get('a'))
  const b = find(params.get('b'))
  const only = find(params.get('with'))
  if (a === undefined && b === undefined && only === undefined) return undefined
  window.history.replaceState(null, '', window.location.pathname)
  if (a !== undefined && b !== undefined && a !== b) return [a, b]
  return randomPair(pool, skip, cityBoard, a ?? b ?? only)
}

/**
 * What the visitor has and hasn't had, kept on the device like the taste profile. `been` is null
 * until they answer the checklist; after that, local spots they didn't check are skipped.
 */
function useSpots(category: Category, locals: Item[]) {
  const { untried: untriedKey, been: beenKey, asked: askedKey } = visitorKeys(category)
  type Spots = { untried: Set<number>; been: Set<number> | null; asked: Set<number> }
  const [state, setState] = useState<Spots>({ untried: new Set(), been: null, asked: new Set() })
  // The latest value, so taps that land before a re-render build on each other.
  const latest = useRef(state)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // Storage is only readable after hydration.
    const been = readIds(beenKey)
    latest.current = {
      untried: readIds(untriedKey) ?? new Set(),
      been,
      // Answered before this key existed: treat every spot they could see then as asked.
      asked: readIds(askedKey) ?? (been ? new Set(locals.map((item) => item.id)) : new Set()),
    }
    setState(latest.current)
    setReady(true)
    // Read once, after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [untriedKey, beenKey, askedKey])

  const save = (next: Spots) => {
    latest.current = next
    setState(next)
    writeIds(untriedKey, next.untried)
    if (next.been) {
      writeIds(beenKey, next.been)
      writeIds(askedKey, next.asked)
    }
    return next
  }
  const without = (ids: Set<number>, id: number) => new Set([...ids].filter((x) => x !== id))

  return {
    /** Storage has been read; until then, don't pick a matchup or show the checklist. */
    ready,
    untried: state.untried,
    been: state.been,
    asked: state.asked,
    /** "Never had X". */
    neverHad: (id: number) => {
      const { untried, been, asked } = latest.current
      return save({ untried: new Set([...untried, id]), been: been && without(been, id), asked })
    },
    /** Checks or unchecks a spot on the checklist. */
    toggle: (id: number) => {
      const { untried, been } = latest.current
      const current = been ?? new Set<number>()
      const asked = new Set(locals.map((item) => item.id))
      return current.has(id)
        ? save({ untried, been: without(current, id), asked })
        : save({ untried: without(untried, id), been: new Set([...current, id]), asked })
    },
    /** Saves the checklist as answered, even with nothing checked. */
    answer: () => {
      const { untried, been } = latest.current
      return save({
        untried,
        been: been ?? new Set(),
        asked: new Set(locals.map((item) => item.id)),
      })
    },
    clear: () => {
      save({ untried: new Set(), been: null, asked: new Set() })
      try {
        localStorage.removeItem(beenKey)
        localStorage.removeItem(askedKey)
      } catch {
        // Nothing to clear.
      }
      window.dispatchEvent(new Event(SPOTS_EVENT))
    },
  }
}

/**
 * Skip anything marked "Never had", and once the checklist is answered, every spot it listed that
 * wasn't checked. Spots added since then aren't skipped until the visitor says.
 */
const skipSet = (
  locals: Item[],
  untried: Set<number>,
  been: Set<number> | null,
  asked: Set<number>
) =>
  been
    ? new Set([
        ...untried,
        ...locals.filter((item) => asked.has(item.id) && !been.has(item.id)).map((item) => item.id),
      ])
    : untried

/** On the national board, points visitors in a city with a board to it. */
function NearBanner({ category }: { category: Category }) {
  const [city, setCity] = useState<City>()
  useEffect(() => {
    if (!citiesFor(category).length) return
    let live = true
    fetch('/api/where')
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { city: string | null } | null) => {
        const found = getCity(body?.city ?? undefined)
        if (live && found && citiesFor(category).includes(found)) setCity(found)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [category])
  if (!city) return null
  return (
    <Link className="near" href={cityPath(category, city)}>
      In {city.short}? Rank {localsIn(category, city.key).length} local spots &rarr;
    </Link>
  )
}

const SQUIGGLE =
  'M 55 4 C 88 1, 99 20, 98 52 C 97 84, 76 98, 45 96 C 14 94, 1 76, 3 48 C 5 20, 22 5, 62 8 C 70 9, 74 12, 76 15'

export default function Ranker({
  categoryKey,
  standings: initial,
  totalVotes,
  matchups,
  cityKey,
}: Props) {
  const category = categories[categoryKey]
  const cityBoard = cityKey !== undefined
  const { taste, record, reset } = useTaste(category)
  const locals = useMemo(() => initial.filter(isLocal), [initial])
  const spots = useSpots(category, locals)
  const skip = skipSet(locals, spots.untried, spots.been, spots.asked)
  const [checklistOpen, setChecklistOpen] = useState(false)
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
    // The first matchup is random, so it can only be picked after hydration, and after the
    // visitor's spots are read so it never shows one they've ruled out.
    if (!spots.ready) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPair(pairFromUrl(initial, skip, cityBoard) ?? randomPair(initial, skip, cityBoard))
    // Only on load: later pairs come from next().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, spots.ready])

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

  const next = (without = skip) => {
    setPicked(null)
    setPair(randomPair(initial, without, cityBoard))
  }

  const neverHad = (id: number) => {
    const { untried, been, asked } = spots.neverHad(id)
    next(skipSet(locals, untried, been, asked))
  }

  const closeChecklist = () => {
    const { untried, been, asked } = spots.answer()
    setChecklistOpen(false)
    next(skipSet(locals, untried, been, asked))
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
          .flatMap((entry) => byId.get(entry.id) ?? [])
          .slice(0, 5)}
        onAgain={() => {
          setRound((r) => ({ n: r.n + 1, picks: [] }))
          next()
        }}
        onReset={() => {
          reset()
          spots.clear()
          setRound({ n: 1, picks: [] })
          next(new Set())
        }}
      />
    )
  }

  const current = pair ? [byId.get(pair[0]), byId.get(pair[1])] : null
  const pickedItem = picked && current?.[picked.index]
  const leftPct = picked ? (picked.index === 0 ? picked.split.pct : 100 - picked.split.pct) : 50

  return (
    <div>
      {!cityBoard && <NearBanner category={category} />}
      {cityBoard && spots.ready && (
        <Checklist
          locals={locals}
          been={spots.been}
          fresh={spots.been ? locals.filter((item) => !spots.asked.has(item.id)).length : 0}
          open={checklistOpen || spots.been === null}
          onToggle={(id) => {
            // Stay open until "Done", even once the first tap has saved an answer.
            setChecklistOpen(true)
            spots.toggle(id)
          }}
          onOpen={() => setChecklistOpen(true)}
          onDone={closeChecklist}
        />
      )}
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
              <span className="plate">{rankLabel(item)}</span>
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

      {cityBoard && current?.[0] && current[1] && !picked && (
        <p className="never-had">
          Haven&apos;t had one?{' '}
          {current.map(
            (item) =>
              item && (
                <button key={item.id} type="button" onClick={() => neverHad(item.id)}>
                  Never had {item.name}
                </button>
              )
          )}
        </p>
      )}

      <div className="row-actions">
        <button type="button" className="btn" onClick={() => next()} disabled={Boolean(picked)}>
          Too close to call
        </button>
      </div>
    </div>
  )
}

type ChecklistProps = {
  locals: Item[]
  been: Set<number> | null
  /** Spots added since the visitor last answered. */
  fresh: number
  open: boolean
  onToggle: (id: number) => void
  onOpen: () => void
  onDone: () => void
}

/** "Which of these have you had?" Local matchups then stick to the spots the visitor checked. */
function Checklist({ locals, been, fresh, open, onToggle, onOpen, onDone }: ChecklistProps) {
  if (!open) {
    const count = been?.size ?? 0
    return (
      <p className="been-summary">
        {count
          ? `Matchups use the ${count === 1 ? '1 spot' : `${count} spots`} you've had.`
          : "You haven't checked any local spots, so these matchups are chains only."}{' '}
        {fresh > 0 && (
          <b>{fresh === 1 ? '1 new spot' : `${fresh} new spots`} since you last checked. </b>
        )}
        <button type="button" onClick={onOpen}>
          {fresh > 0 ? 'Had any?' : 'Edit your spots'}
        </button>
      </p>
    )
  }
  return (
    <section className="been" aria-labelledby="been-title">
      <h2 id="been-title" className="cond">
        Which of these have you had?
      </h2>
      <p>Tap every spot you&apos;ve tried. You&apos;ll only get matchups for those.</p>
      <div className="chips">
        {locals.map((item) => {
          const on = been?.has(item.id) ?? false
          return (
            <button
              key={item.id}
              type="button"
              className={on ? 'on' : ''}
              aria-pressed={on}
              onClick={() => onToggle(item.id)}
            >
              {item.name}
            </button>
          )
        })}
      </div>
      <button type="button" className="btn primary" onClick={onDone}>
        {been?.size ? 'Done' : "I haven't had any"}
      </button>
    </section>
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
            label="Share link"
            path={sharePath(
              category,
              top.map((item) => item.id)
            )}
            title={`My top 5 ${category.many}`}
            text={`My top 5 ${category.many}: ${list(top.map((item) => item.name))}. What's yours?`}
          />
          {top.length === 5 && (
            <ShareImageButton
              className="btn"
              label="Share as image"
              path={sharePath(
                category,
                top.map((item) => item.id)
              )}
              text={`My top 5 ${category.many}. What's yours? fryranker.com`}
            />
          )}
        </div>
        <button type="button" className="start-over" onClick={onReset}>
          Start my rankings over
        </button>
      </div>
    </div>
  )
}
