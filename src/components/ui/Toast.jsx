import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const Toast = ({ 
  id,
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  persistent = false,
  action,
  context // Nuevo prop para contexto de heladería
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[type];

  // Obtener mensajes contextuales para heladería
  const getContextualMessage = () => {
    if (title && message) return { title, message };
    
    const contextMessages = {
      'sale_completed': {
        title: 'Venta completada',
        message: 'La venta se ha registrado exitosamente'
      },
      'product_added': {
        title: 'Producto agregado',
        message: 'El producto se ha añadido al inventario'
      },
      'stock_low': {
        title: 'Stock bajo',
        message: 'Algunos productos están por agotarse'
      },
      'order_created': {
        title: 'Orden creada',
        message: 'Nueva orden de producción generada'
      },
      'customer_added': {
        title: 'Cliente registrado',
        message: 'El cliente se ha añadido al sistema'
      },
      'recipe_saved': {
        title: 'Receta guardada',
        message: 'La receta se ha actualizado correctamente'
      },
      'login_success': {
        title: 'Bienvenido',
        message: 'Has iniciado sesión correctamente'
      },
      'login_failed': {
        title: 'Error de login',
        message: 'Credenciales incorrectas'
      },
      'data_saved': {
        title: 'Guardado',
        message: 'Los cambios se han guardado correctamente'
      },
      'error_occurred': {
        title: 'Error',
        message: 'Ha ocurrido un error inesperado'
      }
    };
    
    return contextMessages[context] || { title: title || 'Notificación', message: message || '' };
  };

  const contextualContent = getContextualMessage();

  const variants = {
    initial: { opacity: 0, x: 300, scale: 0.3 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.3 } }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={clsx(
        'toast-container',
        `toast-${type}`,
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border max-w-md',
        {
          'bg-green-50 border-green-200 text-green-800': type === 'success',
          'bg-red-50 border-red-200 text-red-800': type === 'error',
          'bg-yellow-50 border-yellow-200 text-yellow-800': type === 'warning',
          'bg-blue-50 border-blue-200 text-blue-800': type === 'info'
        }
      )}
    >
      {/* Icono */}
      <div className="flex-shrink-0">
        <Icon 
          className={clsx('h-5 w-5', {
            'text-green-500': type === 'success',
            'text-red-500': type === 'error',
            'text-yellow-500': type === 'warning',
            'text-blue-500': type === 'info'
          })} 
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {contextualContent.title && (
          <p className="text-sm font-medium mb-1">
            {contextualContent.title}
          </p>
        )}
        {contextualContent.message && (
          <p className="text-sm opacity-90">
            {contextualContent.message}
          </p>
        )}
        
        {/* Acción opcional */}
        {action && (
          <div className="mt-2">
            <button
              onClick={action.onClick}
              className={clsx(
                'text-xs font-medium underline hover:no-underline',
                {
                  'text-green-700 hover:text-green-800': type === 'success',
                  'text-red-700 hover:text-red-800': type === 'error',
                  'text-yellow-700 hover:text-yellow-800': type === 'warning',
                  'text-blue-700 hover:text-blue-800': type === 'info'
                }
              )}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </motion.div>
  );
};

// Container para los toasts
export const ToastContainer = ({ toasts = [], onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast; 