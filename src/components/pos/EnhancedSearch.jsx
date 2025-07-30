import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  X,
  ShoppingCart,
  Package
} from 'lucide-react';
import clsx from 'clsx';

const EnhancedSearch = ({ 
  products, 
  onProductSelect,
  recentSales = [],
  topProducts = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        const results = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode?.includes(searchTerm)
        ).slice(0, 8); // Máximo 8 resultados para que sea rápido
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 200); // 200ms de debounce

    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    const resultsCount = searchResults.length || (searchTerm ? 0 : topProducts.length);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % resultsCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + resultsCount) % resultsCount);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults.length > 0) {
          handleProductSelect(searchResults[selectedIndex]);
        } else if (!searchTerm && topProducts.length > 0) {
          handleProductSelect(topProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        searchInputRef.current?.blur();
        break;
    }
  }, [searchResults, selectedIndex, searchTerm, topProducts]);

  const handleProductSelect = (product) => {
    onProductSelect(product);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(0);
    searchInputRef.current?.focus(); // Mantener foco para siguiente producto
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atajos de teclado globales (F2 para buscar)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative w-full" ref={resultsRef}>
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto... (F2)"
          className={clsx(
            'w-full pl-10 pr-10 py-3',
            'bg-white dark:bg-gray-800',
            'border-2 border-gray-200 dark:border-gray-700',
            'rounded-xl',
            'focus:border-blue-500 focus:outline-none',
            'transition-all duration-200',
            isOpen && 'border-blue-500 shadow-lg'
          )}
        />
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
        
        {/* Indicador de tecla rápida */}
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">
          F2
        </div>
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'absolute z-50 w-full mt-2',
              'bg-white dark:bg-gray-800',
              'border-2 border-gray-200 dark:border-gray-700',
              'rounded-xl shadow-2xl',
              'max-h-96 overflow-auto'
            )}
          >
            {/* Resultados de búsqueda */}
            {searchTerm && searchResults.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
                  Resultados ({searchResults.length})
                </div>
                {searchResults.map((product, index) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleProductSelect(product)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-lg',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'transition-colors duration-150',
                      selectedIndex === index && 'bg-blue-50 dark:bg-blue-900/30'
                    )}
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ${product.price} · Stock: {product.stock}
                      </div>
                    </div>
                    {selectedIndex === index && (
                      <div className="text-xs text-gray-400">Enter</div>
                    )}
                  </motion.button>
                ))}
              </div>
            ) : searchTerm && searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              /* Productos frecuentes cuando no hay búsqueda */
              <div className="p-2">
                {topProducts.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
                      <TrendingUp className="h-3 w-3" />
                      Más vendidos
                    </div>
                    {topProducts.slice(0, 5).map((product, index) => (
                      <motion.button
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleProductSelect(product)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={clsx(
                          'w-full flex items-center gap-3 p-3 rounded-lg',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'transition-colors duration-150',
                          selectedIndex === index && 'bg-blue-50 dark:bg-blue-900/30'
                        )}
                      >
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${product.price}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {index + 1}
                        </div>
                      </motion.button>
                    ))}
                  </>
                )}
                
                {/* Teclas rápidas info */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 px-3 pb-2">
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>↑↓ Navegar</span>
                    <span>Enter Seleccionar</span>
                    <span>Esc Cerrar</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch;