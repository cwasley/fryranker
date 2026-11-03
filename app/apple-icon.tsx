import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const heavitas = await readFile(join(process.cwd(), 'assets/Heavitas.ttf'))
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1d1d1f',
        color: '#eeb400',
        fontFamily: 'Heavitas',
        fontSize: 84,
        letterSpacing: '-0.02em',
      }}
    >
      FR
    </div>,
    { ...size, fonts: [{ name: 'Heavitas', data: heavitas, weight: 800, style: 'normal' }] }
  )
}
