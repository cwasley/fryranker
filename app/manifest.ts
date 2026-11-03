import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} | The Definitive Fry Rankings`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff6e5',
    theme_color: '#d62718',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
