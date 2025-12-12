import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SauceRanker - The Definitive Sauce Standings'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
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
          fontSize: 120,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <span style={{ color: '#1d1d1f' }}>Sauce</span>
        <span style={{ color: '#eeb400' }}>Ranker</span>
      </div>
      <div
        style={{
          fontSize: 36,
          color: '#86868b',
          marginTop: 20,
        }}
      >
        The Definitive Sauce Standings
      </div>
      <div
        style={{
          fontSize: 80,
          marginTop: 40,
        }}
      >
        🌶️
      </div>
    </div>,
    {
      ...size,
    }
  )
}
