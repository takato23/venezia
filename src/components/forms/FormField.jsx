import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';

const FormField = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  success,
  helpText,
  validation,
  validateOnChange = false,
  validateOnBlur = true,
  className,
  labelClassName,
  inputClassName,
  options = [], // For select fields
  rows = 3, // For textarea
  ...props
}) => {
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Validation function
  const validateField = useCallback(async (val) => {
    if (!validation) return { valid: true };
    
    setIsValidating(true);
    try {
      // Built-in validations
      if (required && !val) {
        return { valid: false, error: `${label || 'Este campo'} es requerido` };
      }

      if (type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          return { valid: false, error: 'Ingresa un email válido' };
        }
      }

      if (type === 'tel' && val) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        if (!phoneRegex.test(val)) {
          return { valid: false, error: 'Ingresa un número de teléfono válido' };
        }
      }

      if (type === 'url' && val) {
        try {
          new URL(val);
        } catch {
          return { valid: false, error: 'Ingresa una URL válida' };
        }
      }

      // Custom validation
      if (validation) {
        const result = await validation(val);
        if (result !== true) {
          return { valid: false, error: result };
        }
      }

      return { valid: true, success: '¡Se ve bien!' };
    } finally {
      setIsValidating(false);
    }
  }, [validation, required, label, type]);

  // Handle change with validation
  const handleChange = useCallback(async (e) => {
    const newValue = e.target.value;
    onChange(e);

    if (validateOnChange && touched) {
      const result = await validateField(newValue);
      setLocalError(result.valid ? '' : result.error);
      setLocalSuccess(result.valid && result.success ? result.success : '');
    }
  }, [onChange, validateOnChange, touched, validateField]);

  // Handle blur with validation
  const handleBlur = useCallback(async (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);

    if (validateOnBlur) {
      const result = await validateField(value);
      setLocalError(result.valid ? '' : result.error);
      setLocalSuccess(result.valid && result.success ? result.success : '');
    }
  }, [onBlur, validateOnBlur, value, validateField]);

  // Clear validation on external error/success changes
  useEffect(() => {
    if (error) setLocalError(error);
    if (success) setLocalSuccess(success);
  }, [error, success]);

  const displayError = localError || error;
  const displaySuccess = localSuccess || success;
  const hasError = !!displayError && touched;
  const hasSuccess = !!displaySuccess && !hasError && touched;

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: 'Muy corta', color: 'bg-gray-300' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const labels = ['Débil', 'Regular', 'Buena', 'Fuerte'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

    return {
      strength,
      label: labels[strength - 1] || 'Muy corta',
      color: colors[strength - 1] || 'bg-gray-300'
    };
  };

  const fieldId = `field-${name}`;

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      placeholder,
      disabled,
      className: clsx(
        inputClassName,
        hasError && 'border-red-500 focus:ring-red-500',
        hasSuccess && 'border-green-500 focus:ring-green-500',
        isValidating && 'pr-10'
      ),
      ...props
    };

    switch (type) {
      case 'select':
        return (
          <Select {...commonProps}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );

      case 'textarea':
        return <TextArea {...commonProps} rows={rows} />;

      case 'password':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              className={clsx(commonProps.className, 'pr-10')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        );

      default:
        return <Input {...commonProps} type={type} />;
    }
  };

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className={clsx(
            'block text-sm font-medium text-gray-700 dark:text-gray-300',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {renderInput()}

        {/* Validation indicator */}
        <AnimatePresence>
          {(isValidating || hasError || hasSuccess) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
            >
              {isValidating && (
                <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
              )}
              {hasError && !isValidating && (
                <X className="h-4 w-4 text-red-500" />
              )}
              {hasSuccess && !isValidating && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password strength indicator */}
      {type === 'password' && value && touched && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-1"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => {
              const strength = getPasswordStrength(value);
              return (
                <div
                  key={level}
                  className={clsx(
                    'h-1 flex-1 rounded-full transition-colors',
                    level <= strength.strength ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Seguridad de contraseña: {getPasswordStrength(value).label}
          </p>
        </motion.div>
      )}

      {/* Help text */}
      {helpText && !hasError && !hasSuccess && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* Error message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {hasSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400"
          >
            <Check className="h-3 w-3 flex-shrink-0" />
            <span>{displaySuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Form component that manages multiple fields
export const Form = ({ children, onSubmit, className, ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  );
};

export default FormField;