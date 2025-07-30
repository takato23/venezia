import React from 'react';
import clsx from 'clsx';

const Select = ({
  label,
  error,
  placeholder,
  className,
  disabled = false,
  options = [],
  icon: Icon,
  children,
  ...props
}) => {
  const selectClasses = clsx(
    'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm transition-colors',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
    'focus:border-venezia-500 focus:ring-venezia-500 dark:focus:border-venezia-400 dark:focus:ring-venezia-400',
    'sm:text-sm',
    error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
    disabled && 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-50',
    Icon && 'pl-10',
    className
  );

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        <select
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-500 dark:text-gray-400">
              {placeholder}
            </option>
          )}
          {options.length > 0 ? (
            options.map((option, index) => (
              <option 
                key={option.value || index} 
                value={option.value}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {option.label}
              </option>
            ))
          ) : (
            children
          )}
        </select>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select; 