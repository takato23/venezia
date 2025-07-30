// Global error handler utility

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error handler for API calls
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
    throw new NetworkError('No se pudo conectar con el servidor');
  }
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new ValidationError(data.message || 'Datos inválidos', data.errors);
      case 401:
        throw new ApiError('No autorizado. Por favor inicia sesión.', status);
      case 403:
        throw new ApiError('No tienes permisos para realizar esta acción.', status);
      case 404:
        throw new ApiError('Recurso no encontrado.', status);
      case 409:
        throw new ApiError('Conflicto: El recurso ya existe.', status);
      case 422:
        throw new ValidationError(data.message || 'Error de validación', data.errors);
      case 500:
        throw new ApiError('Error interno del servidor. Por favor intenta más tarde.', status);
      default:
        throw new ApiError(data.message || 'Error desconocido', status, data);
    }
  } else if (error.request) {
    // The request was made but no response was received
    throw new NetworkError('No se recibió respuesta del servidor');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw error;
  }
};

// Wrapper for async functions with error handling
export const withErrorHandler = (asyncFn, errorCallback) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (errorCallback) {
        errorCallback(error);
      }
      throw error;
    }
  };
};

// Safe JSON parse
export const safeJsonParse = (text, defaultValue = null) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

// Format error messages for display
export const formatErrorMessage = (error) => {
  if (error instanceof ValidationError && error.fields) {
    const fieldErrors = Object.entries(error.fields)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    return `${error.message}\n${fieldErrors}`;
  }
  
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof NetworkError) {
    return error.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado';
};

// Retry logic for failed requests
export const retryWithBackoff = async (
  fn, 
  retries = 3, 
  delay = 1000, 
  backoffFactor = 2
) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0 || error instanceof ValidationError) {
      throw error;
    }
    
    console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * backoffFactor, backoffFactor);
  }
};

// Error logging for production
export const logError = (error, context = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context
  };
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to service like Sentry
    console.error('Production error log:', errorLog);
  } else {
    console.error('Development error log:', errorLog);
  }
  
  return errorLog;
};