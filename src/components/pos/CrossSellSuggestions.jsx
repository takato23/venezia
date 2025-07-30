import React, { useMemo } from 'react';
import { Plus, Sparkles, TrendingUp, Target } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const CrossSellSuggestions = ({ cart = [], products = [], onProductSelect, className = "" }) => {
  
  // Lógica de cross-selling basada en reglas de negocio para heladería
  const suggestions = useMemo(() => {
    if (cart.length === 0) return [];

    const cartItemNames = cart.map(item => item.name?.toLowerCase() || '');
    const cartCategories = cart.map(item => item.category?.toLowerCase() || '');
    
    const suggestionRules = [];

    // Regla 1: Si hay helados, sugerir complementos
    const hasIceCream = cartItemNames.some(name => 
      name.includes('helado') || name.includes('gelato') || cartCategories.includes('helado')
    );
    
    if (hasIceCream) {
      suggestionRules.push({
        reason: 'Complementa tu helado',
        keywords: ['cono', 'topping', 'salsa', 'granillo', 'chispas', 'crema'],
        priority: 3
      });
    }

    // Regla 2: Si hay bebidas frías, sugerir snacks
    const hasColdDrink = cartItemNames.some(name => 
      name.includes('batido') || name.includes('smoothie') || name.includes('milkshake')
    );
    
    if (hasColdDrink) {
      suggestionRules.push({
        reason: 'Perfecto con tu bebida',
        keywords: ['galleta', 'waffle', 'brownie', 'alfajor', 'snack'],
        priority: 2
      });
    }

    // Regla 3: Si es compra pequeña, sugerir más productos
    if (cart.length === 1) {
      suggestionRules.push({
        reason: 'Agrega otro sabor',
        keywords: ['helado', 'gelato', 'sabor'],
        priority: 2
      });
    }

    // Regla 4: Productos premium si hay budget alto
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal > 500) {
      suggestionRules.push({
        reason: 'Productos premium',
        keywords: ['premium', 'especial', 'gourmet', 'artesanal'],
        priority: 3
      });
    }

    // Regla 5: Promociones por cantidad
    if (cart.length >= 2) {
      suggestionRules.push({
        reason: 'Completa la promo',
        keywords: ['combo', 'pack', 'familiar', 'promo'],
        priority: 2
      });
    }

    // Buscar productos que coincidan con las reglas
    const foundSuggestions = [];
    
    suggestionRules.forEach(rule => {
      const matchingProducts = products.filter(product => {
        const productName = product.name?.toLowerCase() || '';
        const productDescription = product.description?.toLowerCase() || '';
        const isAlreadyInCart = cart.some(cartItem => cartItem.id === product.id);
        
        return !isAlreadyInCart && rule.keywords.some(keyword => 
          productName.includes(keyword) || productDescription.includes(keyword)
        );
      });

      matchingProducts.slice(0, 2).forEach(product => {
        if (!foundSuggestions.find(s => s.id === product.id)) {
          foundSuggestions.push({
            ...product,
            suggestion_reason: rule.reason,
            priority: rule.priority
          });
        }
      });
    });

    // Ordenar por prioridad y tomar los mejores
    return foundSuggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);
      
  }, [cart, products]);

  if (suggestions.length === 0) return null;

  const getReasonColor = (reason) => {
    const colorMap = {
      'Complementa tu helado': 'purple',
      'Perfecto con tu bebida': 'blue',
      'Agrega otro sabor': 'green',
      'Productos premium': 'yellow',
      'Completa la promo': 'red'
    };
    return colorMap[reason] || 'gray';
  };

  const getReasonIcon = (reason) => {
    const iconMap = {
      'Complementa tu helado': Sparkles,
      'Perfecto con tu bebida': Target,
      'Agrega otro sabor': Plus,
      'Productos premium': TrendingUp,
      'Completa la promo': Target
    };
    return iconMap[reason] || Plus;
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h4 className="font-medium text-gray-900 dark:text-white">
          💡 Sugerencias para aumentar venta
        </h4>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((product) => {
          const ReasonIcon = getReasonIcon(product.suggestion_reason);
          const reasonColor = getReasonColor(product.suggestion_reason);
          
          return (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={reasonColor} size="sm">
                      <ReasonIcon className="h-3 w-3 mr-1" />
                      {product.suggestion_reason}
                    </Badge>
                  </div>
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                    {product.name}
                  </h5>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    ${product.price?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProductSelect(product)}
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </Button>
              </div>
              
              {product.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {product.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          ✨ Sugerencias basadas en tendencias de venta y combinaciones populares
        </p>
      </div>
    </div>
  );
};

export default CrossSellSuggestions;