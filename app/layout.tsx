import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FryRanker | The Definitive Spud Standings',
  description: 'Rank your favorite fast food fries through head-to-head matchups. Discover your personal fry preferences with FryRanker.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}

