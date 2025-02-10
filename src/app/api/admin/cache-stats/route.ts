import { NextResponse } from 'next/server';
import { getSentimentStats } from '@/services/sentimentAnalysis';
import { isAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Basic admin check
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const stats = await getSentimentStats(token);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to fetch cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
} 