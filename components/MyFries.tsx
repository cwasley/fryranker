'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  categories,
  categoryList,
  citiesFor,
  cityPath,
  itemPath,
  localsIn,
  type Category,
} from '@/lib/categories'
import { directionsUrl, type Item } from '@/lib/items'
import { suggestSpots } from '@/lib/recommend'
import { sharePath } from '@/lib/share'
import { rankedTaste, useTaste } from '@/lib/taste'
import { list } from '@/lib/text'
import { readIds, SPOTS_EVENT, visitorKeys, writeIds } from '@/lib/visitor'
import Disc from './Disc'
import ShareButton, { ShareImageButton } from './ShareButton'

type Props = {
  /** Where the crowd ranks each item, by category: "#4", "New", "#3 in LA". */
  crowd: Record<string, Record<number, string>>
}

/** The visitor's picks for one category, best first: only items they've actually compared. */
function useMyRanking(category: Category) {
  const { taste } = useTaste(category)
  return useMemo(
    () =>
      rankedTaste(taste)
        .filter((entry) => entry.comps > 0)
        .flatMap((entry) => {
          const item = category.items.find((i) => i.id === entry.id)
          return item ? [{ item, ...entry }] : []
        }),
    [taste, category]
  )
}

export default function MyFries({ crowd }: Props) {
  const fries = categories.fries
  const mine = useMyRanking(fries)
  const sauces = useMyRanking(categories.sauces)
  const { taste: friesTaste } = useTaste(fries)
  const { taste: sauceTaste } = useTaste(categories.sauces)
  const keys = visitorKeys(fries)
  const [ready, setReady] = useState(false)
  const [been, setBeen] = useState<Set<number>>(new Set())

  useEffect(() => {
    const load = () => setBeen(readIds(keys.been) ?? new Set())
    /* eslint-disable react-hooks/set-state-in-effect */
    load()
    setReady(true)
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(SPOTS_EVENT, load)
    return () => window.removeEventListener(SPOTS_EVENT, load)
  }, [keys.been, fries.storageKey])

  // Storage is only readable after hydration; render nothing personal until then.
  if (!ready) return <div className="me placeholder" aria-hidden />

  const top = mine.slice(0, 5).map((entry) => entry.item)
  const picks = friesTaste.comparisons + sauceTaste.comparisons
  const profile = top.length >= 3 ? fries.insights(top) : []
  const city = citiesFor(fries)[0]
  const locals = city ? localsIn(fries, city.key) : []
  const tried = locals.filter((item) => been.has(item.id))
  const suggestions = suggestSpots(
    top,
    locals.filter((item) => !been.has(item.id))
  )

  const markBeen = (item: Item) => {
    const next = new Set([...been, item.id])
    const asked = readIds(keys.asked) ?? new Set<number>()
    writeIds(keys.asked, new Set([...asked, item.id]))
    writeIds(keys.been, next)
    setBeen(next)
  }

  return (
    <div className="me">
      <header className="share-hero">
        <h1 className="cond">
          My <span>fries</span>
        </h1>
        <p>Your picks, your taste and where to eat next. It all stays on this device.</p>
      </header>

      <div className="me-stats">
        <div className="price">
          <b className="cond">{mine.length + sauces.length}</b>
          <small>Things ranked</small>
        </div>
        <div className="price">
          <b className="cond">{picks}</b>
          <small>Picks made</small>
        </div>
        <div className="price">
          <b className="cond">{tried.length}</b>
          <small>{city ? `${city.short} spots had` : 'Spots had'}</small>
        </div>
      </div>

      {!mine.length ? (
        <section className="me-empty">
          <h2 className="cond">Nothing ranked yet</h2>
          <p>
            Play a round of ten picks and your ranking, taste profile and suggestions show up here.
          </p>
          <Link className="btn primary" href={fries.home}>
            Start picking
          </Link>
        </section>
      ) : (
        <>
          {profile.length > 0 && (
            <section className="me-card">
              <h2 className="cond">Your order</h2>
              <div className="me-profile">
                {profile.map((insight) => (
                  <div key={insight.label}>
                    <small>{insight.label}</small>
                    <b className="cond">{insight.value}</b>
                  </div>
                ))}
              </div>
            </section>
          )}

          {city && (
            <section className="me-card">
              <h2 className="cond">Try next in {city.short}</h2>
              {suggestions.length ? (
                <ul className="me-try">
                  {suggestions.map(({ item, reason }) => (
                    <li key={item.id}>
                      <Disc category={fries} item={item} />
                      <div>
                        <Link href={itemPath(fries, item)}>
                          <b>{item.name}</b>
                        </Link>
                        <small>
                          {item.place?.neighborhood} · {item.kind}
                        </small>
                        <p>{reason}</p>
                        <span className="me-try-acts">
                          <a href={directionsUrl(item)} target="_blank" rel="noopener">
                            Directions
                          </a>
                          <button type="button" onClick={() => markBeen(item)}>
                            I&apos;ve had it
                          </button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="me-note">
                  You&apos;ve had every spot on the {city.name} board. Suggest one we&apos;re
                  missing on the <Link href={cityPath(fries, city)}>{city.short} board</Link>.
                </p>
              )}
              <p className="me-note">
                Picked from your top fries: cut, crunch, spice and toppings.
              </p>
            </section>
          )}

          {categoryList.map((category) => {
            const ranking = category.key === 'fries' ? mine : sauces
            if (!ranking.length) return null
            return (
              <section key={category.key} className="me-card">
                <h2 className="cond">Your {category.many}, ranked</h2>
                <ol className="me-rank">
                  {ranking.map((entry, i) => (
                    <li key={entry.id}>
                      <span className="n cond">{i + 1}</span>
                      <Link href={itemPath(category, entry.item)}>{entry.item.name}</Link>
                      <small>
                        {entry.wins}–{entry.losses} · Crowd {crowd[category.key]?.[entry.id] ?? '–'}
                      </small>
                    </li>
                  ))}
                </ol>
                {category.key === 'fries' && top.length === 5 && (
                  <div className="row-actions">
                    <ShareImageButton
                      className="btn primary"
                      label="Share as image"
                      path={sharePath(
                        fries,
                        top.map((item) => item.id)
                      )}
                      text={`My top 5 ${fries.many}. What's yours? fryranker.com`}
                    />
                    <ShareButton
                      className="btn"
                      label="Share link"
                      path={sharePath(
                        fries,
                        top.map((item) => item.id)
                      )}
                      title={`My top 5 ${fries.many}`}
                      text={`My top 5 ${fries.many}: ${list(top.map((item) => item.name))}. What's yours?`}
                    />
                  </div>
                )}
              </section>
            )
          })}
        </>
      )}

      {city && tried.length > 0 && (
        <section className="me-card">
          <h2 className="cond">Spots you&apos;ve had</h2>
          <p className="me-note">{list(tried.map((item) => item.name))}.</p>
          <Link href={cityPath(fries, city)}>Edit on the {city.short} board</Link>
        </section>
      )}
    </div>
  )
}
