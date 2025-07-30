import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import LoadingSpinner from '../ui/LoadingSpinner';

const ModernChartContainer = ({ 
  title, 
  children, 
  isLoading, 
  className = "",
  gradient = 'blue',
  delay = 0,
  icon: Icon
}) => {
  // Gradientes para los headers
  const gradients = {
    blue: 'from-blue-500/10 to-indigo-500/10',
    green: 'from-emerald-500/10 to-teal-500/10',
    purple: 'from-purple-500/10 to-pink-500/10',
    orange: 'from-orange-500/10 to-red-500/10',
    cyan: 'from-cyan-500/10 to-blue-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      className={clsx('relative group', className)}
    >
      {/* Efecto de brillo de fondo sutil */}
      <div className={clsx(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500',
        'bg-gradient-to-r', gradients[gradient],
        'blur-3xl'
      )} />
      
      {/* Container con glassmorphism */}
      <div className={clsx(
        'relative backdrop-blur-md bg-white/80 dark:bg-gray-900/80',
        'border border-gray-200/50 dark:border-gray-700/50',
        'rounded-2xl shadow-xl',
        'hover:shadow-2xl transition-all duration-300',
        'overflow-hidden'
      )}>
        {/* Patrón decorativo sutil */}
        <div className="absolute -right-32 -top-32 w-64 h-64 rounded-full bg-gradient-to-br from-gray-100/20 to-transparent dark:from-gray-800/20" />
        
        {/* Header con gradiente sutil */}
        <div className={clsx(
          'relative p-6 border-b border-gray-200/50 dark:border-gray-700/50',
          'bg-gradient-to-r', gradients[gradient]
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </motion.div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            
            {/* Indicador de actualización en tiempo real */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-green-500"
            />
          </div>
        </div>
        
        {/* Contenido */}
        <div className="relative p-6">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-64 flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <LoadingSpinner size="lg" />
                {/* Efecto de pulso de fondo */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Cargando datos...
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModernChartContainer;