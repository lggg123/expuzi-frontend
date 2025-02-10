import { AtomaSDK } from 'atoma-sdk';
import { APIError } from '@/lib/errors';
import { Redis } from '@upstash/redis';
import type { MemeGenerationRequest, MemeGenerationResponse } from '@/types/api';

const atoma = new AtomaSDK({
  bearerAuth: process.env.ATOMASDK_BEARER_AUTH ?? "",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL ?? '',
  token: process.env.UPSTASH_REDIS_TOKEN ?? '',
});

const CACHE_CONFIG = {
  TTL: 60 * 60 * 24, // 24 hours for memes
  KEY_PREFIX: 'meme:',
  POPULAR_PAIRS: [
    { token: 'BTC', sentiment: 'positive' },
    { token: 'ETH', sentiment: 'positive' },
    { token: 'SUI', sentiment: 'positive' },
    // Add negative sentiment for market swings
    { token: 'BTC', sentiment: 'negative' },
    { token: 'ETH', sentiment: 'negative' }
  ]
} as const;

class MemeGenerationError extends APIError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'MEME_GENERATION_ERROR');
  }
}

async function getCachedMeme(tokenSymbol: string, sentiment: string): Promise<MemeGenerationResponse | null> {
  const key = `${CACHE_CONFIG.KEY_PREFIX}${tokenSymbol.toLowerCase()}:${sentiment}`;
  return redis.get<MemeGenerationResponse>(key);
}

async function cacheMeme(tokenSymbol: string, sentiment: string, meme: MemeGenerationResponse): Promise<void> {
  const key = `${CACHE_CONFIG.KEY_PREFIX}${tokenSymbol.toLowerCase()}:${sentiment}`;
  await redis.set(key, meme, { ex: CACHE_CONFIG.TTL });
}

export async function generateMeme(request: MemeGenerationRequest): Promise<MemeGenerationResponse> {
  try {
    const { tokenSymbol, sentiment, theme = 'crypto' } = request;

    // Check cache first
    const cachedMeme = await getCachedMeme(tokenSymbol, sentiment);
    if (cachedMeme) {
      console.log(`Cache hit for meme: ${tokenSymbol}-${sentiment}`);
      return cachedMeme;
    }

    // Generate meme text using Atoma
    const completion = await atoma.confidentialChat.create({
      messages: [
        {
          role: "developer",
          content: `You are a crypto meme generator. Create a viral meme about ${tokenSymbol} with ${sentiment} sentiment.`
        },
        {
          role: "user",
          content: JSON.stringify({
            token: tokenSymbol,
            sentiment,
            theme,
            style: "viral, humorous, crypto-native"
          })
        }
      ],
      model: "meta-llama/Llama-3.3-70B-Instruct"
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new MemeGenerationError('Failed to generate meme text');
    }

    const memeText = JSON.parse(completion.choices[0].message.content);
    const memeUrl = `https://api.defidetector.com/memes/${tokenSymbol.toLowerCase()}-${Date.now()}.jpg`;

    const result = {
      url: memeUrl,
      text: memeText.caption,
      sentiment: sentiment
    };

    // Cache the result
    await cacheMeme(tokenSymbol, sentiment, result);
    return result;

  } catch (error) {
    if (error instanceof MemeGenerationError) {
      throw error;
    }
    console.error('Meme generation error:', error);
    throw new MemeGenerationError(
      error instanceof Error ? error.message : 'Failed to generate meme'
    );
  }
}

// Warmup cache with popular memes
export async function warmupMemeCache(): Promise<void> {
  console.log('Warming up meme cache...');
  
  for (const pair of CACHE_CONFIG.POPULAR_PAIRS) {
    try {
      const cachedMeme = await getCachedMeme(pair.token, pair.sentiment);
      if (!cachedMeme) {
        await generateMeme({
          tokenSymbol: pair.token,
          sentiment: pair.sentiment
        });
        console.log(`✓ Generated meme for ${pair.token}-${pair.sentiment}`);
      }
    } catch (error) {
      console.error(`✗ Failed to generate meme for ${pair.token}-${pair.sentiment}:`, error);
    }
  }
}

// Initialize cache warmup in production
if (process.env.NODE_ENV === 'production') {
  warmupMemeCache().catch(console.error);
} 