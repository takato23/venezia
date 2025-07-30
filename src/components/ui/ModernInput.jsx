import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

const ModernInput = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  success,
  helper,
  required = false,
  disabled = false,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  className = '',
  inputClassName = '',
  gradient = 'blue',
  floatingLabel = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef(null);

  // Gradientes para el focus
  const gradients = {
    blue: 'focus:from-blue-400 focus:to-indigo-600',
    green: 'focus:from-emerald-400 focus:to-teal-600',
    purple: 'focus:from-purple-400 focus:to-pink-600',
    orange: 'focus:from-orange-400 focus:to-red-600',
  };

  // Colores del borde según estado
  const borderColors = {
    default: 'border-gray-300 dark:border-gray-600',
    focused: 'border-transparent',
    error: 'border-red-500 dark:border-red-400',
    success: 'border-green-500 dark:border-green-400',
  };

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderColor = () => {
    if (error) return borderColors.error;
    if (success) return borderColors.success;
    if (isFocused) return borderColors.focused;
    return borderColors.default;
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={clsx('relative', className)}>
      {/* Container con efecto glassmórfico */}
      <div className="relative">
        {/* Efecto de gradiente en focus */}
        <motion.div
          className={clsx(
            'absolute inset-0 rounded-xl bg-gradient-to-r opacity-0',
            gradients[gradient],
            'blur-lg transition-opacity duration-300 pointer-events-none'
          )}
          animate={{ opacity: isFocused ? 0.3 : 0 }}
        />

        {/* Input container */}
        <div className={clsx(
          'relative backdrop-blur-sm',
          'bg-white/80 dark:bg-gray-900/80',
          'rounded-xl border-2 transition-all duration-300',
          getBorderColor(),
          isFocused && 'shadow-lg',
          disabled && 'opacity-50 cursor-not-allowed'
        )}>
          {/* Icono izquierdo */}
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className={clsx(
                'h-5 w-5 transition-colors duration-200',
                isFocused ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'
              )} />
            </div>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={!floatingLabel ? placeholder : ''}
            className={clsx(
              'w-full bg-transparent',
              'px-4 py-3.5',
              'text-gray-900 dark:text-white',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              Icon && 'pl-12',
              (RightIcon || type === 'password' || error || success) && 'pr-12',
              floatingLabel && (label && (hasValue || isFocused)) && 'pt-6 pb-2',
              inputClassName
            )}
            {...props}
          />

          {/* Label flotante */}
          {floatingLabel && label && (
            <motion.label
              initial={false}
              animate={{
                top: hasValue || isFocused ? '0.5rem' : '50%',
                fontSize: hasValue || isFocused ? '0.75rem' : '1rem',
                color: isFocused 
                  ? 'rgb(59, 130, 246)' 
                  : hasValue 
                    ? 'rgb(107, 114, 128)' 
                    : 'rgb(156, 163, 175)',
              }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'absolute pointer-events-none',
                'left-4 -translate-y-1/2',
                'font-medium',
                Icon && 'left-12'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </motion.label>
          )}

          {/* Label estático */}
          {!floatingLabel && label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Iconos derechos */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Toggle password */}
            {type === 'password' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </motion.button>
            )}

            {/* Icono personalizado derecho */}
            {RightIcon && !error && !success && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onRightIconClick}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RightIcon className="h-4 w-4" />
              </motion.button>
            )}

            {/* Estado iconos */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-red-500"
                >
                  <X className="h-5 w-5" />
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-green-500"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Borde gradiente en focus */}
        {isFocused && (
          <motion.div
            layoutId={`input-focus-${props.name || props.id}`}
            className={clsx(
              'absolute inset-0 rounded-xl',
              'bg-gradient-to-r', gradients[gradient].replace('focus:', ''),
              'p-[2px] -z-10'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>

      {/* Mensajes de ayuda/error */}
      <AnimatePresence>
        {(error || success || helper) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 flex items-start gap-1.5"
          >
            {error && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
            {success && <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}
            <span className={clsx(
              'text-sm',
              error && 'text-red-500 dark:text-red-400',
              success && 'text-green-500 dark:text-green-400',
              !error && !success && 'text-gray-500 dark:text-gray-400'
            )}>
              {error || success || helper}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernInput;