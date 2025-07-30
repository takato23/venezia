import React, { useState } from 'react';
import { 
  Package,
  Plus,
  X,
  AlertCircle,
  Calendar,
  User,
  Hash,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';

const BatchAssignment = ({ 
  order, 
  onAssignBatch,
  onCancel,
  users = [],
  existingBatches = []
}) => {
  const [batches, setBatches] = useState(() => {
    if (existingBatches.length > 0) {
      return existingBatches;
    }
    
    // Generar número de lote automático
    const batchNumber = `L${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    return [{
      id: Date.now(),
      batch_number: batchNumber,
      quantity: order.quantity || 1,
      assigned_to: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'pending'
    }];
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Calculate remaining quantity
  const totalAssigned = batches.reduce((sum, batch) => sum + (parseFloat(batch.quantity) || 0), 0);
  const remainingQuantity = order.quantity - totalAssigned;

  const handleBatchChange = (index, field, value) => {
    setBatches(prev => prev.map((batch, i) => {
      if (i === index) {
        return { ...batch, [field]: value };
      }
      return batch;
    }));
    
    // Clear error for this field
    const errorKey = `batch_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const addBatch = () => {
    // Generar número de lote automático
    const batchNumber = `L${new Date().getFullYear()}-${String(Date.now() + Math.random() * 1000).slice(-6)}`;
    
    setBatches(prev => [...prev, {
      id: Date.now() + Math.random(),
      batch_number: batchNumber,
      quantity: remainingQuantity > 0 ? remainingQuantity : 1,
      assigned_to: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'pending'
    }]);
  };

  const removeBatch = (index) => {
    setBatches(prev => prev.filter((_, i) => i !== index));
  };

  const validateBatches = () => {
    const newErrors = {};
    let isValid = true;

    if (batches.length === 0) {
      newErrors.general = 'Debe agregar al menos un lote';
      isValid = false;
    }

    batches.forEach((batch, index) => {
      if (!batch.batch_number || !batch.batch_number.trim()) {
        newErrors[`batch_${index}_batch_number`] = 'El número de lote es requerido';
        isValid = false;
      }
      
      const quantity = parseFloat(batch.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors[`batch_${index}_quantity`] = 'La cantidad debe ser un número mayor a 0';
        isValid = false;
      }
      
      if (!batch.assigned_to || !batch.assigned_to.trim()) {
        newErrors[`batch_${index}_assigned_to`] = 'Debe asignar un responsable';
        isValid = false;
      }

      if (!batch.start_date) {
        newErrors[`batch_${index}_start_date`] = 'La fecha de inicio es requerida';
        isValid = false;
      }
    });

    // Verificar que la cantidad total asignada coincida con la orden
    const calculatedTotal = batches.reduce((sum, batch) => {
      const qty = parseFloat(batch.quantity);
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);

    if (Math.abs(calculatedTotal - order.quantity) > 0.01) {
      newErrors.general = `La cantidad total asignada (${calculatedTotal.toFixed(2)}) no coincide con la cantidad de la orden (${order.quantity})`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateBatches()) return;

    setSaving(true);
    try {
      // Preparar los datos de lotes con valores por defecto
      const batchesToSend = batches.map(batch => ({
        batch_number: batch.batch_number.trim(),
        quantity: parseFloat(batch.quantity) || 0,
        assigned_to: batch.assigned_to || '',
        start_date: batch.start_date || new Date().toISOString().split('T')[0],
        notes: batch.notes || ''
      }));

      console.log('Enviando lotes:', { orderId: order.id, batches: batchesToSend });
      
      await onAssignBatch(order.id, batchesToSend);
    } catch (error) {
      console.error('Error assigning batches:', error);
      setErrors({ 
        general: `Error al asignar los lotes: ${error.message || error.toString()}` 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Asignación de Lotes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Orden #{order.order_number || order.id} - {order.recipe?.name || order.product_name}
            </p>
          </div>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={onCancel}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Volver
            </Button>
          )}
        </div>
      </div>

      {errors.general && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errors.general}</span>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad Total</p>
            <p className="font-medium text-gray-900 dark:text-white">{order.quantity} {order.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad Asignada</p>
            <p className={`font-medium ${
              Math.abs(totalAssigned - order.quantity) < 0.01 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {totalAssigned} {order.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad Restante</p>
            <p className={`font-medium ${
              remainingQuantity === 0 
                ? 'text-gray-500 dark:text-gray-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {remainingQuantity.toFixed(2)} {order.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Número de Lotes</p>
            <p className="font-medium text-gray-900 dark:text-white">{batches.length}</p>
          </div>
        </div>
      </div>

      {/* Batch List */}
      <div className="space-y-4 mb-6">
        {batches.map((batch, index) => (
          <div 
            key={batch.id}
            className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Lote {index + 1}
              </h4>
              {batches.length > 1 && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={X}
                  onClick={() => removeBatch(index)}
                  className="text-red-600 hover:text-red-700"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label="Número de Lote"
                value={batch.batch_number}
                onChange={(e) => handleBatchChange(index, 'batch_number', e.target.value)}
                placeholder="Ej: L2024-001"
                error={errors[`batch_${index}_batch_number`]}
                icon={Hash}
                required
              />

              <Input
                label="Cantidad"
                type="number"
                step="0.01"
                value={batch.quantity}
                onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                error={errors[`batch_${index}_quantity`]}
                required
              />

              <Select
                label="Responsable"
                value={batch.assigned_to}
                onChange={(e) => handleBatchChange(index, 'assigned_to', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar' },
                  ...users.map(u => ({
                    value: u.id || u.name,
                    label: u.name || u.email
                  }))
                ]}
                error={errors[`batch_${index}_assigned_to`]}
                icon={User}
                required
              />

              <Input
                label="Fecha de Inicio"
                type="date"
                value={batch.start_date}
                onChange={(e) => handleBatchChange(index, 'start_date', e.target.value)}
                error={errors[`batch_${index}_start_date`]}
                icon={Calendar}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="mt-3">
              <Input
                label="Notas"
                value={batch.notes}
                onChange={(e) => handleBatchChange(index, 'notes', e.target.value)}
                placeholder="Notas o instrucciones especiales para este lote (opcional)"
              />
            </div>

            {batch.status !== 'pending' && (
              <div className="mt-3">
                <Badge 
                  variant={
                    batch.status === 'completed' ? 'success' : 
                    batch.status === 'in_progress' ? 'warning' : 
                    'default'
                  }
                  size="sm"
                >
                  {batch.status === 'completed' ? 'Completado' : 
                   batch.status === 'in_progress' ? 'En Proceso' : 
                   'Pendiente'}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={addBatch}
            disabled={remainingQuantity <= 0}
          >
            Agregar Lote
          </Button>
          
          {remainingQuantity > 0 && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Faltan {remainingQuantity.toFixed(2)} {order.unit} por asignar
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {remainingQuantity === 0 && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Cantidad completa
            </span>
          )}
          
          <Button
            variant="primary"
            icon={CheckCircle}
            onClick={handleSubmit}
            loading={saving}
            disabled={batches.length === 0 || saving}
          >
            {saving ? 'Asignando...' : 'Asignar Lotes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BatchAssignment;