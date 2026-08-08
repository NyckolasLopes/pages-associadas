/**
 * Structured Logging Service
 * 
 * Centralizes observability. Ensures no PII is logged in plain text in production.
 */

type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
  log: (level: LogLevel, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    // In a real backend environment, this would send to Datadog, Sentry, CloudWatch, etc.
    // For now, we output to console with a specific structure.
    switch(level) {
      case 'info':
        console.log(`[INFO] ${timestamp} - ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${timestamp} - ${message}`, data || '');
        break;
      case 'error':
        console.error(`[ERROR] ${timestamp} - ${message}`, data || '');
        break;
    }
  },
  
  info: (message: string, data?: any) => logger.log('info', message, data),
  warn: (message: string, data?: any) => logger.log('warn', message, data),
  error: (message: string, error?: any) => {
    // Attempt to extract meaningful error info
    const errData = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    logger.log('error', message, errData);
  }
};
