import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap,
  Package
} from 'lucide-react';
import clsx from 'clsx';

const QuickProducts = ({ 
  products = [], 
  onProductSelect,
  maxProducts = 9 
}) => {
  // Solo los primeros 9 productos para teclas 1-9
  const quickProducts = products.slice(0, maxProducts);

  // Manejar teclas numéricas
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Solo si no hay ningún input activo
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const key = parseInt(e.key);
      if (key >= 1 && key <= 9 && quickProducts[key - 1]) {
        e.preventDefault();
        onProductSelect(quickProducts[key - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quickProducts, onProductSelect]);

  if (quickProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-yellow-500" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Acceso Rápido
        </h3>
        <span className="text-xs text-gray-400">
          (Teclas 1-9)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickProducts.map((product, index) => (
          <motion.button
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onProductSelect(product)}
            className={clsx(
              'relative p-3 rounded-lg',
              'bg-gray-50 dark:bg-gray-900/50',
              'hover:bg-gray-100 dark:hover:bg-gray-900/70',
              'border border-gray-200 dark:border-gray-700',
              'transition-all duration-150',
              'group'
            )}
          >
            {/* Número de tecla */}
            <div className={clsx(
              'absolute top-1 right-1',
              'w-6 h-6 rounded-full',
              'bg-blue-100 dark:bg-blue-900/30',
              'text-blue-600 dark:text-blue-400',
              'text-xs font-bold',
              'flex items-center justify-center'
            )}>
              {index + 1}
            </div>

            {/* Icono y nombre */}
            <div className="flex flex-col items-center gap-2">
              <div className={clsx(
                'p-2 rounded-lg',
                'bg-gray-100 dark:bg-gray-800',
                'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
                'transition-colors duration-150'
              )}>
                <Package className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                  {product.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ${product.price}
                </div>
              </div>
            </div>

            {/* Stock indicator */}
            {product.stock <= 5 && (
              <div className={clsx(
                'absolute bottom-1 left-1',
                'w-2 h-2 rounded-full',
                product.stock === 0 ? 'bg-red-500' : 'bg-yellow-500',
                'animate-pulse'
              )} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Instrucciones */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        Presiona 1-9 para agregar rápidamente
      </div>
    </div>
  );
};

export default QuickProducts;