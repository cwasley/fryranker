export const START_SCORE = 1500

/** Chance that a player rated `a` beats one rated `b`. */
export const expected = (a: number, b: number) => 1 / (1 + 10 ** ((b - a) / 400))

/** Points the winner gains and the loser gives up. */
export const eloDelta = (winner: number, loser: number, k: number) =>
  Math.round(k * (1 - expected(winner, loser)))

export const GLOBAL_K = 32
export const TASTE_K = 28
