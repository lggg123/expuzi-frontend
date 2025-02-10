import { NextResponse } from 'next/server';
import { analyzeSentiment } from '@/services/sentimentAnalysis';
import type { SentimentAnalysisRequest } from '@/types/api';

export async function POST(request: Request) {
  try {
    const body: SentimentAnalysisRequest = await request.json();

    if (!body.tokenSymbol) {
      return NextResponse.json(
        { error: 'Token symbol is required' },
        { status: 400 }
      );
    }

    const result = await analyzeSentiment(body.tokenSymbol);
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
} 