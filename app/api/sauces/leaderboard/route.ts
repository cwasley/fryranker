import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, name, restaurant, score, battles 
      FROM sauces 
      ORDER BY score DESC
    `;
    
    return NextResponse.json(
      { fries: rows },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching sauces leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sauces leaderboard' },
      { status: 500 }
    );
  }
}

