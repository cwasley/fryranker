import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SauceRanker | The Definitive Sauce Standings',
  description: 'Rank your favorite fast food sauces through head-to-head matchups. Discover your personal sauce preferences with SauceRanker.',
  openGraph: {
    title: 'SauceRanker | The Definitive Sauce Standings',
    description: 'Rank your favorite fast food sauces through head-to-head matchups. Which sauces reign supreme?',
    type: 'website',
    locale: 'en_US',
    siteName: 'FryRanker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SauceRanker | The Definitive Sauce Standings',
    description: 'Rank your favorite fast food sauces through head-to-head matchups.',
  },
}

export default function SaucesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

