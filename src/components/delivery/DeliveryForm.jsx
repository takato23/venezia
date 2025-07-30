import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Save, 
  X,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  Package,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FormError from '../ui/FormError';

const DeliveryForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  delivery = null,
  drivers = [],
  orders = []
}) => {
  const [formData, setFormData] = useState({
    order_id: '',
    driver_id: '',
    customer_name: '',
    customer_phone: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: 'Buenos Aires',
      instructions: ''
    },
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    priority: 'normal',
    estimated_time: '30-45 min',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  // Time slot options
  const timeSlots = [
    { value: '09:00-11:00', label: '9:00 - 11:00' },
    { value: '11:00-13:00', label: '11:00 - 13:00' },
    { value: '13:00-15:00', label: '13:00 - 15:00' },
    { value: '15:00-17:00', label: '15:00 - 17:00' },
    { value: '17:00-19:00', label: '17:00 - 19:00' },
    { value: '19:00-21:00', label: '19:00 - 21:00' }
  ];

  useEffect(() => {
    if (delivery) {
      setFormData({
        order_id: delivery.order_id || '',
        driver_id: delivery.driver_id || '',
        customer_name: delivery.customer_name || '',
        customer_phone: delivery.customer_phone || '',
        address: delivery.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: 'Buenos Aires',
          instructions: ''
        },
        scheduled_date: delivery.scheduled_date ? 
          new Date(delivery.scheduled_date).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        scheduled_time: delivery.scheduled_time || '',
        priority: delivery.priority || 'normal',
        estimated_time: delivery.estimated_time || '30-45 min',
        notes: delivery.notes || ''
      });
    } else {
      // Reset form for new delivery
      setFormData({
        order_id: '',
        driver_id: '',
        customer_name: '',
        customer_phone: '',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: 'Buenos Aires',
          instructions: ''
        },
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '',
        priority: 'normal',
        estimated_time: '30-45 min',
        notes: ''
      });
    }
    setErrors({});
  }, [delivery]);

  // Update form when order is selected
  useEffect(() => {
    if (formData.order_id) {
      const order = orders.find(o => o.id === parseInt(formData.order_id));
      if (order) {
        setSelectedOrder(order);
        setFormData(prev => ({
          ...prev,
          customer_name: order.customer_name || prev.customer_name,
          customer_phone: order.customer_phone || prev.customer_phone,
          address: order.delivery_address || prev.address
        }));
      }
    } else {
      setSelectedOrder(null);
    }
  }, [formData.order_id, orders]);

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

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
    
    // Clear address errors
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Solo campos básicos obligatorios para simplificar
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'El nombre del cliente es requerido';
    }

    if (!formData.address.street.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    // Driver es opcional - se puede asignar después
    // Teléfono es opcional - no todos los clientes lo tienen
    // Fecha se autogenera para hoy si no se especifica

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        status: delivery?.status || 'pending',
        created_by: delivery?.created_by || 'current_user',
        // Preserve important fields when editing
        ...(delivery && {
          items: delivery.items,
          total_amount: delivery.total_amount,
          order_number: delivery.order_number,
          created_at: delivery.created_at
        })
      };

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      setErrors({ general: 'Error al guardar la entrega' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          {delivery ? 'Editar Entrega' : 'Nueva Entrega'}
        </div>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <FormError error={errors.general} variant="block" />
        )}

        {/* Order Selection */}
        {!delivery && orders.length > 0 && (
          <Select
            label="Orden de Venta"
            name="order_id"
            value={formData.order_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Seleccionar orden (opcional)' },
              ...orders.map(o => ({
                value: o.id.toString(),
                label: `#${o.id} - ${o.customer_name} - $${o.total}`
              }))
            ]}
            icon={Package}
          />
        )}

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4" />
            Información del Cliente
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Nombre completo"
              error={errors.customer_name}
              required
            />

            <Input
              label="Teléfono (opcional)"
              name="customer_phone"
              type="tel"
              value={formData.customer_phone}
              onChange={handleChange}
              placeholder="+54 11 1234-5678"
              error={errors.customer_phone}
              icon={Phone}
            />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Dirección de Entrega
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Calle"
                name="street"
                value={formData.address.street}
                onChange={handleAddressChange}
                placeholder="Av. Corrientes"
                error={errors.address}
                required
              />
            </div>

            <Input
              label="Número"
              name="number"
              value={formData.address.number}
              onChange={handleAddressChange}
              placeholder="1234"
            />

            <Input
              label="Barrio"
              name="neighborhood"
              value={formData.address.neighborhood}
              onChange={handleAddressChange}
              placeholder="Palermo"
            />

            <Input
              label="Ciudad"
              name="city"
              value={formData.address.city}
              onChange={handleAddressChange}
              placeholder="Buenos Aires"
            />
          </div>

          <Input
            label="Instrucciones de entrega"
            name="instructions"
            value={formData.address.instructions}
            onChange={handleAddressChange}
            placeholder="Timbre 2B, portón negro"
            multiline
            rows={2}
          />
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Programación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Fecha"
              name="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={handleChange}
              error={errors.scheduled_date}
              min={new Date().toISOString().split('T')[0]}
              required
            />

            <Select
              label="Franja horaria"
              name="scheduled_time"
              value={formData.scheduled_time}
              onChange={handleChange}
              options={[
                { value: '', label: 'Seleccionar' },
                ...timeSlots
              ]}
              icon={Clock}
            />

            <Select
              label="Prioridad"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* Driver Assignment */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Asignación
          </h3>
          
          <Select
            label="Repartidor (opcional)"
            name="driver_id"
            value={formData.driver_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'Sin asignar (se puede asignar después)' },
              ...drivers.map(d => ({
                value: d.id.toString(),
                label: `${d.name} ${d.available ? '' : '(No disponible)'}`
              }))
            ]}
            icon={User}
          />

          <Input
            label="Tiempo estimado de entrega"
            name="estimated_time"
            value={formData.estimated_time}
            onChange={handleChange}
            placeholder="30-45 min"
            icon={Clock}
          />
        </div>

        {/* Notes */}
        <Input
          label="Notas"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Instrucciones especiales o comentarios"
          multiline
          rows={3}
          icon={MessageSquare}
        />

        {/* Order Summary if selected */}
        {selectedOrder && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Resumen del Pedido
            </h3>
            <div className="space-y-2 text-sm">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span>${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t dark:border-gray-600 flex justify-between font-medium">
                <span>Total</span>
                <span className="text-venezia-600 dark:text-venezia-400">
                  ${selectedOrder.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

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
            {delivery ? 'Actualizar' : 'Crear'} Entrega
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DeliveryForm;