/**
 * Rate Limiter Utility
 * 
 * Provides client-side rate limiting to prevent abuse and improve UX
 * by preventing excessive API calls.
 * 
 * Usage:
 *   import { RateLimiter } from '@/utils/rateLimiter'
 *   
 *   const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 })
 *   
 *   if (limiter.tryRequest('api-endpoint')) {
 *     // Make API call
 *   } else {
 *     // Show rate limit message
 *   }
 */

export class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10
    this.windowMs = options.windowMs || 60000 // 1 minute default
    this.requests = new Map()
  }

  /**
   * Try to make a request for a given key
   * @param {string} key - Identifier for the rate limit (e.g., endpoint name, user action)
   * @returns {boolean} - True if request is allowed, false if rate limited
   */
  tryRequest(key) {
    const now = Date.now()
    const requestLog = this.requests.get(key) || []
    
    // Remove old requests outside the time window
    const validRequests = requestLog.filter(timestamp => now - timestamp < this.windowMs)
    
    // Check if we're at the limit
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return true
  }

  /**
   * Get remaining requests for a key
   * @param {string} key - Identifier for the rate limit
   * @returns {number} - Number of remaining requests
   */
  getRemainingRequests(key) {
    const now = Date.now()
    const requestLog = this.requests.get(key) || []
    const validRequests = requestLog.filter(timestamp => now - timestamp < this.windowMs)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  /**
   * Get time until next request is allowed
   * @param {string} key - Identifier for the rate limit
   * @returns {number} - Milliseconds until next request, or 0 if allowed now
   */
  getTimeUntilReset(key) {
    const now = Date.now()
    const requestLog = this.requests.get(key) || []
    const validRequests = requestLog.filter(timestamp => now - timestamp < this.windowMs)
    
    if (validRequests.length < this.maxRequests) {
      return 0
    }
    
    const oldestRequest = Math.min(...validRequests)
    return Math.max(0, this.windowMs - (now - oldestRequest))
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Identifier for the rate limit
   */
  reset(key) {
    this.requests.delete(key)
  }

  /**
   * Clear all rate limits
   */
  resetAll() {
    this.requests.clear()
  }
}

// Export singleton instance with default settings
export const defaultRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000
})

// Export specialized rate limiters for common use cases
export const apiRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60000
})

export const searchRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000
})

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60000
})