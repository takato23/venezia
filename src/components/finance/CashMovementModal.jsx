import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  Tag,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';

const CashMovementModal = ({ 
  type = 'income',
  movement, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    type: type,
    amount: '',
    description: '',
    category: type === 'income' ? 'sales' : 'expense',
    payment_method: 'cash',
    reference: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (movement) {
      setFormData({
        type: movement.type,
        amount: movement.amount.toString(),
        description: movement.description || '',
        category: movement.category || (type === 'income' ? 'sales' : 'expense'),
        payment_method: movement.payment_method || 'cash',
        reference: movement.reference || '',
        notes: movement.notes || ''
      });
    }
  }, [movement, type]);

  const incomeCategories = [
    { value: 'sales', label: 'Ventas', icon: ShoppingCart },
    { value: 'service', label: 'Servicios', icon: Package },
    { value: 'other', label: 'Otros Ingresos', icon: DollarSign }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: Banknote },
    { value: 'card', label: 'Tarjeta', icon: CreditCard },
    { value: 'transfer', label: 'Transferencia', icon: ArrowUpRight },
    { value: 'check', label: 'Cheque', icon: FileText }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Ingrese un monto válido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
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
  };

  const isIncome = formData.type === 'income';

  return (
    <Modal isOpen onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {movement ? 'Editar' : 'Registrar'} {isIncome ? 'Ingreso' : 'Egreso'}
            </h2>
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción *
            </label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={isIncome ? "Ej: Venta de productos" : "Ej: Pago a proveedor"}
              error={errors.description}
            />
          </div>

          {/* Category (only for income) */}
          {isIncome && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {incomeCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

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

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Referencia
            </label>
            <Input
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder={isIncome ? "Ej: Factura #1234" : "Ej: Orden de compra #5678"}
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
              placeholder="Información adicional..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={isIncome ? "success" : "primary"}
            >
              <Save className="h-4 w-4 mr-2" />
              {movement ? 'Actualizar' : 'Registrar'} {isIncome ? 'Ingreso' : 'Egreso'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CashMovementModal;