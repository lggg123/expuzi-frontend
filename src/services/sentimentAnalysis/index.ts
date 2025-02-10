import { coinGeckoService } from '../api/coingecko';
import { APIError } from '@/lib/errors';
import { AtomaSDK } from 'atoma-sdk';
import { Redis } from '@upstash/redis';
import type { SentimentAnalysisResponse } from '@/types/api';

const atoma = new AtomaSDK({
  bearerAuth: process.env.ATOMASDK_BEARER_AUTH ?? "",
});

// Redis client configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL ?? '',
  token: process.env.UPSTASH_REDIS_TOKEN ?? '',
  automaticDeserialization: true, // Automatically handles JSON serialization
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(retryCount * 50, 1000)
  }
});

// Enhanced cache configuration
const CACHE_CONFIG = {
  TTL: 60 * 15, // 15 minutes in seconds
  KEY_PREFIX: 'sentiment:',
  STATS_PREFIX: 'stats:sentiment:',
  POPULAR_TOKENS: ['BTC', 'ETH', 'SUI', 'SOL', 'USDT'],
  PRICE_CHANGE_THRESHOLD: 0.05,
  MAX_BATCH_SIZE: 10
} as const;

interface CacheStats {
  hits: number;
  misses: number;
  invalidations: number;
  lastUpdated: string;
}

class SentimentCache {
  constructor(
    private redis: Redis,
    private ttl: number = CACHE_CONFIG.TTL
  ) {
    // Validate Redis connection on instantiation
    this.validateConnection();
  }

  private async validateConnection() {
    try {
      await this.redis.ping();
      console.log('Redis connection established successfully');
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw new Error('Failed to connect to Redis');
    }
  }

  // Add error handling wrapper
  private async executeRedisOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Redis operation failed: ${errorMessage}`, error);
      throw new SentimentAnalysisError(
        `Cache operation failed: ${errorMessage}`,
        503
      );
    }
  }

  private getKey(tokenSymbol: string): string {
    return `${CACHE_CONFIG.KEY_PREFIX}${tokenSymbol.toLowerCase()}`;
  }

  private getStatsKey(tokenSymbol: string): string {
    return `${CACHE_CONFIG.STATS_PREFIX}${tokenSymbol.toLowerCase()}`;
  }

  async get(tokenSymbol: string): Promise<SentimentAnalysisResponse | null> {
    return this.executeRedisOperation(
      async () => {
        const result = await this.redis.get<SentimentAnalysisResponse>(
          this.getKey(tokenSymbol)
        );
        await this.updateStats(tokenSymbol, result ? 'hits' : 'misses');
        return result;
      },
      `Failed to get cache for token ${tokenSymbol}`
    );
  }

  async set(tokenSymbol: string, data: SentimentAnalysisResponse): Promise<void> {
    return this.executeRedisOperation(
      async () => {
        await this.redis.set(this.getKey(tokenSymbol), data, {
          ex: this.ttl
        });
      },
      `Failed to set cache for token ${tokenSymbol}`
    );
  }

  async invalidate(tokenSymbol: string): Promise<void> {
    await this.redis.del(this.getKey(tokenSymbol));
    await this.updateStats(tokenSymbol, 'invalidations');
  }

  private async updateStats(tokenSymbol: string, type: keyof CacheStats): Promise<void> {
    const statsKey = this.getStatsKey(tokenSymbol);
    const stats = await this.redis.get<CacheStats>(statsKey) || {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastUpdated: new Date().toISOString()
    };

    stats[type]++;
    stats.lastUpdated = new Date().toISOString();

    await this.redis.set(statsKey, stats);
  }

  async getStats(tokenSymbol: string): Promise<CacheStats | null> {
    return this.redis.get<CacheStats>(this.getStatsKey(tokenSymbol));
  }

  // Enhanced warmup with batching
  async warmup(): Promise<void> {
    console.log('Warming up sentiment cache for popular tokens...');
    const tokens = CACHE_CONFIG.POPULAR_TOKENS;
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < tokens.length; i += CACHE_CONFIG.MAX_BATCH_SIZE) {
      const batch = tokens.slice(i, i + CACHE_CONFIG.MAX_BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async token => {
          try {
            const result = await analyzeSentiment(token);
            await this.set(token, result);
            console.log(`✓ Warmed up cache for ${token}`);
          } catch (error) {
            console.error(`✗ Failed to warm up cache for ${token}:`, error);
          }
        })
      );
    }
  }
}

const cache = new SentimentCache(new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
}));

// Initialize cache warmup
if (process.env.NODE_ENV === 'production') {
  cache.warmup().catch(console.error);
}

// Custom error types for better error handling
class SentimentAnalysisError extends APIError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'SENTIMENT_ANALYSIS_ERROR');
  }
}

class InvalidResponseError extends SentimentAnalysisError {
  constructor(message: string) {
    super(message, 422);
  }
}

interface SocialData {
  twitter: {
    followers: number;
    mentions: number;
    sentiment_score: number;
  };
  reddit: {
    subscribers: number;
    active_users: number;
    sentiment_score: number;
  };
  telegram: {
    members: number;
    activity_score: number;
  };
}

export async function analyzeSentiment(tokenSymbol: string): Promise<SentimentAnalysisResponse> {
  try {
    // Validate input
    if (!tokenSymbol?.trim()) {
      throw new SentimentAnalysisError('Token symbol is required', 400);
    }

    // Check cache
    const cachedResult = await cache.get(tokenSymbol);
    if (cachedResult) {
      // Check if price has changed significantly
      const currentPrice = await coinGeckoService.getTokenPrice(tokenSymbol);
      const cachedPrice = cachedResult.metrics?.price;
      
      if (cachedPrice && currentPrice) {
        const priceChange = Math.abs((currentPrice - cachedPrice) / cachedPrice);
        if (priceChange > CACHE_CONFIG.PRICE_CHANGE_THRESHOLD) {
          console.log(`Invalidating cache for ${tokenSymbol} due to ${(priceChange * 100).toFixed(2)}% price change`);
          await cache.invalidate(tokenSymbol);
        } else {
          return cachedResult;
        }
      } else {
        return cachedResult;
      }
    }

    console.log(`Cache miss for token: ${tokenSymbol}`);

    // Get market and social data
    const [marketData, socialData] = await Promise.all([
      coinGeckoService.getTokenData(tokenSymbol).catch(error => {
        throw new SentimentAnalysisError(
          `Failed to fetch market data: ${error.message}`,
          error.statusCode || 500
        );
      }),
      fetchSocialData(tokenSymbol).catch(error => {
        throw new SentimentAnalysisError(
          `Failed to fetch social data: ${error.message}`,
          error.statusCode || 500
        );
      })
    ]);

    // Use Atoma's NLP capabilities to analyze token sentiment
    const completion = await atoma.confidentialChat.create({
      messages: [
        {
          role: "developer",
          content: "You are a DeFi sentiment analyzer. Analyze the following token data and provide sentiment analysis."
        },
        {
          role: "user",
          content: JSON.stringify({
            token: tokenSymbol,
            marketData,
            socialData
          })
        }
      ],
      model: "meta-llama/Llama-3.3-70B-Instruct"
    }).catch(error => {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        throw new SentimentAnalysisError('Rate limit exceeded', 429);
      }
      if (error.code === 'MODEL_UNAVAILABLE') {
        throw new SentimentAnalysisError('Sentiment analysis model temporarily unavailable', 503);
      }
      throw new SentimentAnalysisError(`Atoma API error: ${error.message}`);
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new InvalidResponseError('Invalid response from sentiment analysis');
    }

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
      validateAnalysisResponse(analysis);
    } catch (error) {
      throw new InvalidResponseError(
        `Failed to parse sentiment analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const result: SentimentAnalysisResponse = {
      sentiment: analysis.sentiment,
      score: analysis.score,
      sources: {
        twitter: analysis.platforms.twitter,
        reddit: analysis.platforms.reddit,
        telegram: analysis.platforms.telegram
      },
      metrics: {
        price: marketData?.current_price
      }
    };

    await cache.set(tokenSymbol, result);
    return result;

  } catch (error) {
    if (error instanceof SentimentAnalysisError) {
      throw error;
    }
    console.error('Unexpected error in sentiment analysis:', error);
    throw new SentimentAnalysisError(
      'An unexpected error occurred during sentiment analysis'
    );
  }
}

function validateAnalysisResponse(analysis: any) {
  const requiredFields = ['sentiment', 'score', 'platforms'];
  const requiredPlatforms = ['twitter', 'reddit', 'telegram'];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate sentiment value
  if (!['positive', 'negative', 'neutral'].includes(analysis.sentiment)) {
    throw new Error('Invalid sentiment value');
  }

  // Validate score
  if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 1) {
    throw new Error('Invalid score value');
  }

  // Validate platforms
  for (const platform of requiredPlatforms) {
    if (!(platform in analysis.platforms)) {
      throw new Error(`Missing platform data: ${platform}`);
    }
    if (typeof analysis.platforms[platform] !== 'number') {
      throw new Error(`Invalid platform score for: ${platform}`);
    }
  }
}

async function fetchSocialData(tokenSymbol: string): Promise<SocialData> {
  // This would be replaced with actual API calls to social platforms
  // For now, returning mock data
  return {
    twitter: {
      followers: 10000,
      mentions: 500,
      sentiment_score: 0.7
    },
    reddit: {
      subscribers: 5000,
      active_users: 300,
      sentiment_score: 0.6
    },
    telegram: {
      members: 3000,
      activity_score: 0.8
    }
  };
}

function calculateTwitterSentiment(data: SocialData['twitter']): number {
  // Implement Twitter sentiment calculation
  // This would include analysis of tweet content, engagement metrics, etc.
  return data.sentiment_score;
}

function calculateRedditSentiment(data: SocialData['reddit']): number {
  // Implement Reddit sentiment calculation
  // This would include analysis of posts, comments, upvotes, etc.
  return data.sentiment_score;
}

function calculateTelegramSentiment(data: SocialData['telegram']): number {
  // Implement Telegram sentiment calculation
  // This would include analysis of message frequency, member growth, etc.
  return data.activity_score;
}

function determineSentiment(score: number): 'positive' | 'negative' | 'neutral' {
  if (score >= 0.6) return 'positive';
  if (score <= 0.4) return 'negative';
  return 'neutral';
}

// Add stats endpoint
export async function getSentimentStats(tokenSymbol: string): Promise<CacheStats | null> {
  return cache.getStats(tokenSymbol);
} 