import type { Metadata } from 'next'
import Link from 'next/link'
import { social } from '@/lib/metadata'
import { DIRECT_VOTES } from '@/lib/reveal'

export const metadata: Metadata = {
  title: 'How the Rankings Work',
  description:
    'FryRanker ranks fast food fries and sauces with head-to-head votes and Elo ratings, the system chess uses. Here is how a vote moves the standings.',
  alternates: { canonical: '/how-it-works' },
  ...social(
    'How the Rankings Work | FryRanker',
    'How a head-to-head vote moves the FryRanker standings.',
    '/how-it-works'
  ),
}

export default function HowItWorks() {
  return (
    <main className="page">
      <article className="prose">
        <p className="kicker">The fine print</p>
        <h1 className="cond">How the rankings work</h1>
        <p>
          Every vote is a head-to-head matchup: two fries (or two sauces), and you pick the one
          you&apos;d rather eat. There are no star ratings and no reviews, just thousands of those
          little decisions.
        </p>
        <h2 className="cond">Points</h2>
        <p>
          Each item has a points score, using the Elo rating system that chess uses to rank players.
          Everything starts at 1500. Winning a matchup takes points from the loser, and beating a
          favorite moves more points than beating an underdog. Over thousands of votes the scores
          settle into the standings you see on the menu.
        </p>
        <h2 className="cond">The percentages</h2>
        <p>
          When you pick, we show how the crowd sees that matchup. Until a pair has {DIRECT_VOTES}{' '}
          votes of its own, the number comes from the two items&apos; points: the gap between them
          says how often one beats the other. After that, it&apos;s the real split from people who
          voted on that exact pair.
        </p>
        <h2 className="cond">Your rankings</h2>
        <p>
          Your own top 5 and taste profile are worked out from your votes on your device. They
          aren&apos;t tied to an account, and nobody else can see them unless you share them.
        </p>
        <p>
          <Link className="btn primary" href="/">
            Start picking
          </Link>
        </p>
      </article>
    </main>
  )
}
