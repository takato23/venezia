// Enhanced error reporting service with offline support and retry logic
class ErrorReportingService {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.maxQueueSize = 100;
    
    this.setupEventListeners();
    this.startPeriodicFlush();
  }

  setupEventListeners() {
    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility for battery optimization
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.flushQueue();
      }
    });

    // Before page unload, try to send remaining errors
    window.addEventListener('beforeunload', () => {
      this.flushQueueSync();
    });
  }

  // Report error to service
  async reportError(errorData) {
    // Temporalmente deshabilitado para evitar errores 504
    console.warn('Error reporting temporalmente deshabilitado:', errorData);
    return;
    
    const enrichedError = this.enrichErrorData(errorData);
    
    if (this.isOnline) {
      try {
        await this.sendError(enrichedError);
      } catch (e) {
        this.queueError(enrichedError);
      }
    } else {
      this.queueError(enrichedError);
    }
  }

  // Enrich error data with additional context
  enrichErrorData(errorData) {
    return {
      ...errorData,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: process.env.REACT_APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo(),
      performance: this.getPerformanceInfo()
    };
  }

  // Send error to remote service
  async sendError(errorData, attempt = 1) {
    // Temporarily disable error reporting to avoid console spam
    console.warn('Error reporting temporalmente deshabilitado:', errorData);
    return; // Skip actual sending
    
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error reporting attempt ${attempt}:`, error);
      
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.sendError(errorData, attempt + 1);
      }
      
      throw error;
    }
  }

  // Queue error for later sending
  queueError(errorData) {
    this.queue.push({
      ...errorData,
      queuedAt: Date.now()
    });

    // Prevent queue from growing too large
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(-this.maxQueueSize);
    }

    // Store in localStorage for persistence
    this.persistQueue();
  }

  // Flush queued errors
  async flushQueue() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const errors = [...this.queue];
    this.queue = [];

    const sendPromises = errors.map(async (error) => {
      try {
        await this.sendError(error);
      } catch (e) {
        // Re-queue failed errors
        this.queueError(error);
      }
    });

    await Promise.allSettled(sendPromises);
    this.persistQueue();
  }

  // Synchronous flush for page unload
  flushQueueSync() {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const errors = [...this.queue];
    this.queue = [];

    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'batch_errors',
        errors: errors
      });
      
      navigator.sendBeacon('/api/errors/batch', data);
    }
  }

  // Persist queue to localStorage
  persistQueue() {
    try {
      localStorage.setItem('error_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to persist error queue:', e);
    }
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem('error_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error queue:', e);
      this.queue = [];
    }
  }

  // Periodic queue flush
  startPeriodicFlush() {
    setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.flushQueue();
      }
    }, 30000); // Flush every 30 seconds
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  getUserId() {
    // Get from auth store or local storage
    try {
      const auth = JSON.parse(localStorage.getItem('venezia-auth') || '{}');
      return auth.state?.user?.id || 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  getPerformanceInfo() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Public API for different error types
  reportJavaScriptError(error, filename, lineno, colno) {
    this.reportError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      filename,
      lineno,
      colno
    });
  }

  reportPromiseRejection(reason) {
    this.reportError({
      type: 'unhandled_promise_rejection',
      reason: reason?.toString(),
      stack: reason?.stack
    });
  }

  reportApiError(error, endpoint, requestData) {
    this.reportError({
      type: 'api',
      endpoint,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      requestData,
      responseData: error.response?.data
    });
  }

  reportUserAction(action, context) {
    this.reportError({
      type: 'user_action',
      action,
      context,
      severity: 'info'
    });
  }

  reportPerformanceIssue(metric, value, threshold) {
    this.reportError({
      type: 'performance',
      metric,
      value,
      threshold,
      severity: value > threshold ? 'warning' : 'info'
    });
  }

  // Get error statistics
  getStats() {
    return {
      queueLength: this.queue.length,
      isOnline: this.isOnline,
      lastFlushAttempt: this.lastFlushAttempt,
      totalReported: this.totalReported || 0
    };
  }
}

// Create singleton instance
const errorReportingService = new ErrorReportingService();

// Load persisted queue on startup
errorReportingService.loadQueue();

export default errorReportingService;