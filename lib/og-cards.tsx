import type { Category } from './categories'
import { isLocal, type Item } from './items'
import { C, cond, Disc, ogCard, Plate } from './og'
import { split } from './reveal'
import { getCity, type City } from './cities'
import { getMatchups, getStandings, scopeOf } from './standings'
import { roundedCount, titleCase } from './text'

/** The national board's card, or with `city`, the city board's: its top local spots. */
export async function rankerCard(category: Category, city?: City) {
  const { items, totalVotes } = await getStandings(category, city?.key)
  const top = (city ? items.filter(isLocal) : items).slice(0, 3)
  const longest = Math.max(...top.map((item) => item.name.length))
  const size = longest > 14 ? 40 : longest > 10 ? 48 : 56
  return ogCard(
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 470, gap: 18 }}>
        <Plate>
          {city
            ? `${items.filter(isLocal).length} local spots`
            : `${roundedCount(totalVotes)} votes`}
        </Plate>
        <div style={cond(100)}>
          {city
            ? `Best ${titleCase(category.many)} in ${city.short}`
            : `Best ${titleCase(category.plural)}`}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: 12,
          background: C.ink,
          borderRadius: 26,
          padding: '26px 30px',
        }}
      >
        {top.map((item, i) => (
          <div
            key={item.id}
            style={cond(size, { color: '#ffe9b8', alignItems: 'center', gap: 14 })}
          >
            <div style={{ display: 'flex', color: C.mustard, width: 34 }}>{i + 1}</div>
            <div style={{ display: 'flex', flex: 1 }}>{item.name}</div>
            <div style={{ display: 'flex', color: C.paper, paddingLeft: 12 }}>{item.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function itemCard(category: Category, item: Item) {
  const { items } = await getStandings(category, scopeOf(item))
  const ranked = items.find((entry) => entry.id === item.id)!
  const size = ranked.fullName.length > 18 ? 92 : 116
  return ogCard(
    <div style={{ display: 'flex', alignItems: 'center', gap: 52, width: '100%' }}>
      <Disc category={category} item={ranked} size={270} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
        <Plate>
          #{ranked.rank} of {items.length}{' '}
          {item.city ? `${category.many} in ${getCity(item.city)?.short}` : category.plural}
        </Plate>
        <div style={cond(size)}>{ranked.fullName}</div>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: C.soft }}>
          {ranked.kind} · {ranked.score} pts
        </div>
      </div>
    </div>
  )
}

export async function matchupCard(category: Category, a: Item, b: Item) {
  const [{ items }, matchups] = await Promise.all([
    getStandings(category, scopeOf(a, b)),
    getMatchups(category),
  ])
  const left = items.find((entry) => entry.id === a.id)!
  const right = items.find((entry) => entry.id === b.id)!
  const { wins, losses } = matchups.record(left.id, right.id)
  const s = split(left.score, right.score, wins, losses)
  const side = (item: Item, pct: number) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        width: 430,
      }}
    >
      <Disc category={category} item={item} size={210} />
      <div style={cond(item.name.length > 12 ? 58 : 74, { textAlign: 'center' })}>{item.name}</div>
      <div style={cond(56, { color: pct >= 50 ? C.red : C.soft })}>{pct}%</div>
    </div>
  )
  return ogCard(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {side(left, s.pct)}
      <div
        style={cond(56, {
          width: 120,
          height: 120,
          borderRadius: 120,
          alignItems: 'center',
          justifyContent: 'center',
          background: C.red,
          color: C.paper,
          border: `5px solid ${C.ink}`,
          transform: 'rotate(-8deg)',
        })}
      >
        or
      </div>
      {side(right, 100 - s.pct)}
    </div>
  )
}

export function topCard(category: Category, picks: Item[]) {
  return ogCard(
    <div style={{ display: 'flex', alignItems: 'center', gap: 56, width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 500,
          background: C.receipt,
          border: `4px solid ${C.ink}`,
          boxShadow: `10px 10px 0 ${C.ink}`,
          padding: '26px 30px',
          transform: 'rotate(-2deg)',
        }}
      >
        <div style={cond(46, { justifyContent: 'center' })}>My top 5 {category.many}</div>
        <div style={{ display: 'flex', borderTop: `3px dashed ${C.ink}`, margin: '6px 0' }} />
        {picks.map((item, i) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 46,
                height: 46,
                borderRadius: 46,
                background: C.red,
                color: C.paper,
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}
            >
              {i + 1}
            </div>
            {item.name}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div style={cond(104)}>What&apos;s yours?</div>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: C.soft }}>
          Pick between two {category.many} at a time.
        </div>
      </div>
    </div>
  )
}
