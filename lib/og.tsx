import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { CSSProperties, ReactNode } from 'react'
import type { Category } from './categories'
import { glyphSvg } from './glyphs'
import type { Item } from './items'

export const OG_SIZE = { width: 1200, height: 630 }

// Light-scheme tokens from globals.css; the card renders outside the page.
export const C = {
  paper: '#fff6e5',
  ink: '#22140c',
  soft: '#6b5546',
  red: '#d62718',
  mustard: '#ffbf1f',
  receipt: '#fffdf7',
}

type Font = { name: string; data: Buffer; weight: 600 | 800 | 900; style: 'normal' }

let fonts: Promise<Font[]> | undefined

// Static TTFs ship in the repo: Satori can't read the woff2 that next/font serves,
// and fetching fonts at render time would make every card depend on the network.
function loadFonts() {
  const file = (name: string) => readFile(join(process.cwd(), 'assets/fonts', name))
  fonts ??= Promise.all([
    file('Archivo-ExtraCondensedBlack.ttf'),
    file('Archivo-SemiBold.ttf'),
    file('Archivo-ExtraBold.ttf'),
  ]).then(([cond, semi, bold]) => [
    { name: 'Cond', data: cond, weight: 900, style: 'normal' },
    { name: 'Archivo', data: semi, weight: 600, style: 'normal' },
    { name: 'Archivo', data: bold, weight: 800, style: 'normal' },
  ])
  return fonts
}

const flex = (style: CSSProperties = {}): CSSProperties => ({ display: 'flex', ...style })

export const cond = (size: number, style: CSSProperties = {}): CSSProperties => ({
  display: 'flex',
  fontFamily: 'Cond',
  fontWeight: 900,
  fontSize: size,
  lineHeight: 0.9,
  textTransform: 'uppercase',
  ...style,
})

function Checker() {
  const row = (offset: number) => (
    <div style={flex()}>
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          style={{ width: 30, height: 15, background: (i + offset) % 2 ? C.paper : C.red }}
        />
      ))}
    </div>
  )
  return (
    <div style={flex({ flexDirection: 'column' })}>
      {row(0)}
      {row(1)}
    </div>
  )
}

export function Logo({ size = 46 }: { size?: number }) {
  return (
    <div
      style={cond(size, {
        background: C.red,
        color: C.paper,
        padding: '8px 14px 4px',
        border: `4px solid ${C.ink}`,
        boxShadow: `6px 6px 0 ${C.ink}`,
        transform: 'rotate(-2deg)',
      })}
    >
      Fry<span style={{ color: C.mustard }}>Ranker</span>
    </div>
  )
}

export function Disc({ category, item, size }: { category: Category; item: Item; size: number }) {
  const uri = `data:image/svg+xml;base64,${Buffer.from(glyphSvg(category, item)).toString('base64')}`
  return (
    <div
      style={flex({
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size,
        background: category.key === 'sauces' ? C.paper : C.mustard,
        border: `5px solid ${C.ink}`,
        boxShadow: `9px 9px 0 ${C.ink}`,
      })}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={uri} width={size * 0.68} height={size * 0.68} alt="" />
    </div>
  )
}

export const Plate = ({ children }: { children: ReactNode }) => (
  <div
    style={cond(34, {
      alignSelf: 'flex-start',
      background: C.ink,
      color: C.paper,
      padding: '8px 16px 4px',
      borderRadius: 10,
    })}
  >
    {children}
  </div>
)

export async function ogCard(body: ReactNode, url = 'fryranker.com') {
  return new ImageResponse(
    <div
      style={flex({
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        background: C.paper,
        color: C.ink,
        fontFamily: 'Archivo',
      })}
    >
      <Checker />
      <div style={flex({ flex: 1, alignItems: 'center', padding: '28px 64px 0' })}>{body}</div>
      <div
        style={flex({
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px 40px',
        })}
      >
        <Logo />
        <div style={{ fontSize: 28, fontWeight: 800, color: C.soft }}>{url}</div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await loadFonts() }
  )
}

/** The L1 sign as a square app icon: mustard "FR" on the red sign. */
export async function monogram(size: number) {
  return new ImageResponse(
    <div
      style={cond(size * 0.52, {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: size * 0.06,
        background: C.red,
        color: C.mustard,
        letterSpacing: '-0.01em',
      })}
    >
      FR
    </div>,
    { width: size, height: size, fonts: await loadFonts() }
  )
}
