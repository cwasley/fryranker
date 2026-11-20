'use client'

import { useEffect, useState } from 'react'
import { categories, type Category } from '@/lib/categories'
import { dailyPair, dayBefore, dayOf, type DailyTally } from '@/lib/daily'
import type { Item } from '@/lib/items'
import Disc from './Disc'
import Name from './Name'

type Props = {
  categoryKey: Category['key']
  /** Today's and yesterday's counts as of the page render (refreshed every few minutes). */
  tallies: DailyTally[]
}

/** What the visitor did on the daily matchup, kept on the device. */
type Saved = { day: string; pick: number; streak: number; best: number }

const DAY_MS = 86_400_000

function streakLabel(n: number) {
  return n === 1 ? 'Day 1 of your streak' : `${n}-day streak`
}

export default function DailyMatchup({ categoryKey, tallies }: Props) {
  const category = categories[categoryKey]
  const key = `${category.storageKey}_daily`
  // The day depends on the visitor's clock, so it's only known after hydration.
  const [today, setToday] = useState<string | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setToday(dayOf(new Date()))
    try {
      const raw = localStorage.getItem(key)
      if (raw) setSaved(JSON.parse(raw) as Saved)
    } catch {
      // Storage blocked: no streak, the card still works.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key])

  if (!today) return <section className="daily placeholder" aria-hidden />

  const [a, b] = dailyPair(category, today)
  const yesterday = dayBefore(today)
  const tally = (day: string) => tallies.find((t) => t.day === day)
  const votedToday = saved?.day === today
  // A streak survives until a full day is missed.
  const streak = saved && (votedToday || saved.day === yesterday) ? saved.streak : 0

  const vote = async (winner: Item, loser: Item) => {
    if (votedToday || sending) return
    setSending(true)
    const res = await fetch(category.voteApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId: winner.id, loserId: loser.id }),
    }).catch(() => null)
    setSending(false)
    if (!res?.ok) return
    const nextStreak = saved?.day === yesterday ? saved.streak + 1 : 1
    const next: Saved = {
      day: today,
      pick: winner.id,
      streak: nextStreak,
      best: Math.max(saved?.best ?? 0, nextStreak),
    }
    setSaved(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Remember for this visit only.
    }
  }

  const todays = tally(today)
  // Counts from the render, plus this visitor's own vote if the page predates it.
  const counts: [number, number] = todays ? [...todays.counts] : [0, 0]
  if (votedToday && counts[0] + counts[1] === 0) counts[saved.pick === a.id ? 0 : 1] += 1
  const total = counts[0] + counts[1]
  const pctA = total ? Math.round((counts[0] / total) * 100) : 50

  const past = tally(yesterday)
  const pastTotal = past ? past.counts[0] + past.counts[1] : 0
  const pastLine = (() => {
    if (!past || pastTotal < 5) return null
    const lead = past.counts[0] >= past.counts[1] ? 0 : 1
    const winner = category.items.find((item) => item.id === past.ids[lead])
    const loser = category.items.find((item) => item.id === past.ids[1 - lead])
    if (!winner || !loser) return null
    const pct = Math.round((past.counts[lead] / pastTotal) * 100)
    return `Yesterday: ${pct}% picked ${winner.name} over ${loser.name} (${pastTotal.toLocaleString('en-US')} votes).`
  })()

  const date = new Date(`${today}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  // Hours until midnight in LA, for "next one in".
  const hoursLeft = (() => {
    const now = new Date()
    const la = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
    const midnight = new Date(la)
    midnight.setHours(24, 0, 0, 0)
    return Math.max(1, Math.ceil((midnight.getTime() - la.getTime()) / (DAY_MS / 24)))
  })()

  return (
    <section className="daily" aria-labelledby="daily-title">
      <div className="daily-head">
        <h2 id="daily-title" className="cond">
          Today&apos;s matchup
        </h2>
        <span className="daily-date">{date}</span>
        {streak > 0 && <span className="streak">{streakLabel(streak)}</span>}
      </div>

      <div className={`daily-duel${votedToday ? ' done' : ''}`}>
        {([a, b] as const).map((item, index) => {
          const other = index === 0 ? b : a
          const mine = votedToday && saved.pick === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`daily-pick${mine ? ' mine' : ''}`}
              onClick={() => vote(item, other)}
              disabled={votedToday || sending}
              aria-pressed={mine}
            >
              <Disc category={category} item={item} />
              <span className="cond">
                <Name text={item.name} />
              </span>
              {votedToday && <b>{index === 0 ? pctA : 100 - pctA}%</b>}
            </button>
          )
        })}
      </div>

      {votedToday ? (
        <>
          <div className="bar" aria-hidden>
            <b style={{ width: `${pctA}%` }} />
          </div>
          <p className="daily-note">
            {total > 1
              ? `${total.toLocaleString('en-US')} votes today so far.`
              : 'You’re one of the first today.'}{' '}
            Next matchup in {hoursLeft} {hoursLeft === 1 ? 'hour' : 'hours'}.
            {saved.best > 1 && saved.best > streak ? ` Best streak: ${saved.best} days.` : ''}
          </p>
        </>
      ) : (
        <p className="daily-note">
          One matchup a day, the same for everyone.{' '}
          {streak > 0 ? 'Vote to keep your streak going.' : 'Vote daily to build a streak.'}
        </p>
      )}
      {pastLine && <p className="daily-past">{pastLine}</p>}
    </section>
  )
}
