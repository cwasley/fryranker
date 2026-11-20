import { getCategory } from '@/lib/categories'
import { storyTopCard } from '@/lib/og-cards'
import { parseShare } from '@/lib/share'

/**
 * `GET /top/fries/<ids>/story`: the share link's top 5 as a 1080×1920 PNG for stories.
 * Same ids as the share page, so nothing about the visitor reaches the server beyond the link.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; ids: string }> }
) {
  const { category: key, ids } = await params
  const category = getCategory(key)
  const picks = category && parseShare(category, ids)
  if (!category || !picks) return new Response('Not found', { status: 404 })
  const image = await storyTopCard(category, picks)
  image.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  return image
}
