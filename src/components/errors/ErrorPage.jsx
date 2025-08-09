import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Bug,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import clsx from 'clsx';

const ErrorPage = ({ 
  error, 
  resetErrorBoundary,
  title = "Oops! Something went wrong",
  subtitle = "We're sorry for the inconvenience. Please try again or contact support if the problem persists.",
  showDetails = true,
  showActions = true,
  illustration = 'default'
}) => {
  const navigate = useNavigate();
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorMessage = error?.message || 'An unexpected error occurred';
  const errorStack = error?.stack || 'No stack trace available';

  const copyErrorDetails = () => {
    const errorInfo = `
Error: ${errorMessage}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Stack Trace:
${errorStack}
    `.trim();

    navigator.clipboard.writeText(errorInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoHome = () => {
    if (resetErrorBoundary) resetErrorBoundary();
    navigate('/');
  };

  const handleRetry = () => {
    if (resetErrorBoundary) resetErrorBoundary();
    window.location.reload();
  };

  const getIllustration = () => {
    switch (illustration) {
      case '404':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
            <circle cx="200" cy="150" r="80" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="3" strokeDasharray="5 5" />
            <text x="200" y="160" textAnchor="middle" className="text-6xl font-bold fill-gray-400 dark:fill-gray-500">404</text>
          </svg>
        );
      
      case '500':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
            <rect x="150" y="100" width="100" height="100" rx="10" className="fill-gray-300 dark:fill-gray-600" />
            <circle cx="175" cy="130" r="8" className="fill-gray-500 dark:fill-gray-400" />
            <circle cx="225" cy="130" r="8" className="fill-gray-500 dark:fill-gray-400" />
            <path d="M175 170 Q200 150 225 170" className="stroke-gray-500 dark:stroke-gray-400" strokeWidth="3" fill="none" />
          </svg>
        );
      
      default:
        return (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <AlertTriangle className="w-32 h-32 text-yellow-500" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-2 h-8 bg-yellow-500 rounded-full" />
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-48">
            {getIllustration()}
          </div>
        </div>

        {/* Error Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        {/* Error Details */}
        {showDetails && error && (
          <div className="mb-8">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Error Details
                </span>
              </div>
              {showErrorDetails ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            <AnimatePresence>
              {showErrorDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Error Message
                      </h3>
                      <button
                        onClick={copyErrorDetails}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-mono">
                      {errorMessage}
                    </p>
                    
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stack Trace
                    </h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto font-mono bg-gray-200 dark:bg-gray-900 p-2 rounded">
                      {errorStack}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={RefreshCw}
              onClick={handleRetry}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={Home}
              onClick={handleGoHome}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        )}

        {/* Help Text */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          If you continue to experience issues, please contact{' '}
          <a 
            href="mailto:support@venezia.com" 
            className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
          >
            support@venezia.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

// 404 Error Page
export const NotFoundPage = () => (
  <ErrorPage
    title="Page Not Found"
    subtitle="The page you're looking for doesn't exist or has been moved."
    illustration="404"
    showDetails={false}
    error={null}
  />
);

// 500 Error Page
export const ServerErrorPage = ({ error }) => (
  <ErrorPage
    title="Server Error"
    subtitle="Our servers are having trouble right now. Please try again later."
    illustration="500"
    error={error}
  />
);

// Network Error Page
export const NetworkErrorPage = () => (
  <ErrorPage
    title="Connection Lost"
    subtitle="Please check your internet connection and try again."
    illustration="network"
    showDetails={false}
    error={null}
  />
);

export default ErrorPage;