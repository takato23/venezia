import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Star, TrendingUp, Hash, Command } from 'lucide-react';

const SmartAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Buscar...", 
  className = "",
  suggestions = [],
  context = "general" // "search", "product", "customer", etc.
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem(`venezia-recent-searches-${context}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [popularSuggestions] = useState([
    { text: "Ventas de hoy", icon: "📊", category: "reports" },
    { text: "Stock de vainilla", icon: "🍦", category: "inventory" },
    { text: "Productos más vendidos", icon: "⭐", category: "analytics" },
    { text: "Nuevo producto", icon: "➕", category: "actions" },
    { text: "Reporte semanal", icon: "📈", category: "reports" },
    { text: "Clientes VIP", icon: "👑", category: "customers" },
  ]);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Obtener sugerencias inteligentes basadas en contexto
  const getSmartSuggestions = useCallback((query) => {
    if (!query.trim()) {
      // Sin query, mostrar recientes y populares
      const recent = recentSearches.slice(0, 3).map(search => ({
        ...search,
        type: 'recent'
      }));
      
      const popular = popularSuggestions.slice(0, 4).map(suggestion => ({
        ...suggestion,
        type: 'popular'
      }));
      
      return [...recent, ...popular];
    }

    const queryLower = query.toLowerCase();
    const results = [];

    // Buscar en sugerencias proporcionadas
    suggestions.forEach(suggestion => {
      if (suggestion.toLowerCase().includes(queryLower)) {
        results.push({
          text: suggestion,
          type: 'suggestion',
          icon: '🔍',
          category: context
        });
      }
    });

    // Buscar en populares
    popularSuggestions.forEach(suggestion => {
      if (suggestion.text.toLowerCase().includes(queryLower)) {
        results.push({
          ...suggestion,
          type: 'popular'
        });
      }
    });

    // Buscar en recientes
    recentSearches.forEach(search => {
      if (search.text.toLowerCase().includes(queryLower)) {
        results.push({
          ...search,
          type: 'recent'
        });
      }
    });

    // Sugerencias inteligentes basadas en patrones
    const smartSuggestions = getContextualSuggestions(queryLower);
    results.push(...smartSuggestions);

    // Eliminar duplicados y limitar resultados
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.text === result.text)
    );

    return uniqueResults.slice(0, 8);
  }, [suggestions, recentSearches, popularSuggestions, context]);

  // Sugerencias contextuales inteligentes
  const getContextualSuggestions = useCallback((query) => {
    const suggestions = [];

    // Patrones de búsqueda comunes
    if (query.includes('stock') || query.includes('inventario')) {
      suggestions.push({
        text: `Stock de ${query.replace(/stock|inventario/gi, '').trim() || 'productos'}`,
        icon: '📦',
        category: 'inventory',
        type: 'smart'
      });
    }

    if (query.includes('venta') || query.includes('vender')) {
      suggestions.push({
        text: `Ventas de ${query.replace(/venta|vender/gi, '').trim() || 'hoy'}`,
        icon: '💰',
        category: 'sales',
        type: 'smart'
      });
    }

    if (query.includes('reporte') || query.includes('análisis')) {
      suggestions.push({
        text: `Reporte de ${query.replace(/reporte|análisis/gi, '').trim() || 'ventas'}`,
        icon: '📊',
        category: 'reports',
        type: 'smart'
      });
    }

    if (query.includes('cliente')) {
      suggestions.push({
        text: `Clientes ${query.replace(/cliente/gi, '').trim() || 'activos'}`,
        icon: '👥',
        category: 'customers',
        type: 'smart'
      });
    }

    // Sugerencias numéricas
    if (/\d/.test(query)) {
      suggestions.push({
        text: `Buscar por código: ${query}`,
        icon: '#️⃣',
        category: 'search',
        type: 'smart'
      });
    }

    return suggestions;
  }, []);

  // Filtrar sugerencias cuando cambia el valor
  useEffect(() => {
    const filtered = getSmartSuggestions(value);
    setFilteredSuggestions(filtered);
    setHighlightedIndex(0);
  }, [value, getSmartSuggestions]);

  // Manejar selección
  const handleSelect = useCallback((suggestion) => {
    // Agregar a búsquedas recientes
    const newRecentSearches = [
      { ...suggestion, timestamp: Date.now() },
      ...recentSearches.filter(search => search.text !== suggestion.text)
    ].slice(0, 10);

    setRecentSearches(newRecentSearches);
    localStorage.setItem(
      `venezia-recent-searches-${context}`, 
      JSON.stringify(newRecentSearches)
    );

    // Ejecutar callbacks
    onChange(suggestion.text);
    onSelect?.(suggestion);
    setIsOpen(false);
  }, [recentSearches, context, onChange, onSelect]);

  // Manejar teclado
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, filteredSuggestions, highlightedIndex, handleSelect]);

  // Scroll al elemento destacado
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'recent': return <Clock size={14} className="text-gray-400" />;
      case 'popular': return <TrendingUp size={14} className="text-blue-500" />;
      case 'smart': return <Star size={14} className="text-purple-500" />;
      default: return <Search size={14} className="text-gray-400" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'recent': return 'Reciente';
      case 'popular': return 'Popular';
      case 'smart': return 'Sugerido';
      default: return 'Búsqueda';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            // Delay para permitir clicks en sugerencias
            setTimeout(() => {
              if (!e.currentTarget.contains(document.activeElement)) {
                setIsOpen(false);
              }
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all ${className}`}
          autoComplete="off"
        />
        <Search 
          size={20} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
        {isOpen && filteredSuggestions.length > 0 && (
          <Command 
            size={16} 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div 
              ref={listRef}
              className="max-h-80 overflow-y-auto custom-scrollbar"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <motion.div
                  key={`${suggestion.text}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`px-4 py-3 cursor-pointer transition-all border-l-3 ${
                    index === highlightedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                  }`}
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {suggestion.icon && (
                        <span className="text-lg">{suggestion.icon}</span>
                      )}
                      {getTypeIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {suggestion.text}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {getTypeLabel(suggestion.type)}
                        </span>
                      </div>
                      {suggestion.category && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {suggestion.category}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer con tips */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>↑↓ navegar • Enter seleccionar • Esc cerrar</span>
                <span>{filteredSuggestions.length} sugerencias</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartAutocomplete;