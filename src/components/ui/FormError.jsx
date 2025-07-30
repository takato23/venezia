import React from 'react';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const FormError = ({ 
  error, 
  className,
  showIcon = true,
  variant = 'default' 
}) => {
  if (!error) return null;
  
  const variants = {
    default: 'text-red-600 dark:text-red-400',
    inline: 'text-red-600 dark:text-red-400 text-sm',
    block: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3'
  };
  
  if (variant === 'block') {
    return (
      <div className={clsx(variants.block, className)}>
        <div className="flex items-start gap-2">
          {showIcon && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div className="text-sm">
            {typeof error === 'string' ? (
              <p>{error}</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(error).map(([field, messages]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={clsx('flex items-center gap-1 mt-1', variants[variant], className)}>
      {showIcon && <AlertCircle className="w-3 h-3" />}
      <span className={variant === 'inline' ? 'text-sm' : 'text-xs'}>
        {typeof error === 'string' ? error : 'Error de validación'}
      </span>
    </div>
  );
};

export default FormError;