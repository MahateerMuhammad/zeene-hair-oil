type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`
      if (error.stack && this.isDevelopment) {
        formatted += `\nStack: ${error.stack}`
      }
    }
    
    return formatted
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formatted = this.formatMessage(entry)
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }

    // In production, you might want to send logs to an external service
    if (!this.isDevelopment && this.isServer) {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement external logging service integration here
    // For example: Sentry, LogRocket, DataDog, etc.
    try {
      // Example implementation (commented out):
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // })
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error)
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context)
    this.log(entry)
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context)
    this.log(entry)
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry('warn', message, context, error)
    this.log(entry)
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry('error', message, context, error)
    this.log(entry)
  }

  // Specific logging methods for common scenarios
  authError(message: string, userId?: string, error?: Error): void {
    this.error(message, { userId, component: 'auth' }, error)
  }

  databaseError(message: string, operation: string, table?: string, error?: Error): void {
    this.error(message, { operation, table, component: 'database' }, error)
  }

  apiError(message: string, endpoint: string, method: string, error?: Error): void {
    this.error(message, { endpoint, method, component: 'api' }, error)
  }

  validationError(message: string, field: string, value?: any): void {
    this.warn(message, { field, value, component: 'validation' })
  }

  securityEvent(message: string, ip?: string, userAgent?: string): void {
    this.warn(message, { ip, userAgent, component: 'security' })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for external use
export type { LogLevel, LogEntry }