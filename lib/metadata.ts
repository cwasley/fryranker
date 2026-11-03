import type { Metadata } from 'next'
import { site } from './site'

/**
 * A page's own `openGraph` and `twitter` replace the layout's rather than merging
 * with them, so every page builds both from here to keep the large preview card.
 */
export function social(title: string, description: string, path?: string): Metadata {
  return {
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: site.name,
      title,
      description,
      ...(path && { url: path }),
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}
