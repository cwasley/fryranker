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
  
  // Try to load font - if it fails, we'll use system font
  try {
    // Use production domain from NEXT_PUBLIC_BASE_URL
    // Set NEXT_PUBLIC_BASE_URL=https://fryranker.com in Vercel env vars
    // Don't use VERCEL_URL as it's a preview URL that requires auth
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    
    // Try fetching from public directory if we have a base URL
    if (baseUrl) {
      const fontUrl = `${baseUrl}/Heavitas.ttf`
      const response = await fetch(fontUrl, { 
        cache: 'no-store',
        headers: { 'Accept': 'application/font-ttf' }
      })
      if (response.ok) {
        fontData = await response.arrayBuffer()
      }
    }
    
    // Fallback to local file (development or if production URL fetch failed)
    if (!fontData) {
      fontData = await fetch(
        new URL('./Heavitas.ttf', import.meta.url)
      ).then((res) => res.arrayBuffer())
    }
  } catch (error) {
    // Font will fall back to system font - this is fine
    console.error('Font loading failed, using system font:', error)
  }

  try {
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
  } catch (error) {
    console.error('ImageResponse error:', error)
    // Return a simple fallback image
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
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
      { ...size }
    )
  }
}
