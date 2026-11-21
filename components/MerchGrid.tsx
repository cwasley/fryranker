'use client'

import { useEffect, useState } from 'react'
import { categories } from '@/lib/categories'
import { SHOW_COUNT_FROM, type Design } from '@/lib/merch'
import { rankedTaste, useTaste } from '@/lib/taste'

type Props = { designs: Design[]; counts: Record<string, number> }

const WANTED_KEY = 'fryranker_merch_wanted'

const SAMPLE_TOP = ["McDonald's", 'Five Guys', 'Chick-fil-A', 'Josephine', 'In-N-Out']
const SAMPLE_PROFILE = ['Crunch-chaser', 'Clean + classic']

const TEE =
  'M96 22 L58 34 L8 84 L44 124 L70 104 L70 304 L230 304 L230 104 L256 124 L292 84 L242 34 L204 22 C194 46 172 58 150 58 C128 58 106 46 96 22 Z'
const HOODIE =
  'M98 30 C104 6 196 6 202 30 L246 42 L292 96 L258 132 L232 112 L232 306 L68 306 L68 112 L42 132 L8 96 L54 42 Z'

function Garment({ design }: { design: Design }) {
  if (design.product === 'Sticker pack') {
    return (
      <svg viewBox="0 0 300 320" aria-hidden>
        <rect
          x="30"
          y="20"
          width="240"
          height="280"
          rx="18"
          fill="#fffdf7"
          stroke="#22140c"
          strokeWidth="5"
        />
        {[
          [90, 80, '#ffbf1f'],
          [210, 80, '#d62718'],
          [90, 245, '#d62718'],
          [210, 245, '#ffbf1f'],
        ].map(([cx, cy, fill]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="34"
            fill={fill as string}
            stroke="#22140c"
            strokeWidth="4"
          />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 300 320" aria-hidden>
      <path
        d={design.product === 'Hoodie' ? HOODIE : TEE}
        fill={design.color}
        stroke="#22140c"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {design.product === 'Hoodie' && (
        <path
          d="M110 230 L190 230 L200 280 L100 280 Z"
          fill="none"
          stroke="#22140c"
          strokeWidth="3"
          opacity="0.5"
        />
      )}
    </svg>
  )
}

function Print({ design, top, profile }: { design: Design; top: string[]; profile: string[] }) {
  const style = { color: design.ink } as React.CSSProperties
  if (design.print.kind === 'text') {
    const { lines, accent } = design.print
    return (
      <div className="print text cond" style={style}>
        {lines.map((line, i) => (
          <span key={line} style={accent && i === 1 ? { color: accent } : undefined}>
            {line}
          </span>
        ))}
      </div>
    )
  }
  if (design.print.kind === 'profile') {
    return (
      <div className="print profile" style={style}>
        <small>Your order</small>
        {profile.map((value) => (
          <b key={value} className="cond">
            {value}
          </b>
        ))}
      </div>
    )
  }
  return (
    <div className="print receipt" style={style}>
      <b className="cond">My fry order</b>
      <ol>
        {top.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
      <i aria-hidden />
    </div>
  )
}

export default function MerchGrid({ designs, counts: initial }: Props) {
  const fries = categories.fries
  const { taste } = useTaste(fries)
  const [wanted, setWanted] = useState<Set<string>>(new Set())
  const [counts, setCounts] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWanted(new Set(JSON.parse(localStorage.getItem(WANTED_KEY) ?? '[]') as string[]))
    } catch {
      // Storage blocked: every design starts untapped.
    }
  }, [])

  const mine = rankedTaste(taste)
    .filter((entry) => entry.comps > 0)
    .flatMap((entry) => fries.items.find((item) => item.id === entry.id) ?? [])
    .slice(0, 5)
  const personal = mine.length === 5
  const top = personal ? mine.map((item) => item.name) : SAMPLE_TOP
  const profile = personal
    ? fries
        .insights(mine)
        .slice(0, 2)
        .map((insight) => insight.value)
    : SAMPLE_PROFILE

  const want = async (design: Design) => {
    if (wanted.has(design.id) || busy) return
    setBusy(design.id)
    const res = await fetch('/api/merch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ design: design.id }),
    }).catch(() => null)
    setBusy(null)
    if (!res?.ok) return
    const { count } = (await res.json()) as { count: number }
    const next = new Set([...wanted, design.id])
    setWanted(next)
    setCounts((c) => ({ ...c, [design.id]: count }))
    try {
      localStorage.setItem(WANTED_KEY, JSON.stringify([...next]))
    } catch {
      // Remember for this visit only.
    }
  }

  return (
    <div className="merch-grid">
      {designs.map((design) => {
        const count = counts[design.id] ?? 0
        const isWanted = wanted.has(design.id)
        const personalDesign = design.print.kind !== 'text'
        return (
          <article key={design.id} className="merch-card">
            <div className="mockup">
              <Garment design={design} />
              <Print design={design} top={top} profile={profile} />
            </div>
            <div className="merch-info">
              <span className="merch-product">{design.product}</span>
              <h2 className="cond">{design.name}</h2>
              <p>{design.blurb}</p>
              {personalDesign && (
                <p className="merch-sample">
                  {personal
                    ? 'Showing your own picks.'
                    : 'Sample shown. Play a round and yours fills in.'}
                </p>
              )}
              {design.buyUrl ? (
                <a className="btn primary" href={design.buyUrl} target="_blank" rel="noopener">
                  Buy
                </a>
              ) : (
                <button
                  type="button"
                  className={`btn${isWanted ? '' : ' primary'}`}
                  onClick={() => want(design)}
                  disabled={isWanted || busy === design.id}
                  aria-pressed={isWanted}
                >
                  {isWanted ? 'You want this' : busy === design.id ? 'Counting…' : 'Want this'}
                </button>
              )}
              {count >= SHOW_COUNT_FROM && (
                <small className="merch-count">
                  {count.toLocaleString('en-US')} people want this
                </small>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
