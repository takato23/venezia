import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Barcode, Hash } from 'lucide-react';
import clsx from 'clsx';

const QuickSearch = ({ 
  onSearch, 
  onBarcodeScan, 
  placeholder = "Buscar producto o escanear código...",
  autoFocus = false,
  showBarcodeButton = true,
  showQuickActions = true 
}) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
    onSearch('');
  };

  const handleBarcodeScan = () => {
    if (onBarcodeScan) {
      onBarcodeScan();
    }
  };

  const handleKeyDown = (e) => {
    // Quick actions with keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'k':
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case 'b':
          e.preventDefault();
          if (showBarcodeButton && onBarcodeScan) {
            handleBarcodeScan();
          }
          break;
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={clsx(
        "relative flex items-center transition-all duration-200",
        isFocused && "transform scale-[1.02]"
      )}>
        <div className="absolute left-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onSearch(e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={clsx(
            "w-full pl-10 pr-24 py-3 text-base",
            "bg-white dark:bg-gray-800 border rounded-lg",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-venezia-500 focus:border-transparent",
            isFocused 
              ? "border-venezia-500 shadow-lg" 
              : "border-gray-300 dark:border-gray-600"
          )}
        />
        
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showBarcodeButton && onBarcodeScan && (
            <button
              type="button"
              onClick={handleBarcodeScan}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="Escanear código de barras (Ctrl+B)"
            >
              <Barcode className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick search hints */}
      {showQuickActions && isFocused && !value && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Búsqueda rápida:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Hash className="h-3 w-3" />
              <span>Escriba el código del producto</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Search className="h-3 w-3" />
              <span>Busque por nombre</span>
            </div>
            {showBarcodeButton && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Barcode className="h-3 w-3" />
                <span>Escanee código de barras (Ctrl+B)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
};

export default QuickSearch;