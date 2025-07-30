import React from 'react';
import { Package, Plus, IceCream, Coffee, Cake } from 'lucide-react';
import clsx from 'clsx';

/**
 * ProductCard
 * Tarjeta mejorada para representar un producto en la vista POS.
 *
 * Props:
 *  - product (object): Objeto de producto con name, price, max_flavors, category_name, image_url, stock.
 *  - onClick (function): Callback al hacer clic.
 *  - isOutOfStock (boolean): Si el producto está agotado.
 *  - variant (string): 'compact' | 'detailed' - Estilo de la tarjeta
 */
const ProductCard = ({ 
  product, 
  onClick, 
  isOutOfStock = false,
  variant = 'compact' 
}) => {
  // Icon based on category
  const getProductIcon = () => {
    const categoryName = product.category_name?.toLowerCase() || '';
    if (categoryName.includes('helado')) return IceCream;
    if (categoryName.includes('cafe') || categoryName.includes('café')) return Coffee;
    if (categoryName.includes('torta') || categoryName.includes('postre')) return Cake;
    return Package;
  };

  const Icon = getProductIcon();

  // Color scheme based on category
  const getCategoryColor = () => {
    const categoryName = product.category_name?.toLowerCase() || '';
    if (categoryName.includes('helado')) return 'text-blue-600 bg-blue-50';
    if (categoryName.includes('cafe') || categoryName.includes('café')) return 'text-amber-600 bg-amber-50';
    if (categoryName.includes('torta') || categoryName.includes('postre')) return 'text-pink-600 bg-pink-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (variant === 'detailed') {
    return (
      <button
        onClick={() => !isOutOfStock && onClick(product)}
        disabled={isOutOfStock}
        aria-label={`Agregar ${product.name} al carrito`}
        className={clsx(
          "relative group bg-white dark:bg-gray-800 border rounded-xl overflow-hidden",
          "transition-all duration-200 hover:shadow-lg",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-venezia-500",
          isOutOfStock 
            ? "border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed" 
            : "border-gray-200 dark:border-gray-700 hover:border-venezia-300 dark:hover:border-venezia-600"
        )}
      >
        {/* Product Image or Icon */}
        <div className={clsx(
          "h-32 flex items-center justify-center",
          getCategoryColor()
        )}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon 
              className="h-12 w-12" 
              title={`Categoría: ${product.category_name || 'Sin categoría'}`}
            />
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-venezia-600 dark:text-venezia-400">
              ${product.price}
            </span>
            {product.max_flavors && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.max_flavors} sabores
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Stock:</span>
              <span className={clsx(
                "font-medium",
                product.stock > 10 ? "text-green-600" : 
                product.stock > 0 ? "text-yellow-600" : "text-red-600"
              )}>
                {product.stock > 0 ? product.stock : 'Agotado'}
              </span>
            </div>
          )}
        </div>

        {/* Add button overlay */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
            <div className="bg-venezia-600 text-white rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-200">
              <Plus className="h-5 w-5" />
            </div>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Agotado
            </span>
          </div>
        )}
      </button>
    );
  }

  // Compact variant (default)
  return (
    <button
      onClick={() => !isOutOfStock && onClick(product)}
      disabled={isOutOfStock}
      aria-label={`Agregar ${product.name} al carrito`}
      className={clsx(
        "relative group bg-white dark:bg-gray-800 border rounded-lg p-3",
        "flex flex-col items-center transition-all duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-venezia-500",
        isOutOfStock 
          ? "border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed" 
          : "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-venezia-300"
      )}
    >
      <div className={clsx("p-2 rounded-full mb-2", getCategoryColor())}>
        <Icon 
          className="h-5 w-5" 
          title={`Categoría: ${product.category_name || 'Sin categoría'}`}
        />
      </div>
      
      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 text-center line-clamp-2">
        {product.name}
      </span>
      
      <span className="text-sm font-bold text-venezia-600 dark:text-venezia-400 mt-1">
        ${product.price}
      </span>
      
      {product.max_flavors && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {product.max_flavors} sabores
        </span>
      )}
      
      {!isOutOfStock && (
        <Plus className="absolute bottom-2 right-2 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {isOutOfStock && (
        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
          Agotado
        </span>
      )}
    </button>
  );
};

export default ProductCard; 