import { expected } from './elo'

/** Below this many direct votes, a pair's split comes from the overall rankings instead. */
export const DIRECT_VOTES = 10

export type Split = {
  /** Share of the crowd that sides with the pick, 0–100. */
  pct: number
  /** True when `pct` comes from votes on this exact pair. */
  direct: boolean
  votes: number
}

export function split(pickScore: number, otherScore: number, wins: number, losses: number): Split {
  const votes = wins + losses
  if (votes >= DIRECT_VOTES) return { pct: Math.round((wins / votes) * 100), direct: true, votes }
  return { pct: Math.round(expected(pickScore, otherScore) * 100), direct: false, votes }
}

export const isHotTake = (s: Split) => s.pct < 50

export function badge(s: Split) {
  if (isHotTake(s)) return `Hot take · ${s.pct}%`
  return s.direct ? `${s.pct}% agree` : 'Crowd pick'
}

export function verdict(s: Split, pick: string) {
  if (s.direct) {
    return isHotTake(s)
      ? `Bold. Only ${s.pct}% of voters take ${pick} here.`
      : `You and ${s.pct}% of voters.`
  }
  return isHotTake(s)
    ? `Bold. ${pick} only wins this ${s.pct}% of the time.`
    : `The rankings back you. ${pick} wins this ${s.pct}% of the time.`
}

/** Where a split comes from, for the line under a matchup's bar. */
export function source(s: Split, totalVotes: number) {
  return s.direct
    ? `From ${s.votes.toLocaleString('en-US')} votes on this exact matchup.`
    : `Based on all ${totalVotes.toLocaleString('en-US')} votes so far. Direct votes take over once this pair has ${DIRECT_VOTES}.`
}
