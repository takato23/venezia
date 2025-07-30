import { useState, useCallback, useEffect } from 'react';

// Global error handler for the application
class GlobalErrorHandler {
  constructor() {
    this.listeners = new Set();
    this.errorQueue = [];
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError({
        type: 'unhandledrejection',
        error: event.reason,
        timestamp: Date.now()
      });
    });

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError({
        type: 'javascript',
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    });
  }

  handleError(errorData) {
    this.errorQueue.push(errorData);
    this.notifyListeners(errorData);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(errorData) {
    this.listeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  getErrorQueue() {
    return [...this.errorQueue];
  }

  clearErrorQueue() {
    this.errorQueue = [];
  }
}

const globalErrorHandler = new GlobalErrorHandler();

// Main error handler hook
export const useErrorHandler = () => {
  const [errors, setErrors] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to global errors
  useEffect(() => {
    const unsubscribe = globalErrorHandler.subscribe((errorData) => {
      const errorWithId = {
        ...errorData,
        id: errorData.id || `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      setErrors(prev => [...prev, errorWithId].slice(-10)); // Keep last 10 errors
    });

    return unsubscribe;
  }, []);

  // Create error handler function
  const handleError = useCallback((error, context = {}) => {
    const errorData = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      isOnline
    };

    console.error('Error handled:', errorData);
    
    setErrors(prev => [...prev, errorData].slice(-10));

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      sendToMonitoring(errorData);
    }

    return errorData.id;
  }, [isOnline]);

  // Handle async errors with retry logic
  const handleAsyncError = useCallback(async (asyncFn, options = {}) => {
    const { retries = 3, delay = 1000, onRetry, onError } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        const isLastAttempt = attempt === retries;
        
        if (isLastAttempt) {
          const errorId = handleError(error, { 
            type: 'async',
            attempts: attempt,
            maxRetries: retries 
          });
          
          if (onError) {
            onError(error, errorId);
          }
          
          throw error;
        }

        // Wait before retry
        if (delay && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }

        if (onRetry) {
          onRetry(attempt, error);
        }
      }
    }
  }, [handleError]);

  // Clear specific error
  const clearError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    globalErrorHandler.clearErrorQueue();
  }, []);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = errors.filter(e => now - e.timestamp < oneHour);
    const dailyErrors = errors.filter(e => now - e.timestamp < oneDay);

    return {
      total: errors.length,
      recent: recentErrors.length,
      daily: dailyErrors.length,
      types: errors.reduce((acc, error) => {
        const type = error.context?.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }, [errors]);

  return {
    errors,
    handleError,
    handleAsyncError,
    clearError,
    clearAllErrors,
    getErrorStats,
    isOnline,
    hasErrors: errors.length > 0
  };
};

// Hook for API error handling
export const useApiErrorHandler = () => {
  const { handleError, handleAsyncError } = useErrorHandler();

  const handleApiError = useCallback((error, endpoint) => {
    const context = {
      type: 'api',
      endpoint,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    };

    // Determine error severity
    if (error.response?.status >= 500) {
      context.severity = 'high';
    } else if (error.response?.status >= 400) {
      context.severity = 'medium';
    } else {
      context.severity = 'low';
    }

    return handleError(error, context);
  }, [handleError]);

  const apiCall = useCallback(async (apiFn, endpoint, options = {}) => {
    try {
      return await handleAsyncError(apiFn, {
        ...options,
        onError: (error) => handleApiError(error, endpoint)
      });
    } catch (error) {
      // Error already handled by handleAsyncError
      throw error;
    }
  }, [handleAsyncError, handleApiError]);

  return {
    handleApiError,
    apiCall
  };
};

// Hook for form error handling
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const setFieldError = useCallback((field, error) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFormErrorState = useCallback((error) => {
    setFormError(error);
  }, []);

  const clearAllFormErrors = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
  }, []);

  const hasFieldError = useCallback((field) => {
    return !!fieldErrors[field];
  }, [fieldErrors]);

  const getFieldError = useCallback((field) => {
    return fieldErrors[field];
  }, [fieldErrors]);

  return {
    fieldErrors,
    formError,
    setFieldError,
    clearFieldError,
    setFormError: setFormErrorState,
    clearAllFormErrors,
    hasFieldError,
    getFieldError,
    hasErrors: Object.keys(fieldErrors).length > 0 || !!formError
  };
};

// Send error to monitoring service (mock implementation)
const sendToMonitoring = async (errorData) => {
  try {
    // In a real application, this would send to services like Sentry, LogRocket, etc.
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData)
    });
  } catch (e) {
    console.error('Failed to send error to monitoring service:', e);
  }
};

export default useErrorHandler;