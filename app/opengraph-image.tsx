import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FryRanker - The Definitive Fry Rankings'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  let fontData: ArrayBuffer | undefined
  try {
    // Try to load from public directory first (for production)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const fontUrl = `${baseUrl}/Heavitas.ttf`
    fontData = await fetch(fontUrl).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch font')
      return res.arrayBuffer()
    })
  } catch (error) {
    // Fallback to local file (for development)
    try {
      fontData = await fetch(
        new URL('./Heavitas.ttf', import.meta.url)
      ).then((res) => res.arrayBuffer())
    } catch (localError) {
      console.error('Failed to load font:', localError)
    }
  }

  return new ImageResponse(
    <div
      style={{
        background: '#fdfbf7',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontData ? 'Heavitas' : 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 180,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          letterSpacing: '-0.04em',
        }}
      >
        <span style={{ color: '#1d1d1f' }}>Fry</span>
        <span style={{ color: '#eeb400' }}>Ranker</span>
      </div>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Heavitas',
              data: fontData,
              style: 'normal',
              weight: 800,
            },
          ]
        : [],
    }
  )
}
