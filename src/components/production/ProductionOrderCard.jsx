import React, { useState, useMemo } from 'react';
import { 
  Package,
  Clock,
  User,
  Calendar,
  ChevronRight,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Copy,
  BarChart
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const ProductionOrderCard = ({ 
  order, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onViewDetails,
  onDuplicate
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Status configuration
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      variant: 'default',
      icon: Clock,
      color: 'text-gray-600'
    },
    in_progress: {
      label: 'En Proceso',
      variant: 'warning',
      icon: Play,
      color: 'text-yellow-600'
    },
    completed: {
      label: 'Completado',
      variant: 'success',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    cancelled: {
      label: 'Cancelado',
      variant: 'danger',
      icon: XCircle,
      color: 'text-red-600'
    },
    on_hold: {
      label: 'En Espera',
      variant: 'info',
      icon: Pause,
      color: 'text-blue-600'
    }
  };

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Calculate progress
  const progress = useMemo(() => {
    if (!order.recipe || !order.recipe.recipe_ingredients) return 0;
    if (order.status === 'completed') return 100;
    if (order.status === 'cancelled') return 0;
    
    // Calculate based on time elapsed for in_progress orders
    if (order.status === 'in_progress' && order.started_at) {
      const elapsed = Date.now() - new Date(order.started_at).getTime();
      const totalTime = (order.recipe.preparation_time || 30) * 60 * 1000; // Convert to ms
      return Math.min(Math.round((elapsed / totalTime) * 100), 95);
    }
    
    return 0;
  }, [order]);

  // Priority colors
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const handleAction = (action) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Orden #{order.order_number || order.id}
              </h3>
              <Badge variant={status.variant} size="sm">
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              {order.priority && (
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  priorityColors[order.priority]
                )}>
                  {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">
              {order.recipe?.name || order.product_name}
            </p>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              icon={MoreVertical}
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600"
            />
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                <button
                  onClick={() => handleAction(() => onViewDetails(order))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Asignar Lotes
                </button>
                
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleAction(() => onStatusChange(order, 'in_progress'))}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Producción
                  </button>
                )}
                
                {order.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleAction(() => onStatusChange(order, 'completed'))}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar Completado
                    </button>
                    <button
                      onClick={() => handleAction(() => onStatusChange(order, 'on_hold'))}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-700 dark:text-yellow-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pausar
                    </button>
                  </>
                )}
                
                {order.status === 'on_hold' && (
                  <button
                    onClick={() => handleAction(() => onStatusChange(order, 'in_progress'))}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Reanudar
                  </button>
                )}
                
                <div className="border-t dark:border-gray-700 my-1" />
                
                <button
                  onClick={() => handleAction(() => onEdit(order))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                
                <button
                  onClick={() => handleAction(() => onDuplicate(order))}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
                
                {order.status !== 'in_progress' && (
                  <button
                    onClick={() => handleAction(() => onDelete(order.id))}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.quantity} {order.unit || 'unidades'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Lote</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.batch_number || '-'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Programada</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.scheduled_date ? 
                new Date(order.scheduled_date).toLocaleDateString() : 
                'No programado'
              }
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Responsable</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.assigned_to || 'Sin asignar'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {order.status === 'in_progress' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">Progreso</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-venezia-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cost Information */}
        {order.estimated_cost && (
          <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Costo Estimado
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${order.estimated_cost.toFixed(2)}
            </span>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {order.recipe?.preparation_time || 30} min
          </span>
          {order.store_name && (
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {order.store_name}
            </span>
          )}
        </div>
        
        <Button
          onClick={() => onViewDetails(order)}
          variant="ghost"
          size="xs"
          icon={ChevronRight}
        >
          Detalles
        </Button>
      </div>
    </div>
  );
};

export default ProductionOrderCard;