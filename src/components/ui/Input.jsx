import React from 'react';
import clsx from 'clsx';

const Input = ({
  label,
  error,
  help,
  className,
  disabled = false,
  leftIcon: LeftIcon,
  icon: Icon,
  multiline = false,
  required = false,
  ...props
}) => {
  const baseInputClasses = 'block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm transition-all duration-200 focus:border-venezia-500 focus:ring-venezia-500 dark:focus:border-venezia-400 dark:focus:ring-venezia-400 sm:text-sm';
  const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500';
  const disabledClasses = 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60';
  
  // Use Icon prop if available, otherwise fallback to LeftIcon
  const IconComponent = Icon || LeftIcon;
  
  const inputClasses = clsx(
    baseInputClasses,
    error && errorClasses,
    disabled && disabledClasses,
    IconComponent && 'pl-10',
    multiline && 'resize-vertical',
    className
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconComponent className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
        )}
        {multiline ? (
          <textarea
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
        ) : (
          <input
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {help && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
};

export default Input; 