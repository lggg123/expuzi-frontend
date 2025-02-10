import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
}

export async function rateLimit(
  request: Request,
  config: RateLimitConfig = { limit: 10, window: 60 }
) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const key = `rate-limit:${ip}`;

  const [response] = await redis.pipeline()
    .incr(key)
    .expire(key, config.window)
    .exec();

  const currentCount = response as number;

  if (currentCount > config.limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return null;
} 