import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// Cache the leaderboard for 10 seconds
// This means even with 100 users, we only hit the DB once per 10 seconds
const getCachedLeaderboard = unstable_cache(
  async () => {
    const { rows } = await sql`
      SELECT id, name, style, score, battles 
      FROM fries 
      ORDER BY score DESC
    `;
    return rows;
  },
  ['leaderboard'],
  { revalidate: 10 } // Cache for 10 seconds
);

export async function GET() {
  try {
    const fries = await getCachedLeaderboard();
    
    return NextResponse.json(
      { fries },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

