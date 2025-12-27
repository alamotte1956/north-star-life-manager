/**
 * Application Logger Utility
 * 
 * Provides controlled logging that can be disabled in production
 * while maintaining debug capabilities during development.
 * 
 * Usage:
 *   import logger from '@/utils/logger'
 *   logger.info('User logged in', { userId: 123 })
 *   logger.error('API call failed', error)
 *   logger.debug('Debug info', data)
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

class Logger {
  constructor() {
    // Determine if we're in production
    this.isProduction = import.meta.env.PROD
    
    // Set log level based on environment
    // In production: only ERROR and WARN
    // In development: all levels
    this.currentLevel = this.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG
    
    // Enable/disable logging entirely
    this.enabled = !this.isProduction || import.meta.env.VITE_ENABLE_LOGGING === 'true'
  }

  /**
   * Log error messages (always shown in production)
   */
  error(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args)
      
      // In production, you might want to send errors to a monitoring service
      if (this.isProduction) {
        this.sendToMonitoring('error', message, args)
      }
    }
  }

  /**
   * Log warning messages (shown in production)
   */
  warn(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  /**
   * Log info messages (development only)
   */
  info(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Log with custom level
   */
  log(level, message, ...args) {
    switch (level) {
      case 'error':
        this.error(message, ...args)
        break
      case 'warn':
        this.warn(message, ...args)
        break
      case 'info':
        this.info(message, ...args)
        break
      case 'debug':
        this.debug(message, ...args)
        break
      default:
        this.debug(message, ...args)
    }
  }

  /**
   * Send errors to monitoring service (placeholder)
   * Replace with actual monitoring service integration (e.g., Sentry, LogRocket)
   */
  sendToMonitoring(level, message, args) {
    // TODO: Integrate with monitoring service
    // Example: Sentry.captureException(new Error(message))
  }

  /**
   * Group related logs together
   */
  group(label, callback) {
    if (this.enabled && !this.isProduction) {
      console.group(label)
      callback()
      console.groupEnd()
    } else {
      callback()
    }
  }

  /**
   * Time an operation
   */
  time(label) {
    if (this.enabled && !this.isProduction) {
      console.time(label)
    }
  }

  timeEnd(label) {
    if (this.enabled && !this.isProduction) {
      console.timeEnd(label)
    }
  }

  /**
   * Log a table (development only)
   */
  table(data) {
    if (this.enabled && !this.isProduction) {
      console.table(data)
    }
  }
}

// Export singleton instance
const logger = new Logger()
export default logger

// Also export for named imports
export { logger }