import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { winnerId, loserId } = await request.json();

    if (typeof winnerId !== 'number' || typeof loserId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid winner or loser ID' },
        { status: 400 }
      );
    }

    // Get current scores and update in a single transaction-like flow
    const { rows } = await sql`
      SELECT id, score FROM fries WHERE id IN (${winnerId}, ${loserId})
    `;

    if (rows.length !== 2) {
      return NextResponse.json(
        { error: 'Fries not found' },
        { status: 404 }
      );
    }

    const winner = rows.find(r => r.id === winnerId)!;
    const loser = rows.find(r => r.id === loserId)!;

    // Calculate new ELO scores
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.score - loser.score) / 400));

    const newWinnerScore = Math.round(winner.score + K * (1 - expectedWinner));
    const newLoserScore = Math.round(loser.score + K * (0 - expectedLoser));

    // Update both scores in parallel
    await Promise.all([
      sql`UPDATE fries SET score = ${newWinnerScore}, battles = battles + 1 WHERE id = ${winnerId}`,
      sql`UPDATE fries SET score = ${newLoserScore}, battles = battles + 1 WHERE id = ${loserId}`
    ]);

    // Invalidate the leaderboard cache so next fetch gets fresh data
    revalidateTag('leaderboard');

    // Return just the updates - frontend will fetch fresh leaderboard
    return NextResponse.json({ 
      success: true,
      updates: {
        winner: { id: winnerId, newScore: newWinnerScore },
        loser: { id: loserId, newScore: newLoserScore }
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

