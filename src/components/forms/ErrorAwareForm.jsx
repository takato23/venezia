import React from 'react';
import { motion } from 'framer-motion';
import { useFormErrorHandler } from '../../hooks/useErrorHandler';
import ErrorBoundary from '../errors/ErrorBoundary';

const ErrorAwareForm = ({ 
  children, 
  onSubmit, 
  onError,
  showErrorSummary = true,
  className = '',
  ...props 
}) => {
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearFieldError,
    setFormError,
    clearAllFormErrors,
    hasFieldError,
    getFieldError,
    hasErrors
  } = useFormErrorHandler();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      // Clear previous errors
      clearAllFormErrors();
      
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData.entries());
      
      // Basic client-side validation
      const validationErrors = validateForm(data);
      if (Object.keys(validationErrors).length > 0) {
        // Set field errors
        Object.entries(validationErrors).forEach(([field, error]) => {
          setFieldError(field, error);
        });
        return;
      }
      
      // Call the actual submit handler
      await onSubmit(data, {
        setFieldError,
        setFormError
      });
      
    } catch (error) {
      // Handle submission error
      if (error.fieldErrors) {
        // Server returned field-specific errors
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          setFieldError(field, message);
        });
      } else {
        // General form error
        setFormError(error.message || 'Ha ocurrido un error al procesar el formulario');
      }
      
      if (onError) {
        onError(error);
      }
    }
  };

  // Basic form validation
  const validateForm = (data) => {
    const errors = {};
    
    // Check required fields
    const requiredFields = Array.from(document.querySelectorAll('[required]'));
    requiredFields.forEach(field => {
      if (!data[field.name] || data[field.name].trim() === '') {
        errors[field.name] = 'Este campo es obligatorio';
      }
    });
    
    // Email validation
    const emailFields = Array.from(document.querySelectorAll('input[type="email"]'));
    emailFields.forEach(field => {
      if (data[field.name] && !isValidEmail(data[field.name])) {
        errors[field.name] = 'Por favor ingresa un email válido';
      }
    });
    
    // Phone validation
    const phoneFields = Array.from(document.querySelectorAll('input[type="tel"]'));
    phoneFields.forEach(field => {
      if (data[field.name] && !isValidPhone(data[field.name])) {
        errors[field.name] = 'Por favor ingresa un teléfono válido';
      }
    });
    
    // Number validation
    const numberFields = Array.from(document.querySelectorAll('input[type="number"]'));
    numberFields.forEach(field => {
      if (data[field.name]) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        const value = parseFloat(data[field.name]);
        
        if (isNaN(value)) {
          errors[field.name] = 'Por favor ingresa un número válido';
        } else if (min !== null && value < parseFloat(min)) {
          errors[field.name] = `El valor debe ser mayor o igual a ${min}`;
        } else if (max !== null && value > parseFloat(max)) {
          errors[field.name] = `El valor debe ser menor o igual a ${max}`;
        }
      }
    });
    
    return errors;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone) => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  return (
    <ErrorBoundary level="component">
      <form 
        onSubmit={handleSubmit} 
        className={`space-y-4 ${className}`}
        noValidate
        {...props}
      >
        {/* Form error summary */}
        {showErrorSummary && (hasErrors || formError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-start">
              <div className="text-red-500 dark:text-red-400 text-xl mr-3">
                ⚠️
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Se encontraron errores en el formulario:
                </h3>
                
                {formError && (
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {formError}
                  </p>
                )}
                
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                    {Object.entries(fieldErrors).map(([field, error]) => (
                      <li key={field}>
                        <strong>{getFieldLabel(field)}:</strong> {error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <button
                type="button"
                onClick={clearAllFormErrors}
                className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* Form fields with error context */}
        <FormErrorContext.Provider value={{
          fieldErrors,
          hasFieldError,
          getFieldError,
          setFieldError,
          clearFieldError
        }}>
          {children}
        </FormErrorContext.Provider>
      </form>
    </ErrorBoundary>
  );
};

// Context for field error access
const FormErrorContext = React.createContext(null);

// Hook to use form error context in field components
export const useFormErrorContext = () => {
  const context = React.useContext(FormErrorContext);
  if (!context) {
    return {
      fieldErrors: {},
      hasFieldError: () => false,
      getFieldError: () => null,
      setFieldError: () => {},
      clearFieldError: () => {}
    };
  }
  return context;
};

// Enhanced form field component with error handling
export const FormField = ({ 
  name,
  label,
  type = 'text',
  required = false,
  children,
  className = '',
  ...props 
}) => {
  const { hasFieldError, getFieldError, clearFieldError } = useFormErrorContext();
  const hasError = hasFieldError(name);
  const errorMessage = getFieldError(name);

  const handleFocus = () => {
    // Clear error when user starts editing
    if (hasError) {
      clearFieldError(name);
    }
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium mb-1 ${
            hasError 
              ? 'text-red-700 dark:text-red-300' 
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {children || (
          <input
            type={type}
            name={name}
            id={name}
            required={required}
            onFocus={handleFocus}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              transition-colors duration-200
              ${hasError 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:border-accent-500 focus:ring-accent-500'
              }
              dark:bg-gray-700 dark:text-white
              focus:outline-none focus:ring-1
            `}
            {...props}
          />
        )}

        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-red-500 text-sm">⚠️</span>
          </div>
        )}
      </div>

      {hasError && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
};

// Utility function to get human-readable field labels
const getFieldLabel = (fieldName) => {
  const labels = {
    email: 'Email',
    password: 'Contraseña',
    name: 'Nombre',
    phone: 'Teléfono',
    address: 'Dirección',
    price: 'Precio',
    quantity: 'Cantidad',
    stock: 'Stock',
    category: 'Categoría',
    description: 'Descripción'
  };
  
  return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
};

export default ErrorAwareForm;