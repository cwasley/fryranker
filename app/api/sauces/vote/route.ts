import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT_PER_MINUTE = 30

function getClientIp(request: NextRequest) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || null
  const xrip = request.headers.get('x-real-ip')
  if (xrip) return xrip.trim()
  return null
}

function getRateKey(request: NextRequest, scope: string) {
  const ip = getClientIp(request) || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const salt = process.env.RATE_LIMIT_SALT || process.env.POSTGRES_URL || 'fallback-salt'
  return crypto.createHash('sha256').update(`${salt}|${scope}|${ip}|${ua}`).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // --- Rate limit (per client, per minute) ---
    await sql`
      CREATE TABLE IF NOT EXISTS vote_events (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        scope TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS vote_events_key_created_at_idx ON vote_events (key, created_at DESC)`

    const limitPerMinute = Number(process.env.RATE_LIMIT_PER_MINUTE || DEFAULT_LIMIT_PER_MINUTE)
    const scope = 'sauces'
    const key = getRateKey(request, scope)

    const { rows: rlRows } = await sql`
      SELECT COUNT(*)::int AS count
      FROM vote_events
      WHERE key = ${key}
        AND scope = ${scope}
        AND created_at > NOW() - INTERVAL '1 minute'
    `
    const recentCount = rlRows[0]?.count ?? 0

    if (recentCount >= limitPerMinute) {
      return NextResponse.json(
        { error: 'Rate limited. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    await sql`INSERT INTO vote_events (key, scope) VALUES (${key}, ${scope})`

    // Occasional cleanup to prevent unbounded growth
    if (Math.random() < 0.01) {
      await sql`DELETE FROM vote_events WHERE created_at < NOW() - INTERVAL '2 days'`
    }

    const { winnerId, loserId } = await request.json()

    if (typeof winnerId !== 'number' || typeof loserId !== 'number') {
      return NextResponse.json({ error: 'Invalid winner or loser ID' }, { status: 400 })
    }

    // Get current scores
    const { rows } = await sql`
      SELECT id, score FROM sauces WHERE id IN (${winnerId}, ${loserId})
    `

    if (rows.length !== 2) {
      return NextResponse.json({ error: 'Sauces not found' }, { status: 404 })
    }

    const winner = rows.find((r) => r.id === winnerId)!
    const loser = rows.find((r) => r.id === loserId)!

    // Calculate new ELO scores
    const K = 32
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400))
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.score - loser.score) / 400))

    const newWinnerScore = Math.round(winner.score + K * (1 - expectedWinner))
    const newLoserScore = Math.round(loser.score + K * (0 - expectedLoser))

    // Update both scores in parallel
    await Promise.all([
      sql`UPDATE sauces SET score = ${newWinnerScore}, battles = battles + 1 WHERE id = ${winnerId}`,
      sql`UPDATE sauces SET score = ${newLoserScore}, battles = battles + 1 WHERE id = ${loserId}`,
    ])

    return NextResponse.json({
      success: true,
      updates: {
        winner: { id: winnerId, newScore: newWinnerScore },
        loser: { id: loserId, newScore: newLoserScore },
      },
    })
  } catch (error) {
    console.error('Error recording sauce vote:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}
