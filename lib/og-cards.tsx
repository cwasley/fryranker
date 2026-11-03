import type { Category } from './categories'
import type { Item } from './items'
import { Emoji, Kicker, ogCard, RankList, Sub, Title } from './og'
import { getMatchups, getStandings } from './standings'
import { pct, roundedCount, titleCase } from './text'
import { expected } from './elo'

export async function rankerCard(category: Category) {
  const { items, totalVotes } = await getStandings(category)
  return ogCard(
    category,
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Kicker>{roundedCount(totalVotes)} head-to-head votes</Kicker>
      <Title size={72}>Best {titleCase(category.plural)}</Title>
      <RankList rows={items.slice(0, 3).map((item) => ({ emoji: item.emoji, name: item.name }))} />
    </div>,
    'fryranker.com'
  )
}

export async function itemCard(category: Category, item: Item) {
  const { items } = await getStandings(category)
  const ranked = items.find((entry) => entry.id === item.id)!
  return ogCard(
    category,
    <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
      <Emoji size={190}>{ranked.emoji}</Emoji>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Kicker>
          #{ranked.rank} of {items.length} {category.plural}
        </Kicker>
        <Title size={ranked.fullName.length > 20 ? 64 : 80}>{ranked.fullName}</Title>
        <Sub>{ranked.kind}</Sub>
      </div>
    </div>,
    `Elo ${ranked.score}`
  )
}

export async function matchupCard(category: Category, a: Item, b: Item) {
  const [{ items }, matchups] = await Promise.all([getStandings(category), getMatchups(category)])
  const left = items.find((entry) => entry.id === a.id)!
  const right = items.find((entry) => entry.id === b.id)!
  const record = matchups.record(left.id, right.id)
  const votes = record.wins + record.losses
  const share = votes > 0 ? record.wins / votes : expected(left.score, right.score)
  const side = (item: Item, value: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 420 }}>
      <Emoji size={150}>{item.emoji}</Emoji>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Heavitas',
          fontSize: 52,
          marginTop: 18,
          textAlign: 'center',
        }}
      >
        {item.name}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          fontWeight: 800,
          color: value >= 0.5 ? '#eeb400' : '#6e6e73',
        }}
      >
        {pct(value)}
      </div>
    </div>
  )
  return ogCard(
    category,
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {side(left, share)}
      <div style={{ display: 'flex', fontFamily: 'Heavitas', fontSize: 64, color: '#e11d2e' }}>
        VS
      </div>
      {side(right, 1 - share)}
    </div>,
    votes > 0 ? `${votes.toLocaleString('en-US')} votes` : 'Predicted by Elo'
  )
}

export function topCard(category: Category, picks: Item[]) {
  return ogCard(
    category,
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Kicker>My top 5 {category.many}</Kicker>
      <RankList rows={picks.map((item) => ({ emoji: item.emoji, name: item.name }))} />
    </div>,
    "What's yours?"
  )
}
