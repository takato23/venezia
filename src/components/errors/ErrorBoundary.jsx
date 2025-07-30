import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Send error to monitoring service in production
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send this to your error monitoring service
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };

      // Example: Send to your logging service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

      console.error('Error logged:', errorData);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { fallback: Fallback, level = 'component', children } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (Fallback) {
        return (
          <Fallback 
            error={error} 
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI based on level
      return (
        <ErrorFallback 
          error={error}
          level={level}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          retryCount={retryCount}
        />
      );
    }

    return children;
  }
}

// Default error fallback component
const ErrorFallback = ({ error, level, onRetry, onReload, retryCount }) => {
  const getErrorMessage = () => {
    switch (level) {
      case 'app':
        return {
          title: 'Aplicación no disponible',
          message: 'Ha ocurrido un error crítico en la aplicación. Por favor, recarga la página.',
          icon: '🚨'
        };
      case 'page':
        return {
          title: 'Página no disponible',
          message: 'Esta página ha encontrado un error. Puedes intentar recargar o volver al inicio.',
          icon: '📄'
        };
      case 'component':
      default:
        return {
          title: 'Componente no disponible',
          message: 'Este componente ha encontrado un error. Puedes intentar de nuevo.',
          icon: '🔧'
        };
    }
  };

  const { title, message, icon } = getErrorMessage();
  const canRetry = retryCount < 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center justify-center p-6 
        ${level === 'app' ? 'min-h-screen bg-gray-50 dark:bg-gray-900' : 'min-h-[200px]'}
        text-center
      `}
    >
      <div className="text-6xl mb-4">{icon}</div>
      
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {title}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {message}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left w-full max-w-2xl">
          <summary className="cursor-pointer font-medium text-red-800 dark:text-red-300 mb-2">
            Detalles del error (desarrollo)
          </summary>
          <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        {canRetry && level !== 'app' && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Intentar de nuevo {retryCount > 0 && `(${retryCount}/3)`}
          </button>
        )}
        
        <button
          onClick={onReload}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {level === 'app' ? 'Recargar aplicación' : 'Recargar página'}
        </button>
      </div>

      {retryCount >= 3 && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">
          ⚠️ Se han agotado los intentos automáticos. Intenta recargar la página.
        </p>
      )}
    </motion.div>
  );
};

// Higher-order component for easy error boundary wrapping
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error boundary integration
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error, errorInfo) => {
    setError({ error, errorInfo });
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error.error;
    }
  }, [error]);

  return {
    handleError,
    resetError,
    hasError: !!error
  };
};

export default ErrorBoundary;