import type { Metadata } from 'next'
import MerchGrid from '@/components/MerchGrid'
import { designs } from '@/lib/merch'
import { getMerchInterest } from '@/lib/merch-interest'
import { social } from '@/lib/metadata'

export const revalidate = 300

const title = 'FryRanker Merch'
const description =
  'Shirts, hoodies and stickers for people with strong opinions about fries. Tap what you want and we’ll print the favorites first.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/merch' },
  ...social(`${title} | FryRanker`, description, '/merch'),
}

export default async function MerchPage() {
  const counts = await getMerchInterest()
  return (
    <main className="page">
      <header className="share-hero">
        <h1 className="cond">
          Fry <span>merch</span>
        </h1>
        <p>
          The shop isn&apos;t open yet. Vote for the ideas you&apos;d wear and we&apos;ll make the
          favorites first.
        </p>
      </header>
      <p className="merch-note">
        These are rough placeholder mockups, not the real designs. Vote on the idea; the finished
        shirts will look a lot better.
      </p>
      <MerchGrid designs={designs} counts={counts} />
      <p className="about">No brand logos, just strong opinions about potatoes.</p>
    </main>
  )
}
