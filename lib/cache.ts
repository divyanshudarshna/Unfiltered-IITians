// lib/cache.ts
// ✅ PHASE 2: High-level caching utilities with type safety and smart invalidation
import { getRedisClient, getDefaultTTL, isCacheEnabled } from './redis';

/**
 * Get cached data with type safety
 * @param key Cache key
 * @returns Cached data or null if not found/cache disabled
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!isCacheEnabled()) return null;

  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const data = await redis.get<T>(key);
    
    if (data) {
      
      return data;
    } else {
      
      return null;
    }
  } catch (error) {
    console.error(`❌ Cache GET error for ${key}:`, error);
    return null; // Fail gracefully - return null to fetch from DB
  }
}

/**
 * Set cached data with optional TTL
 * @param key Cache key
 * @param data Data to cache (will be JSON serialized)
 * @param ttl Time to live in seconds (default from env or 300s)
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const redis = getRedisClient();
    if (!redis) return;

    const expiresIn = ttl || getDefaultTTL();
    await redis.set(key, JSON.stringify(data), { ex: expiresIn });
    
    
  } catch (error) {
    console.error(`❌ Cache SET error for ${key}:`, error);
    // Fail gracefully - don't throw error, just log it
  }
}

/**
 * Delete specific cache key
 * @param key Cache key to delete
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const redis = getRedisClient();
    if (!redis) return;

    await redis.del(key);
    
  } catch (error) {
    console.error(`❌ Cache DELETE error for ${key}:`, error);
  }
}

/**
 * Delete multiple cache keys matching a pattern
 * @param pattern Pattern to match (e.g., "courses:*")
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const redis = getRedisClient();
    if (!redis) return;

    // Upstash REST API doesn't support SCAN, so we need to track keys manually
    // For now, delete common patterns manually
    const keys = await getKeysByPattern(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      
    }
  } catch (error) {
    console.error(`❌ Cache PATTERN DELETE error for ${pattern}:`, error);
  }
}

/**
 * Get all keys matching a pattern
 * Note: Upstash doesn't support SCAN, so we maintain a key registry
 * @param pattern Pattern to match
 */
async function getKeysByPattern(pattern: string): Promise<string[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    // Get key registry (maintained separately)
    const registry = await redis.get<string[]>('cache:registry') || [];
    
    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    
    return registry.filter((key: string) => regex.test(key));
  } catch (error) {
    console.error('Error getting keys by pattern:', error);
    return [];
  }
}

/**
 * Register a key in the cache registry for pattern-based invalidation
 * @param key Key to register
 */
async function registerKey(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const registry = await redis.get<string[]>('cache:registry') || [];
    if (!registry.includes(key)) {
      registry.push(key);
      await redis.set('cache:registry', JSON.stringify(registry));
    }
  } catch (error) {
    console.error('Error registering cache key:', error);
  }
}

/**
 * Cache with tags for smart invalidation
 * @param key Cache key
 * @param data Data to cache
 * @param tags Tags for invalidation (e.g., ['courses', 'user:123'])
 * @param ttl TTL in seconds
 */
export async function setCachedWithTags<T>(
  key: string,
  data: T,
  tags: string[],
  ttl?: number
): Promise<void> {
  await setCached(key, data, ttl);
  await registerKey(key);
  
  // Associate key with tags
  const redis = getRedisClient();
  if (!redis) return;

  for (const tag of tags) {
    const tagKey = `tag:${tag}`;
    const taggedKeys = await redis.get<string[]>(tagKey) || [];
    
    if (!taggedKeys.includes(key)) {
      taggedKeys.push(key);
      await redis.set(tagKey, JSON.stringify(taggedKeys), { ex: 86400 }); // 24h TTL for tag registry
    }
  }
}

/**
 * Invalidate all keys with a specific tag
 * @param tag Tag to invalidate
 */
export async function invalidateTag(tag: string): Promise<void> {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    const tagKey = `tag:${tag}`;
    const keys = await redis.get<string[]>(tagKey) || [];
    
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(tagKey); // Also delete the tag registry
      
    }
  } catch (error) {
    console.error(`❌ Cache TAG INVALIDATION error for ${tag}:`, error);
  }
}

/**
 * Wrapper for get-or-set pattern with automatic caching
 * @param key Cache key
 * @param fetchFn Function to fetch data if not cached
 * @param ttl TTL in seconds
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const data = await fetchFn();

  // Cache the result
  await setCached(key, data, ttl);

  return data;
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAllCache(): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const redis = getRedisClient();
    if (!redis) return;

    // Get all keys from registry
    const registry = await redis.get<string[]>('cache:registry') || [];
    
    if (registry.length > 0) {
      await redis.del(...registry);
      await redis.del('cache:registry');
      
    }
  } catch (error) {
    console.error('❌ Cache CLEAR ALL error:', error);
  }
}

// ✅ PERFORMANCE: Pre-defined cache key generators for consistency
export const CacheKeys = {
  courses: {
    list: () => 'courses:published',
    detail: (id: string) => `course:${id}:details`,
    enrollmentStatus: (courseId: string, userId: string) => 
      `enrollment:${userId}:${courseId}`,
    batchStatus: (userId: string) => `enrollments:batch:${userId}`,
  },
  admin: {
    dashboardStats: () => 'admin:dashboard:stats',
    dailyStats: () => 'admin:daily:stats',
    transactionStats: () => 'admin:transaction:stats',
    enrollments: (page: number, filters: string) => 
      `admin:enrollments:${page}:${filters}`,
  },
  mocks: {
    list: () => 'mocks:published',
    detail: (id: string) => `mock:${id}`,
    attempts: (userId: string) => `mock:attempts:${userId}`,
  },
  sessions: {
    list: () => 'sessions:published',
    detail: (id: string) => `session:${id}`,
  },
  user: {
    profile: (userId: string) => `user:${userId}:profile`,
    courses: (userId: string) => `user:${userId}:courses`,
  }
} as const;
