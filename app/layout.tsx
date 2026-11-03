import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import CategoryNav from '@/components/CategoryNav'
import JsonLd from '@/components/JsonLd'
import { site } from '@/lib/site'
import './globals.css'

const heavitas = localFont({
  src: '../assets/Heavitas.ttf',
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | The Definitive Fry Rankings`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { title: site.name, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfbf7' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heavitas.variable} ${inter.variable}`}>
      <body>
        <CategoryNav />
        {children}
        <footer className="footer">
          <p>{site.credit}</p>
        </footer>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.name,
            url: site.url,
            description: site.description,
          }}
        />
        {/* Both are cookieless, so no consent banner is required. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
