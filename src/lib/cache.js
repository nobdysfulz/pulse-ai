/**
 * Client-Side Caching Utility
 * 
 * Provides localStorage-based caching with TTL (time-to-live) support
 * for reducing redundant backend requests and improving performance.
 */

const CACHE_PREFIX = 'pulse_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Set a cached value with expiration
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setCacheItem = (key, value, ttl = DEFAULT_TTL) => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.warn('Failed to set cache item:', error);
  }
};

/**
 * Get a cached value if it exists and hasn't expired
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if expired/not found
 */
export const getCacheItem = (key) => {
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.warn('Failed to get cache item:', error);
    return null;
  }
};

/**
 * Remove a specific cache item
 * @param {string} key - Cache key
 */
export const removeCacheItem = (key) => {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.warn('Failed to remove cache item:', error);
  }
};

/**
 * Clear all cache items with the PULSE prefix
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Cache keys for common data
 */
export const CACHE_KEYS = {
  PROMPT_CONFIGS: 'prompt_configs',
  BRAND_PALETTES: 'brand_palettes',
  MARKET_INTELLIGENCE: 'market_intelligence',
  USER_PREFERENCES: 'user_preferences',
};

/**
 * In-memory cache for the current session (faster than localStorage)
 */
const memoryCache = new Map();

/**
 * Set an in-memory cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setMemoryCacheItem = (key, value, ttl = DEFAULT_TTL) => {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttl,
  });
};

/**
 * Get an in-memory cached value
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if expired/not found
 */
export const getMemoryCacheItem = (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
};

/**
 * Clear all in-memory cache
 */
export const clearMemoryCache = () => {
  memoryCache.clear();
};
