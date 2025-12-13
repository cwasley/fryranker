import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FryRanker - The Definitive Spud Standings'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const fontData = await fetch(
    new URL('./Heavitas.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

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
        fontFamily: 'Heavitas',
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
      fonts: [
        {
          name: 'Heavitas',
          data: fontData,
          style: 'normal',
          weight: 800,
        },
      ],
    }
  )
}
