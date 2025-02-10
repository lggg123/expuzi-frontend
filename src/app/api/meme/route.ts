import { NextResponse } from 'next/server';
import { generateMeme } from '@/services/memeGeneration';
import type { MemeGenerationRequest } from '@/types/api';

export async function POST(request: Request) {
  try {
    const body: MemeGenerationRequest = await request.json();

    if (!body.tokenSymbol) {
      return NextResponse.json(
        { error: 'Token symbol is required' },
        { status: 400 }
      );
    }

    const result = await generateMeme(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meme' },
      { status: 500 }
    );
  }
} 