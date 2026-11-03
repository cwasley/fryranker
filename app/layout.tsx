import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import JsonLd from '@/components/JsonLd'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import { site } from '@/lib/site'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
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
    { media: '(prefers-color-scheme: light)', color: '#fff6e5' },
    { media: '(prefers-color-scheme: dark)', color: '#1a120c' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
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
