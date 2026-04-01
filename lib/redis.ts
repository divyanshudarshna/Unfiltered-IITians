// lib/redis.ts
// ✅ PHASE 2: Redis caching layer using Upstash (serverless-friendly)
import { Redis } from '@upstash/redis';

// Initialize Redis client (lazy initialization for serverless)
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Check if Redis is enabled via environment variable
  if (process.env.CACHE_ENABLED !== 'true') {
    console.warn('⚠️  Redis caching is disabled (CACHE_ENABLED != true)');
    return null;
  }

  // Check if Redis credentials are available
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️  Redis credentials not found. Caching disabled.');
    return null;
  }

  // Create client if not already created
  if (!redis) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

// Helper: Get default TTL from environment or use fallback
export function getDefaultTTL(): number {
  const ttl = process.env.CACHE_DEFAULT_TTL;
  return ttl ? parseInt(ttl, 10) : 300; // Default: 5 minutes
}

// Helper: Check if caching is enabled
export function isCacheEnabled(): boolean {
  return process.env.CACHE_ENABLED === 'true';
}

// Test connection (optional - for health checks)
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;

    await client.set('test:connection', 'ok', { ex: 10 });
    const result = await client.get('test:connection');
    return result === 'ok';
  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return false;
  }
}
