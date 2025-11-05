/**
 * Batch Operations Utility
 * 
 * Provides utilities for batching multiple operations into single backend calls
 * to reduce network overhead and improve performance.
 */

import { Goal } from '@/api/entities';
import { toast } from 'sonner';

/**
 * Batch update multiple goals at once
 * @param {Array<{id: string, data: object}>} updates - Array of goal updates
 * @returns {Promise<{success: boolean, updated: number, errors: Array}>}
 */
export const batchUpdateGoals = async (updates) => {
  const results = {
    success: true,
    updated: 0,
    errors: [],
  };

  // Process updates in parallel with error handling
  const promises = updates.map(async (update) => {
    try {
      await Goal.update(update.id, update.data);
      results.updated++;
    } catch (error) {
      console.error(`Failed to update goal ${update.id}:`, error);
      results.errors.push({ id: update.id, error: error.message });
      results.success = false;
    }
  });

  await Promise.allSettled(promises);

  return results;
};

/**
 * Debounce utility for delaying function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle utility for limiting function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 1000) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Batch multiple refresh calls into a single refresh
 * Uses debouncing to wait for multiple rapid calls to settle
 */
export class RefreshBatcher {
  constructor(refreshFunction, debounceTime = 500) {
    this.refreshFunction = refreshFunction;
    this.debounceTime = debounceTime;
    this.timeout = null;
    this.pendingCount = 0;
  }

  /**
   * Request a refresh (will be batched with other requests)
   */
  requestRefresh() {
    this.pendingCount++;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      console.log(`[RefreshBatcher] Executing batched refresh (${this.pendingCount} requests)`);
      this.pendingCount = 0;
      this.refreshFunction();
    }, this.debounceTime);
  }

  /**
   * Force immediate refresh and clear pending
   */
  forceRefresh() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.pendingCount = 0;
    this.refreshFunction();
  }
}
