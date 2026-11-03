import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { ReactNode } from 'react'
import type { Category } from './categories'

export const OG_SIZE = { width: 1200, height: 630 }

// Light-scheme tokens from globals.css; the card renders outside the page.
const C = {
  bg: '#fdfbf7',
  card: '#f5f1ea',
  ink: '#1d1d1f',
  soft: '#6e6e73',
  gold: '#eeb400',
  red: '#e11d2e',
}

type Font = { name: string; data: ArrayBuffer | Buffer; weight: 400 | 600 | 800; style: 'normal' }

let fonts: Promise<Font[]> | undefined

/**
 * Satori needs TTF, not the woff2 next/font serves. Heavitas ships in the repo;
 * Inter comes from Google Fonts, which returns TTF to a bare server fetch.
 */
function loadFonts() {
  fonts ??= (async () => {
    const heavitas = await readFile(join(process.cwd(), 'assets/Heavitas.ttf'))
    const loaded: Font[] = [{ name: 'Heavitas', data: heavitas, weight: 800, style: 'normal' }]
    for (const weight of [600, 800] as const) {
      try {
        const css = await fetch(
          `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`
        ).then((res) => res.text())
        const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
        if (url)
          loaded.push({
            name: 'Inter',
            data: await fetch(url).then((r) => r.arrayBuffer()),
            weight,
            style: 'normal',
          })
      } catch (error) {
        console.error(`Inter ${weight} unavailable for OG cards:`, error)
      }
    }
    return loaded
  })()
  return fonts
}

function Wordmark({ brand, size = 44 }: { brand: [string, string]; size?: number }) {
  return (
    <div
      style={{ display: 'flex', fontFamily: 'Heavitas', fontSize: size, letterSpacing: '-0.02em' }}
    >
      <span style={{ color: C.ink }}>{brand[0]}</span>
      <span style={{ color: C.gold }}>{brand[1]}</span>
    </div>
  )
}

export async function ogCard(category: Category, body: ReactNode, footer?: string) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 72px',
        fontFamily: 'Inter',
        color: C.ink,
        background: `radial-gradient(circle at 10% 15%, rgba(238,180,0,0.22), transparent 45%), radial-gradient(circle at 92% 90%, rgba(225,29,46,0.12), transparent 45%), ${C.bg}`,
      }}
    >
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
        {body}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark brand={category.brand} />
        {footer && <div style={{ fontSize: 28, fontWeight: 600, color: C.soft }}>{footer}</div>}
      </div>
    </div>,
    { ...OG_SIZE, fonts: await loadFonts(), emoji: 'twemoji' }
  )
}

export const Kicker = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: C.red,
    }}
  >
    {children}
  </div>
)

export const Title = ({ children, size = 84 }: { children: ReactNode; size?: number }) => (
  <div
    style={{
      display: 'flex',
      fontFamily: 'Heavitas',
      fontSize: size,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      marginTop: 12,
    }}
  >
    {children}
  </div>
)

export const Sub = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', fontSize: 36, fontWeight: 600, color: C.soft, marginTop: 18 }}>
    {children}
  </div>
)

export const Emoji = ({ children, size = 150 }: { children: string; size?: number }) => (
  <div style={{ display: 'flex', fontSize: size, lineHeight: 1 }}>{children}</div>
)

export function RankList({ rows }: { rows: { emoji: string; name: string; meta?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
      {rows.map((row, i) => (
        <div
          key={row.name}
          style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 40 }}
        >
          <div style={{ display: 'flex', width: 44, fontWeight: 800, color: C.gold }}>{i + 1}</div>
          <div style={{ display: 'flex', fontSize: 44 }}>{row.emoji}</div>
          <div style={{ display: 'flex', fontWeight: 800 }}>{row.name}</div>
          {row.meta && (
            <div style={{ display: 'flex', fontWeight: 600, color: C.soft }}>{row.meta}</div>
          )}
        </div>
      ))}
    </div>
  )
}
