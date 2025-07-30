import React from 'react';
import clsx from 'clsx';

const TextArea = ({
  label,
  error,
  className,
  disabled = false,
  rows = 3,
  ...props
}) => {
  const textareaClasses = clsx(
    'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
    'focus:border-venezia-500 focus:ring-venezia-500 sm:text-sm',
    'resize-vertical',
    error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
    disabled && 'bg-gray-50 cursor-not-allowed',
    className
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <textarea
        className={textareaClasses}
        disabled={disabled}
        rows={rows}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextArea; 