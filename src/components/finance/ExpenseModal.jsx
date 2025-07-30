import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar,
  FileText,
  Tag,
  Users,
  Package,
  Home,
  Zap,
  Droplet,
  Wifi,
  Phone,
  Car,
  ShoppingBag,
  Wrench,
  Minus
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';

const ExpenseModal = ({ 
  expense, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'supplier',
    sub_category: '',
    payment_method: 'cash',
    provider: '',
    invoice_number: '',
    due_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        type: 'expense',
        amount: expense.amount.toString(),
        description: expense.description || '',
        category: expense.category || 'supplier',
        sub_category: expense.sub_category || '',
        payment_method: expense.payment_method || 'cash',
        provider: expense.provider || '',
        invoice_number: expense.invoice_number || '',
        due_date: expense.due_date || '',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const expenseCategories = [
    { 
      value: 'supplier', 
      label: 'Proveedores', 
      icon: Package,
      subCategories: ['Materia prima', 'Insumos', 'Envases', 'Otros']
    },
    { 
      value: 'salary', 
      label: 'Sueldos', 
      icon: Users,
      subCategories: ['Salarios', 'Cargas sociales', 'Aguinaldo', 'Vacaciones']
    },
    { 
      value: 'rent', 
      label: 'Alquiler', 
      icon: Home,
      subCategories: ['Local comercial', 'Depósito', 'Otros']
    },
    { 
      value: 'utilities', 
      label: 'Servicios', 
      icon: Zap,
      subCategories: ['Electricidad', 'Gas', 'Agua', 'Internet', 'Teléfono']
    },
    { 
      value: 'maintenance', 
      label: 'Mantenimiento', 
      icon: Wrench,
      subCategories: ['Equipos', 'Local', 'Vehículos', 'Otros']
    },
    { 
      value: 'transport', 
      label: 'Transporte', 
      icon: Car,
      subCategories: ['Combustible', 'Peajes', 'Estacionamiento', 'Fletes']
    },
    { 
      value: 'marketing', 
      label: 'Marketing', 
      icon: ShoppingBag,
      subCategories: ['Publicidad', 'Promociones', 'Redes sociales', 'Otros']
    },
    { 
      value: 'other', 
      label: 'Otros', 
      icon: Minus,
      subCategories: ['Gastos varios', 'Imprevistos']
    }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'check', label: 'Cheque' }
  ];

  const selectedCategory = expenseCategories.find(cat => cat.value === formData.category);
  const CategoryIcon = selectedCategory?.icon || Package;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Ingrese un monto válido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.category) {
      newErrors.category = 'Seleccione una categoría';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        amount: parseFloat(formData.amount)
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Reset subcategory when category changes
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        sub_category: ''
      }));
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Minus className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {expense ? 'Editar' : 'Registrar'} Egreso
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="pl-10"
                  error={errors.amount}
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método de Pago
              </label>
              <Select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción *
            </label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ej: Compra de insumos, Pago de servicios..."
              error={errors.description}
            />
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría *
              </label>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
              >
                {expenseCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>

            {selectedCategory?.subCategories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subcategoría
                </label>
                <Select
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar...</option>
                  {selectedCategory.subCategories.map(subCat => (
                    <option key={subCat} value={subCat}>
                      {subCat}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Provider and Invoice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor/Beneficiario
              </label>
              <Input
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                placeholder="Nombre del proveedor o beneficiario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Factura/Comprobante
              </label>
              <Input
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="Ej: FC-A-0001-00012345"
              />
            </div>
          </div>

          {/* Due Date (for accounts payable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de vencimiento (si aplica)
            </label>
            <Input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas adicionales
            </label>
            <TextArea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Información adicional sobre el gasto..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCategory?.label}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
              >
                <Save className="h-4 w-4 mr-2" />
                {expense ? 'Actualizar' : 'Registrar'} Egreso
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseModal;