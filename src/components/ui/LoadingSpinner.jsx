import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'venezia-900',
  className,
  text,
  context // Nuevo prop para dar contexto de lo que se está cargando
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const borderSizeClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4',
  };

  // Mensajes contextuales para heladería
  const getContextualMessage = () => {
    if (text) return text;
    
    switch (context) {
      case 'login':
        return 'Verificando credenciales...';
      case 'sales':
        return 'Procesando venta...';
      case 'inventory':
        return 'Cargando inventario...';
      case 'products':
        return 'Cargando productos...';
      case 'production':
        return 'Cargando órdenes de producción...';
      case 'customers':
        return 'Cargando clientes...';
      case 'reports':
        return 'Generando reporte...';
      case 'save':
        return 'Guardando cambios...';
      case 'delete':
        return 'Eliminando elemento...';
      case 'upload':
        return 'Subiendo archivo...';
      default:
        return 'Cargando...';
    }
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <motion.div
        className={clsx(
          sizeClasses[size],
          borderSizeClasses[size],
          `border-${color}/20`,
          `border-t-${color}`,
          'rounded-full'
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={clsx(
          'mt-3 text-sm font-medium',
          `text-${color}/60`
        )}
      >
        {getContextualMessage()}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner; 