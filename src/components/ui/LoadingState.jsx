import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import clsx from 'clsx';

const LoadingState = ({ 
  loading = true,
  error = null,
  empty = false,
  onRetry,
  loadingText = 'Cargando...',
  errorText = 'Error al cargar datos',
  emptyText = 'No hay datos disponibles',
  emptyIcon: EmptyIcon,
  className,
  size = 'default'
}) => {
  const sizes = {
    small: 'h-32',
    default: 'h-64',
    large: 'h-96',
    full: 'min-h-screen'
  };
  
  const containerClass = clsx(
    'flex flex-col items-center justify-center',
    sizes[size],
    className
  );
  
  if (loading) {
    return (
      <div className={containerClass}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {loadingText}
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {errorText}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'Ocurrió un error inesperado'}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              icon={RefreshCw}
            >
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  if (empty) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          {EmptyIcon && <EmptyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
          <p className="text-gray-500 dark:text-gray-400">
            {emptyText}
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default LoadingState;