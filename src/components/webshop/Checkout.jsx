import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Store,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import ProductImagePlaceholder from '../ui/ProductImagePlaceholder';

const Checkout = ({ cart, shopConfig, onBack, onOrderComplete }) => {
  const { success, error: showError, info } = useToast();
  
  // Estados del formulario
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryType: 'pickup', // pickup o delivery
    deliveryAddress: '',
    paymentMethod: 'cash', // cash, card, transfer
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Calcular totales
  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.webPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  const getDeliveryFee = () => {
    return orderData.deliveryType === 'delivery' ? (shopConfig.deliveryFee || 0) : 0;
  };
  
  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };
  
  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!orderData.customerName.trim()) {
      newErrors.customerName = 'El nombre es requerido';
    }
    
    if (!orderData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(orderData.customerEmail)) {
      newErrors.customerEmail = 'Email inválido';
    }
    
    if (!orderData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es requerido';
    }
    
    if (orderData.deliveryType === 'delivery' && !orderData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'La dirección de entrega es requerida';
    }
    
    // Validar monto mínimo para delivery
    if (orderData.deliveryType === 'delivery' && shopConfig.minimumOrderAmount) {
      if (getSubtotal() < shopConfig.minimumOrderAmount) {
        newErrors.minimumAmount = `El monto mínimo para delivery es $${shopConfig.minimumOrderAmount}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  // Enviar orden
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Formulario incompleto', 'Por favor completa todos los campos requeridos');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar datos de la orden
      const orderItems = cart.map(item => ({
        productId: item.id,
        productName: item.product?.name || item.name,
        quantity: item.quantity,
        unitPrice: item.webPrice || item.price || 0,
        subtotal: (item.webPrice || item.price || 0) * item.quantity
      }));
      
      const response = await fetch('/api/public/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...orderData,
          items: orderItems,
          subtotal: getSubtotal(),
          deliveryFee: getDeliveryFee(),
          total: getTotal()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderNumber(data.order.order_number);
        setOrderSuccess(true);
        
        // Limpiar carrito
        localStorage.removeItem('venezia_cart');
        
        // Notificar al componente padre
        if (onOrderComplete) {
          onOrderComplete(data.order);
        }
        
        success('¡Orden enviada!', 'Tu pedido ha sido recibido correctamente');
      } else {
        const errorData = await response.json();
        showError('Error al enviar orden', errorData.error || 'Intenta nuevamente');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      showError('Error de conexión', 'No se pudo enviar la orden. Intenta nuevamente');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Si la orden fue exitosa, mostrar confirmación
  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Orden confirmada!
        </h2>
        <p className="text-gray-600 mb-4">
          Tu pedido ha sido recibido y está siendo procesado
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Número de orden:</p>
          <p className="text-xl font-bold text-venezia-600">{orderNumber}</p>
        </div>
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <p>📧 Te enviamos un email de confirmación a {orderData.customerEmail}</p>
          <p>📱 Recibirás actualizaciones por WhatsApp al {orderData.customerPhone}</p>
          {orderData.deliveryType === 'pickup' ? (
            <p>🏪 Tu pedido estará listo para retirar en aproximadamente 30 minutos</p>
          ) : (
            <p>🚚 Tu pedido será entregado en {orderData.deliveryAddress}</p>
          )}
        </div>
        <Button
          onClick={() => window.location.href = '/webshop'}
          className="bg-venezia-600 hover:bg-venezia-700"
        >
          Volver a la tienda
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al carrito
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Finalizar pedido</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Información de contacto</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Nombre completo"
                    value={orderData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    error={errors.customerName}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={orderData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    error={errors.customerEmail}
                    required
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    value={orderData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    error={errors.customerPhone}
                    placeholder="+54 11 1234-5678"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Método de entrega */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Método de entrega</h2>
              <div className="space-y-3">
                <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickup"
                    checked={orderData.deliveryType === 'pickup'}
                    onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <Store className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium">Retiro en tienda</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {shopConfig.storeAddress || 'Dirección de la tienda'}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Sin costo adicional</p>
                  </div>
                </label>
                
                {shopConfig.deliveryEnabled && (
                  <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={orderData.deliveryType === 'delivery'}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <Truck className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="font-medium">Delivery a domicilio</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Costo: ${shopConfig.deliveryFee || 0}
                      </p>
                      {shopConfig.minimumOrderAmount && (
                        <p className="text-sm text-gray-600">
                          Pedido mínimo: ${shopConfig.minimumOrderAmount}
                        </p>
                      )}
                    </div>
                  </label>
                )}
              </div>
              
              {orderData.deliveryType === 'delivery' && (
                <div className="mt-4">
                  <Input
                    label="Dirección de entrega"
                    value={orderData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    error={errors.deliveryAddress}
                    placeholder="Calle, número, piso, depto, etc."
                    required
                  />
                </div>
              )}
              
              {errors.minimumAmount && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.minimumAmount}
                </div>
              )}
            </div>
            
            {/* Método de pago */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Método de pago</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={orderData.paymentMethod === 'cash'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">Efectivo</span>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={orderData.paymentMethod === 'card'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="mr-3"
                  />
                  <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="font-medium">Tarjeta de crédito/débito</span>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={orderData.paymentMethod === 'transfer'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium">Transferencia bancaria</span>
                </label>
              </div>
            </div>
            
            {/* Notas adicionales */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Notas adicionales (opcional)</h2>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-venezia-500"
                rows="3"
                value={orderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Instrucciones especiales, preferencias, etc."
              />
            </div>
          </form>
        </div>
        
        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
            
            {/* Items */}
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-start space-x-3 pb-3 border-b">
                  <ProductImagePlaceholder 
                    productName={item.product?.name || item.name}
                    size="sm"
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {item.product?.name || item.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x ${(item.webPrice || item.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    ${((item.webPrice || item.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Totales */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              {orderData.deliveryType === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>${getDeliveryFee().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-venezia-600">${getTotal().toFixed(2)}</span>
              </div>
            </div>
            
            {/* Tiempo estimado */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  Tiempo estimado: {orderData.deliveryType === 'pickup' ? '30-45 min' : '45-60 min'}
                </span>
              </div>
            </div>
            
            {/* Botón de confirmar */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="w-full mt-6 bg-venezia-600 hover:bg-venezia-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar pedido'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;