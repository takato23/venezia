import React from 'react';
import { 
  Package, 
  Droplet, 
  Weight, 
  DollarSign,
  AlertTriangle,
  Edit,
  Trash2,
  TrendingDown
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';

const IngredientCard = ({ 
  ingredient, 
  onEdit, 
  onDelete, 
  onStockUpdate,
  className 
}) => {
  const { 
    id,
    name, 
    unit, 
    current_stock, 
    min_stock, 
    max_stock, 
    unit_cost,
    supplier_name,
    last_purchase_date,
    expiry_date
  } = ingredient;

  // Calculate stock level percentage
  const stockPercentage = max_stock > 0 
    ? (current_stock / max_stock) * 100 
    : 0;

  // Determine stock status
  const getStockStatus = () => {
    if (current_stock <= 0) return 'out-of-stock';
    if (current_stock <= min_stock) return 'low-stock';
    if (current_stock >= max_stock * 0.9) return 'overstock';
    return 'normal';
  };

  const stockStatus = getStockStatus();

  // Get status color and icon
  const getStatusConfig = () => {
    switch (stockStatus) {
      case 'out-of-stock':
        return {
          color: 'text-red-600 bg-red-50',
          borderColor: 'border-red-200',
          barColor: 'bg-red-500',
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Sin Stock'
        };
      case 'low-stock':
        return {
          color: 'text-yellow-600 bg-yellow-50',
          borderColor: 'border-yellow-200',
          barColor: 'bg-yellow-500',
          icon: <TrendingDown className="w-4 h-4" />,
          text: 'Stock Bajo'
        };
      case 'overstock':
        return {
          color: 'text-blue-600 bg-blue-50',
          borderColor: 'border-blue-200',
          barColor: 'bg-blue-500',
          text: 'Exceso'
        };
      default:
        return {
          color: 'text-green-600 bg-green-50',
          borderColor: 'border-gray-200',
          barColor: 'bg-green-500',
          text: 'Normal'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Check if ingredient is expiring soon
  const isExpiringSoon = () => {
    if (!expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!expiry_date) return false;
    return new Date(expiry_date) < new Date();
  };

  // Get appropriate unit icon
  const getUnitIcon = () => {
    switch (unit?.toLowerCase()) {
      case 'kg':
      case 'g':
        return <Weight className="w-4 h-4" />;
      case 'l':
      case 'ml':
        return <Droplet className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200",
      "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600",
      statusConfig.borderColor,
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {getUnitIcon()}
              {name}
            </h3>
            {supplier_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Proveedor: {supplier_name}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onEdit(ingredient)}
              variant="ghost"
              size="sm"
              icon={Edit}
              className="text-gray-400 hover:text-gray-600"
            />
            <Button
              onClick={() => onDelete(id)}
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="text-gray-400 hover:text-red-600"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={clsx(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            statusConfig.color
          )}>
            {statusConfig.icon}
            {statusConfig.text}
          </span>
          
          {(isExpired() || isExpiringSoon()) && (
            <span className={clsx(
              "text-xs px-2 py-1 rounded-full",
              isExpired() 
                ? "bg-red-100 text-red-700" 
                : "bg-yellow-100 text-yellow-700"
            )}>
              {isExpired() ? 'Expirado' : `Expira en ${Math.ceil(
                (new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
              )} días`}
            </span>
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="p-4 space-y-3">
        {/* Stock Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Stock Actual
            </span>
            <span className="font-medium">
              {current_stock} {unit}
            </span>
          </div>
          
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={clsx("absolute inset-y-0 left-0 transition-all duration-300", statusConfig.barColor)}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
            
            {/* Min/Max indicators */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
              style={{ left: `${(min_stock / max_stock) * 100}%` }}
              title={`Mínimo: ${min_stock} ${unit}`}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Mín: {min_stock}</span>
            <span>Máx: {max_stock}</span>
          </div>
        </div>

        {/* Cost Information */}
        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span>Costo unitario</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            ${unit_cost?.toFixed(2) || '0.00'}/{unit}
          </span>
        </div>

        {/* Last Purchase */}
        {last_purchase_date && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Última compra: {new Date(last_purchase_date).toLocaleDateString()}
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t dark:border-gray-700">
          <Button
            onClick={() => onStockUpdate(ingredient)}
            variant="outline"
            size="sm"
            className="w-full"
            icon={Package}
          >
            Actualizar Stock
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;