import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  Save, 
  X,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Package,
  Hash,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';

const ProductionOrderForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  order = null,
  recipes = [],
  products = [],
  users = []
}) => {
  const [formData, setFormData] = useState({
    recipe_id: '',
    product_id: '',
    quantity: 1,
    unit: 'unidad',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    priority: 'medium',
    assigned_to: '',
    notes: '',
    batch_size: 1,
    estimated_duration: 60
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  // Unit options
  const unitOptions = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramos' },
    { value: 'litro', label: 'Litros' },
    { value: 'docena', label: 'Docenas' },
    { value: 'caja', label: 'Cajas' }
  ];

  useEffect(() => {
    if (order) {
      setFormData({
        recipe_id: order.recipe_id || '',
        product_id: order.product_id || '',
        quantity: order.quantity || 1,
        unit: order.unit || 'unidad',
        scheduled_date: order.scheduled_date ? 
          new Date(order.scheduled_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        scheduled_time: order.scheduled_time || '08:00',
        priority: order.priority || 'medium',
        assigned_to: order.assigned_to || '',
        notes: order.notes || '',
        batch_size: order.batch_size || 1,
        estimated_duration: order.estimated_duration || 60
      });
    } else {
      // Reset form for new order
      setFormData({
        recipe_id: '',
        product_id: '',
        quantity: 1,
        unit: 'unidad',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '08:00',
        priority: 'medium',
        assigned_to: '',
        notes: '',
        batch_size: 1,
        estimated_duration: 60
      });
    }
    setErrors({});
  }, [order]);

  // Update recipe when selected
  useEffect(() => {
    if (formData.recipe_id) {
      const recipe = recipes.find(r => r.id === parseInt(formData.recipe_id));
      setSelectedRecipe(recipe);
      if (recipe) {
        setFormData(prev => ({
          ...prev,
          product_id: recipe.product_id || prev.product_id,
          unit: recipe.yield_unit || prev.unit,
          estimated_duration: recipe.preparation_time || prev.estimated_duration
        }));
      }
    } else {
      setSelectedRecipe(null);
    }
  }, [formData.recipe_id, recipes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipe_id && !formData.product_id) {
      newErrors.recipe_id = 'Debe seleccionar una receta o producto';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (formData.batch_size <= 0) {
      newErrors.batch_size = 'El tamaño de lote debe ser mayor a 0';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'La fecha es requerida';
    }

    if (formData.estimated_duration <= 0) {
      newErrors.estimated_duration = 'La duración debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimates = () => {
    if (!selectedRecipe) return { cost: 0, batches: 1 };

    const batches = Math.ceil(formData.quantity / formData.batch_size);
    const cost = selectedRecipe.total_cost ? 
      (selectedRecipe.total_cost * formData.quantity) / selectedRecipe.yield_quantity : 
      0;

    return { cost, batches };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const estimates = calculateEstimates();
      
      // Get product name from recipe or products
      let productName = '';
      if (formData.recipe_id && selectedRecipe) {
        productName = selectedRecipe.name;
      } else if (formData.product_id && products.length > 0) {
        const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));
        productName = selectedProduct?.name || '';
      }
      
      const dataToSave = {
        ...formData,
        product_name: productName,
        quantity: parseFloat(formData.quantity),
        batch_size: parseFloat(formData.batch_size),
        estimated_duration: parseInt(formData.estimated_duration),
        estimated_cost: estimates.cost,
        estimated_batches: estimates.batches,
        scheduled_datetime: `${formData.scheduled_date}T${formData.scheduled_time}:00`,
        status: order?.status || 'pending',
        created_by: 'current_user' // This should come from auth context
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving production order:', error);
      setErrors({ general: 'Error al guardar la orden de producción' });
    } finally {
      setLoading(false);
    }
  };

  const estimates = calculateEstimates();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          {order ? 'Editar Orden de Producción' : 'Nueva Orden de Producción'}
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Recipe/Product Selection */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Producto a Fabricar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Receta"
              name="recipe_id"
              value={formData.recipe_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Seleccionar receta' },
                ...recipes.map(r => ({
                  value: r.id.toString(),
                  label: `${r.name} (${r.yield_quantity} ${r.yield_unit})`
                }))
              ]}
              error={errors.recipe_id}
              icon={Package}
            />

            <Select
              label="Producto Final"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Seleccionar producto' },
                ...products.map(p => ({
                  value: p.id.toString(),
                  label: p.name
                }))
              ]}
              icon={Package}
              disabled={!!formData.recipe_id}
            />
          </div>

          {selectedRecipe && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Información de la Receta
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Rendimiento: {selectedRecipe.yield_quantity} {selectedRecipe.yield_unit}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Tiempo estimado: {selectedRecipe.preparation_time} minutos
                  </p>
                  {selectedRecipe.total_cost && (
                    <p className="text-blue-700 dark:text-blue-300">
                      Costo por unidad: ${(selectedRecipe.total_cost / selectedRecipe.yield_quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Production Details */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Detalles de Producción
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Cantidad a Producir"
              name="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              icon={Hash}
              required
            />

            <Select
              label="Unidad"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              options={unitOptions}
            />

            <Input
              label="Tamaño de Lote"
              name="batch_size"
              type="number"
              step="0.01"
              value={formData.batch_size}
              onChange={handleChange}
              error={errors.batch_size}
              icon={Package}
            />

            <Input
              label="Duración (min)"
              name="estimated_duration"
              type="number"
              value={formData.estimated_duration}
              onChange={handleChange}
              error={errors.estimated_duration}
              icon={Clock}
            />
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Programación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha Programada"
              name="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={handleChange}
              error={errors.scheduled_date}
              icon={Calendar}
              min={new Date().toISOString().split('T')[0]}
              required
            />

            <Input
              label="Hora"
              name="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={handleChange}
              icon={Clock}
            />

            <Select
              label="Prioridad"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
              icon={AlertTriangle}
            />
          </div>

          <Select
            label="Asignar a"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            options={[
              { value: '', label: 'Sin asignar' },
              ...users.map(u => ({
                value: u.id || u.name,
                label: u.name || u.email
              }))
            ]}
            icon={User}
          />
        </div>

        {/* Estimates */}
        {selectedRecipe && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Estimaciones
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Número de Lotes
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {estimates.batches}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Costo Estimado Total
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  ${estimates.cost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <Input
          label="Notas"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Instrucciones especiales o notas adicionales (opcional)"
          multiline
          rows={3}
          icon={FileText}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            icon={X}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            {order ? 'Actualizar' : 'Crear'} Orden
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionOrderForm;