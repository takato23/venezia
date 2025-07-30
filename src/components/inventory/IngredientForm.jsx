import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Save, 
  X,
  AlertCircle,
  Calendar,
  DollarSign,
  Weight,
  Droplet,
  Building,
  Info,
  Zap,
  TrendingUp,
  Shield,
  MapPin,
  Calculator,
  Eye,
  EyeOff
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const IngredientForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  ingredient = null,
  suppliers = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit_cost: 0,
    supplier_id: '',
    supplier_name: '',
    expiry_date: '',
    description: '',
    storage_location: '',
    reorder_point: 0,
    reorder_quantity: 0
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewCost, setPreviewCost] = useState(0);

  // Unit options
  const unitOptions = [
    { value: 'kg', label: 'Kilogramos (kg)', icon: Weight },
    { value: 'g', label: 'Gramos (g)', icon: Weight },
    { value: 'l', label: 'Litros (l)', icon: Droplet },
    { value: 'ml', label: 'Mililitros (ml)', icon: Droplet },
    { value: 'unidad', label: 'Unidad', icon: Package },
    { value: 'docena', label: 'Docena', icon: Package },
    { value: 'caja', label: 'Caja', icon: Package }
  ];

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name || '',
        unit: ingredient.unit || 'kg',
        current_stock: ingredient.current_stock || 0,
        min_stock: ingredient.min_stock || 0,
        max_stock: ingredient.max_stock || 0,
        unit_cost: ingredient.unit_cost || 0,
        supplier_id: ingredient.supplier_id || '',
        supplier_name: ingredient.supplier_name || '',
        expiry_date: ingredient.expiry_date ? 
          new Date(ingredient.expiry_date).toISOString().split('T')[0] : '',
        description: ingredient.description || '',
        storage_location: ingredient.storage_location || '',
        reorder_point: ingredient.reorder_point || ingredient.min_stock || 0,
        reorder_quantity: ingredient.reorder_quantity || 0
      });
      setShowAdvanced(true); // Show advanced options for existing ingredients
    } else {
      // Reset form for new ingredient
      setFormData({
        name: '',
        unit: 'kg',
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
        unit_cost: 0,
        supplier_id: '',
        supplier_name: '',
        expiry_date: '',
        description: '',
        storage_location: '',
        reorder_point: 0,
        reorder_quantity: 0
      });
      setShowAdvanced(false);
    }
    setErrors({});
    setCurrentStep(1);
  }, [ingredient]);

  // Calculate preview cost when stock and unit cost change
  useEffect(() => {
    const cost = parseFloat(formData.current_stock) * parseFloat(formData.unit_cost);
    setPreviewCost(isNaN(cost) ? 0 : cost);
  }, [formData.current_stock, formData.unit_cost]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.min_stock < 0) {
      newErrors.min_stock = 'El stock mínimo no puede ser negativo';
    }

    if (formData.max_stock < formData.min_stock) {
      newErrors.max_stock = 'El stock máximo debe ser mayor al mínimo';
    }

    if (formData.current_stock < 0) {
      newErrors.current_stock = 'El stock actual no puede ser negativo';
    }

    if (formData.unit_cost < 0) {
      newErrors.unit_cost = 'El costo no puede ser negativo';
    }

    if (formData.reorder_point < 0) {
      newErrors.reorder_point = 'El punto de reorden no puede ser negativo';
    }

    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'La fecha de expiración no puede ser en el pasado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Find supplier name if ID is selected
      const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplier_id));
      const dataToSave = {
        ...formData,
        supplier_name: selectedSupplier ? selectedSupplier.name : formData.supplier_name,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        max_stock: parseFloat(formData.max_stock),
        unit_cost: parseFloat(formData.unit_cost),
        reorder_point: parseFloat(formData.reorder_point) || parseFloat(formData.min_stock),
        reorder_quantity: parseFloat(formData.reorder_quantity) || 0
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      setErrors({ general: 'Error al guardar el ingrediente' });
    } finally {
      setLoading(false);
    }
  };

  const getUnitIcon = () => {
    const selectedUnit = unitOptions.find(u => u.value === formData.unit);
    return selectedUnit ? selectedUnit.icon : Package;
  };

  const UnitIcon = getUnitIcon();

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Información Básica';
      case 2: return 'Control de Stock';
      case 3: return 'Proveedor y Costos';
      default: return 'Información Básica';
    }
  };

  const isStepValid = (step) => {
    switch(step) {
      case 1: return formData.name.trim() && formData.unit;
      case 2: return formData.current_stock >= 0 && formData.min_stock >= 0;
      case 3: return formData.unit_cost >= 0;
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-venezia-100 dark:bg-venezia-900 rounded-lg">
              <Package className="w-5 h-5 text-venezia-600 dark:text-venezia-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {ingredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getStepTitle()}
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => (
              <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step === currentStep 
                  ? 'bg-venezia-600 text-white' 
                  : step < currentStep 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {step < currentStep ? '✓' : step}
              </div>
            ))}
          </div>
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

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-venezia-50 to-blue-50 dark:from-venezia-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-venezia-200 dark:border-venezia-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <UnitIcon className="w-6 h-6 text-venezia-600 dark:text-venezia-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Información del Ingrediente
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comencemos con la información básica del ingrediente
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Nombre del Ingrediente"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Leche entera, Chocolate en polvo..."
                  error={errors.name}
                  required
                  className="text-lg"
                />
                
                <Select
                  label="Unidad de Medida"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  options={unitOptions.map(u => ({
                    value: u.value,
                    label: u.label
                  }))}
                  icon={UnitIcon}
                />
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Descripción (Opcional)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detalles adicionales sobre el ingrediente..."
                  multiline
                  rows={4}
                />
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Tip:</strong> Un nombre descriptivo ayuda a identificar rápidamente el ingrediente en el inventario.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stock Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Control de Inventario
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Define las cantidades para un control eficiente del stock
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stock Essentials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Stock Actual</span>
                </div>
                <Input
                  name="current_stock"
                  type="number"
                  step="0.01"
                  value={formData.current_stock}
                  onChange={handleChange}
                  error={errors.current_stock}
                  placeholder="0.00"
                  className="text-xl font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad disponible ahora
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Stock Mínimo</span>
                </div>
                <Input
                  name="min_stock"
                  type="number"
                  step="0.01"
                  value={formData.min_stock}
                  onChange={handleChange}
                  error={errors.min_stock}
                  placeholder="0.00"
                  className="text-xl font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nivel de alerta de reposición
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Stock Máximo</span>
                </div>
                <Input
                  name="max_stock"
                  type="number"
                  step="0.01"
                  value={formData.max_stock}
                  onChange={handleChange}
                  error={errors.max_stock}
                  placeholder="0.00"
                  className="text-xl font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Capacidad máxima recomendada
                </p>
              </div>
            </div>
            
            {/* Advanced Stock Options */}
            <div className="border-t dark:border-gray-700 pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-venezia-600 dark:text-venezia-400 hover:text-venezia-700 dark:hover:text-venezia-300 transition-colors mb-4"
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
              </button>
              
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Punto de Reorden"
                      name="reorder_point"
                      type="number"
                      step="0.01"
                      value={formData.reorder_point}
                      onChange={handleChange}
                      error={errors.reorder_point}
                      icon={Zap}
                      placeholder={formData.min_stock.toString()}
                      help="Nivel que activa automáticamente una orden de compra"
                    />
                    
                    <Input
                      label="Cantidad de Reorden"
                      name="reorder_quantity"
                      type="number"
                      step="0.01"
                      value={formData.reorder_quantity}
                      onChange={handleChange}
                      icon={Package}
                      help="Cantidad a pedir cuando se alcance el punto de reorden"
                    />
                  </div>
                  
                  <Input
                    label="Ubicación de Almacenamiento"
                    name="storage_location"
                    value={formData.storage_location}
                    onChange={handleChange}
                    placeholder="Ej: Refrigerador 1, Estante A3, Área seca..."
                    icon={MapPin}
                    help="Ubicación física donde se almacena el ingrediente"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Cost and Supplier */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Costos y Proveedor
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Información comercial y de costos del ingrediente
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cost Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-5 h-5 text-venezia-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Información de Costos</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label={`Costo por ${formData.unit}`}
                    name="unit_cost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={handleChange}
                    error={errors.unit_cost}
                    icon={DollarSign}
                    required
                    className="text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Estimado</div>
                  <div className="text-2xl font-bold text-venezia-600 dark:text-venezia-400">
                    ${previewCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.current_stock} {formData.unit} × ${formData.unit_cost}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Supplier Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-5 h-5 text-venezia-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Información del Proveedor</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {suppliers.length > 0 ? (
                    <Select
                      label="Proveedor"
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'Seleccionar proveedor...' },
                        ...suppliers.map(s => ({
                          value: s.id.toString(),
                          label: s.name
                        }))
                      ]}
                      icon={Building}
                    />
                  ) : (
                    <Input
                      label="Nombre del Proveedor"
                      name="supplier_name"
                      value={formData.supplier_name}
                      onChange={handleChange}
                      placeholder="Nombre del proveedor"
                      icon={Building}
                    />
                  )}
                </div>
                
                <Input
                  label="Fecha de Expiración"
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  error={errors.expiry_date}
                  icon={Calendar}
                  min={new Date().toISOString().split('T')[0]}
                  help="Fecha de vencimiento del lote actual"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t dark:border-gray-700">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              icon={X}
            >
              Cancelar
            </Button>
            
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                variant="primary"
                disabled={!isStepValid(currentStep)}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={loading}
                className="bg-gradient-to-r from-venezia-600 to-venezia-700 hover:from-venezia-700 hover:to-venezia-800"
              >
                {ingredient ? 'Actualizar' : 'Crear'} Ingrediente
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default IngredientForm;