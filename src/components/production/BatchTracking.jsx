import React, { useState, useEffect } from 'react';
import { 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  User,
  Calendar,
  TrendingUp,
  BarChart,
  Timer
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import clsx from 'clsx';

const BatchTracking = ({ 
  batch, 
  order,
  onUpdateStatus,
  onComplete,
  ingredients = []
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(batch.status === 'in_progress');

  // Calculate elapsed time for in-progress batches
  useEffect(() => {
    if (!isRunning) return;

    const startTime = batch.started_at ? new Date(batch.started_at).getTime() : Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, batch.started_at]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdateStatus(batch.id, newStatus);
      
      if (newStatus === 'in_progress') {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error updating batch status:', error);
    }
  };

  // Calculate progress percentage
  const estimatedDuration = order?.estimated_duration || 60; // minutes
  const progressPercentage = Math.min((elapsedTime / (estimatedDuration * 60)) * 100, 100);

  // Check ingredient availability
  const checkIngredientAvailability = () => {
    if (!order?.recipe?.recipe_ingredients) return { available: true, missing: [] };

    const missing = [];
    order.recipe.recipe_ingredients.forEach(ri => {
      const ingredient = ingredients.find(i => i.id === ri.ingredient_id);
      const needed = ri.quantity * batch.quantity;
      if (!ingredient || ingredient.current_stock < needed) {
        missing.push({
          name: ingredient?.name || 'Desconocido',
          needed,
          available: ingredient?.current_stock || 0
        });
      }
    });

    return { available: missing.length === 0, missing };
  };

  const availability = checkIngredientAvailability();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lote #{batch.batch_number}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {order?.recipe?.name || order?.product_name} - {batch.quantity} {order?.unit}
          </p>
        </div>
        
        <span className={clsx(
          'px-3 py-1 rounded-full text-sm font-medium',
          getStatusColor(batch.status)
        )}>
          {batch.status === 'pending' && 'Pendiente'}
          {batch.status === 'in_progress' && 'En Proceso'}
          {batch.status === 'completed' && 'Completado'}
          {batch.status === 'paused' && 'Pausado'}
          {batch.status === 'cancelled' && 'Cancelado'}
        </span>
      </div>

      {/* Progress Bar */}
      {batch.status === 'in_progress' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Progreso</span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-venezia-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
            <p className="text-sm font-medium">{batch.assigned_to || 'Sin asignar'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fecha Inicio</p>
            <p className="text-sm font-medium">
              {new Date(batch.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {isRunning && (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tiempo Transcurrido</p>
              <p className="text-sm font-medium text-venezia-600 dark:text-venezia-400">
                {formatTime(elapsedTime)}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Eficiencia</p>
            <p className="text-sm font-medium">
              {progressPercentage <= 100 ? 
                <span className="text-green-600">En tiempo</span> : 
                <span className="text-red-600">Retrasado</span>
              }
            </p>
          </div>
        </div>
      </div>

      {/* Ingredient Availability Alert */}
      {!availability.available && batch.status === 'pending' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Ingredientes Insuficientes
              </p>
              <ul className="mt-1 text-xs text-red-700 dark:text-red-300 space-y-1">
                {availability.missing.map((item, index) => (
                  <li key={index}>
                    {item.name}: Necesita {item.needed}, disponible {item.available}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {batch.notes && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{batch.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {batch.status === 'pending' && (
            <Button
              onClick={() => handleStatusChange('in_progress')}
              variant="primary"
              size="sm"
              icon={Play}
              disabled={!availability.available}
            >
              Iniciar
            </Button>
          )}
          
          {batch.status === 'in_progress' && (
            <>
              <Button
                onClick={() => handleStatusChange('paused')}
                variant="outline"
                size="sm"
                icon={Pause}
              >
                Pausar
              </Button>
              <Button
                onClick={() => handleStatusChange('completed')}
                variant="success"
                size="sm"
                icon={CheckCircle}
              >
                Completar
              </Button>
            </>
          )}
          
          {batch.status === 'paused' && (
            <Button
              onClick={() => handleStatusChange('in_progress')}
              variant="primary"
              size="sm"
              icon={Play}
            >
              Reanudar
            </Button>
          )}
          
          {(batch.status === 'pending' || batch.status === 'paused') && (
            <Button
              onClick={() => handleStatusChange('cancelled')}
              variant="danger"
              size="sm"
              icon={XCircle}
            >
              Cancelar
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={BarChart}
        >
          Ver Métricas
        </Button>
      </div>
    </div>
  );
};

export default BatchTracking;