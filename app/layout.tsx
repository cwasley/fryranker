import type { Metadata } from 'next'
import { Analytics } from './components/Analytics'

function getMetadataBase() {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL
  if (explicit) return new URL(explicit)

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return new URL(`https://${vercelUrl}`)

  return new URL('http://localhost:3000')
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'FryRanker | The Definitive Spud Standings',
  description:
    'Rank your favorite fast food fries through head-to-head matchups. Discover your personal fry preferences with FryRanker.',
  openGraph: {
    title: 'FryRanker | The Definitive Spud Standings',
    description:
      'Rank your favorite fast food fries through head-to-head matchups. Which fries reign supreme?',
    type: 'website',
    locale: 'en_US',
    siteName: 'FryRanker',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FryRanker - The Definitive Spud Standings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FryRanker | The Definitive Spud Standings',
    description: 'Rank your favorite fast food fries through head-to-head matchups.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  )
}
