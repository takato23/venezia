import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Copy,
  Calculator,
  Package,
  DollarSign,
  Clock,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const RecipeCard = ({ 
  recipe, 
  ingredients = [],
  onEdit, 
  onDelete, 
  onDuplicate,
  onCalculateCost,
  onCheckAvailability,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    id,
    name,
    product_name,
    yield_quantity,
    yield_unit,
    preparation_time,
    difficulty,
    instructions,
    recipe_ingredients = [],
    total_cost,
    cost_per_unit,
    created_at,
    updated_at
  } = recipe;

  // Calculate total cost if not provided
  const calculateTotalCost = () => {
    if (total_cost) return total_cost;
    
    return recipe_ingredients.reduce((sum, ri) => {
      const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
      if (!ingredient) return sum;
      return sum + (ri.quantity * (ingredient.unit_cost || 0));
    }, 0);
  };

  const recipeCost = calculateTotalCost();
  const unitCost = cost_per_unit || (yield_quantity > 0 ? recipeCost / yield_quantity : 0);

  // Get difficulty badge color
  const getDifficultyColor = () => {
    switch (difficulty?.toLowerCase()) {
      case 'facil':
      case 'easy':
        return 'success';
      case 'medio':
      case 'medium':
        return 'warning';
      case 'dificil':
      case 'hard':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Check if any ingredient is low on stock
  const hasLowStockIngredients = () => {
    return recipe_ingredients.some(ri => {
      const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
      return ingredient && ingredient.current_stock <= ingredient.min_stock;
    });
  };

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200",
      "hover:shadow-md",
      hasLowStockIngredients() ? "border-yellow-300" : "border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {name}
            </h3>
            {product_name && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Producto: {product_name}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onDuplicate(recipe)}
              variant="ghost"
              size="sm"
              icon={Copy}
              className="text-gray-400 hover:text-gray-600"
              title="Duplicar receta"
            />
            <Button
              onClick={() => onEdit(recipe)}
              variant="ghost"
              size="sm"
              icon={Edit}
              className="text-gray-400 hover:text-gray-600"
              title="Editar receta"
            />
            <Button
              onClick={() => onDelete(id)}
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="text-gray-400 hover:text-red-600"
              title="Eliminar receta"
            />
          </div>
        </div>

        {/* Recipe Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {/* Yield */}
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Package className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Rendimiento</p>
            <p className="text-sm font-medium">
              {yield_quantity} {yield_unit}
            </p>
          </div>

          {/* Time */}
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Tiempo</p>
            <p className="text-sm font-medium">
              {preparation_time || '-'} min
            </p>
          </div>

          {/* Cost per unit */}
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Costo/unidad</p>
            <p className="text-sm font-medium">
              ${unitCost.toFixed(2)}
            </p>
          </div>

          {/* Difficulty */}
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Dificultad</p>
            <Badge variant={getDifficultyColor()} size="sm">
              {difficulty || 'Media'}
            </Badge>
          </div>
        </div>

        {/* Warnings */}
        {hasLowStockIngredients() && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mb-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Algunos ingredientes tienen stock bajo
            </p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="w-full justify-between"
        >
          <span>Ver {isExpanded ? 'menos' : 'detalles'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t dark:border-gray-700">
          {/* Ingredients List */}
          <div className="p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ingredientes ({recipe_ingredients.length})
            </h4>
            
            <div className="space-y-2">
              {recipe_ingredients.map((ri, index) => {
                const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
                const isLowStock = ingredient && ingredient.current_stock <= ingredient.min_stock;
                
                return (
                  <div 
                    key={ri.id || index}
                    className={clsx(
                      "flex items-center justify-between p-2 rounded",
                      "bg-gray-50 dark:bg-gray-700",
                      isLowStock && "border border-yellow-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {ingredient?.name || 'Ingrediente desconocido'}
                      </span>
                      {isLowStock && (
                        <Badge variant="warning" size="xs">Stock bajo</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ri.quantity} {ingredient?.unit || ''}
                      {ingredient && (
                        <span className="ml-2 text-xs">
                          (${(ri.quantity * ingredient.unit_cost).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Cost */}
            <div className="mt-3 pt-3 border-t dark:border-gray-600 flex justify-between items-center">
              <span className="font-medium">Costo Total:</span>
              <span className="text-lg font-bold text-venezia-600 dark:text-venezia-400">
                ${recipeCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Instructions */}
          {instructions && (
            <div className="p-4 border-t dark:border-gray-700">
              <h4 className="font-medium text-sm mb-2">Instrucciones</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-t dark:border-gray-700 flex gap-2">
            <Button
              onClick={() => onCalculateCost(recipe)}
              variant="outline"
              size="sm"
              icon={Calculator}
              className="flex-1"
            >
              Recalcular Costo
            </Button>
            {onCheckAvailability && (
              <Button
                onClick={() => onCheckAvailability(recipe)}
                variant="outline"
                size="sm"
                icon={ShoppingCart}
                className="flex-1"
              >
                Verificar Stock
              </Button>
            )}
          </div>

          {/* Metadata */}
          <div className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-400">
            Creado: {new Date(created_at).toLocaleDateString()}
            {updated_at && updated_at !== created_at && (
              <span className="ml-2">
                • Actualizado: {new Date(updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;