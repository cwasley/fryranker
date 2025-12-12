import type { Metadata } from 'next'

function getMetadataBase() {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return new URL(explicit)

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return new URL(`https://${vercelUrl}`)

  return new URL('http://localhost:3000')
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'SauceRanker | The Definitive Sauce Standings',
  description:
    'Rank your favorite fast food sauces through head-to-head matchups. Discover your personal sauce preferences with SauceRanker.',
  openGraph: {
    title: 'SauceRanker | The Definitive Sauce Standings',
    description:
      'Rank your favorite fast food sauces through head-to-head matchups. Which sauces reign supreme?',
    type: 'website',
    locale: 'en_US',
    siteName: 'FryRanker',
    images: [
      {
        url: '/sauces/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'SauceRanker - The Definitive Sauce Standings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SauceRanker | The Definitive Sauce Standings',
    description: 'Rank your favorite fast food sauces through head-to-head matchups.',
    images: ['/sauces/opengraph-image'],
  },
}

export default function SaucesLayout({ children }: { children: React.ReactNode }) {
  return children
}
