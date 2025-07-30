import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Star,
  Package,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const ModernProductCard = ({
  product,
  onAddToCart,
  onRemoveFromCart,
  quantity = 0,
  isLoading = false,
  showStock = true,
  gradient = 'blue',
  delay = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Gradientes por categoría
  const gradients = {
    blue: 'from-blue-400 to-indigo-600',
    green: 'from-emerald-400 to-teal-600',
    purple: 'from-purple-400 to-pink-600',
    orange: 'from-orange-400 to-red-600',
    cyan: 'from-cyan-400 to-blue-600',
  };

  // Estado del stock
  const stockStatus = product?.stock <= 0 ? 'out' : 
                     product?.stock <= 5 ? 'low' : 'normal';

  const handleAddToCart = async () => {
    setIsAdding(true);
    await onAddToCart?.(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 rounded-2xl p-6 shadow-xl">
          <div className="space-y-4">
            <div className="h-48 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200/50 dark:bg-gray-700/50 rounded animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Efecto de brillo de fondo */}
      <motion.div 
        className={clsx(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500',
          'bg-gradient-to-r', gradients[gradient],
          'blur-xl'
        )}
        animate={{ 
          opacity: isHovered ? 0.3 : 0,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Card principal */}
      <div className={clsx(
        'relative backdrop-blur-md bg-white/80 dark:bg-gray-900/80',
        'border border-gray-200/50 dark:border-gray-700/50',
        'rounded-2xl overflow-hidden shadow-xl',
        'hover:shadow-2xl transition-all duration-300'
      )}>
        {/* Badge de estado */}
        {stockStatus === 'low' && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100/90 dark:bg-amber-900/30 backdrop-blur-sm">
              <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Stock bajo</span>
            </div>
          </motion.div>
        )}

        {/* Badge de nuevo/popular */}
        {product?.isNew && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs font-medium">Nuevo</span>
            </div>
          </motion.div>
        )}

        {/* Imagen del producto */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {product?.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-600" />
            </div>
          )}
          
          {/* Overlay con gradiente */}
          <div className={clsx(
            'absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )} />
        </div>

        {/* Contenido */}
        <div className="p-5">
          {/* Nombre y descripción */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">
              {product?.name}
            </h3>
            {product?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Precio y rating */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                ${product?.price?.toFixed(2)}
              </motion.div>
              {product?.originalPrice && product.originalPrice > product.price && (
                <div className="text-sm text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </div>
              )}
            </div>
            
            {product?.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.rating}
                </span>
              </div>
            )}
          </div>

          {/* Stock */}
          {showStock && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Stock disponible</span>
                <span className={clsx(
                  'font-medium',
                  stockStatus === 'out' && 'text-red-600 dark:text-red-400',
                  stockStatus === 'low' && 'text-amber-600 dark:text-amber-400',
                  stockStatus === 'normal' && 'text-green-600 dark:text-green-400'
                )}>
                  {product?.stock} unidades
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((product?.stock / 20) * 100, 100)}%` }}
                  transition={{ delay: delay + 0.3, duration: 0.5 }}
                  className={clsx(
                    'h-full rounded-full',
                    stockStatus === 'out' && 'bg-red-500',
                    stockStatus === 'low' && 'bg-amber-500',
                    stockStatus === 'normal' && 'bg-green-500'
                  )}
                />
              </div>
            </div>
          )}

          {/* Controles de cantidad */}
          <div className="flex items-center gap-3">
            {quantity > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 flex-1"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemoveFromCart?.(product)}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-red-100 dark:bg-red-900/30',
                    'hover:bg-red-200 dark:hover:bg-red-900/50',
                    'text-red-600 dark:text-red-400',
                    'transition-colors duration-200'
                  )}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  disabled={product?.stock <= quantity}
                  className={clsx(
                    'p-2 rounded-lg',
                    'bg-green-100 dark:bg-green-900/30',
                    'hover:bg-green-200 dark:hover:bg-green-900/50',
                    'text-green-600 dark:text-green-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-200'
                  )}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={stockStatus === 'out'}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
                  'font-medium transition-all duration-200',
                  stockStatus === 'out' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                )}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.div
                      key="adding"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cart"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span>{stockStatus === 'out' ? 'Sin stock' : 'Agregar'}</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernProductCard;