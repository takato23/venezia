import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  DollarSign,
  X,
  Plus,
  Minus,
  Percent,
  User,
  Phone,
  MapPin,
  Clock,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const CartSummary = ({ 
  cart = [], 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout,
  onClearCart,
  onApplyDiscount,
  discount = 0,
  paymentMethods = [],
  isMobile = false,
  onClose
}) => {
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'amount'
  const [discountValue, setDiscountValue] = useState('');

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percent' 
    ? (subtotal * (parseFloat(discountValue) || 0) / 100)
    : (parseFloat(discountValue) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyDiscount = () => {
    onApplyDiscount({
      type: discountType,
      value: parseFloat(discountValue) || 0,
      amount: discountAmount
    });
  };

  const handleCheckout = () => {
    onCheckout({
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod: selectedPaymentMethod,
      customer: showCustomerInfo ? customerData : null
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold">Carrito ({cart.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Vaciar carrito"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Carrito vacío</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  {item.flavors && item.flavors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Sabores: {item.flavors.map(f => f.name).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Info Section */}
      {cart.length > 0 && (
        <div className="border-t dark:border-gray-700 p-4">
          <button
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Información del Cliente</span>
            </div>
            <ChevronDown className={clsx(
              'w-4 h-4 transition-transform',
              showCustomerInfo && 'rotate-180'
            )} />
          </button>
          
          {showCustomerInfo && (
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Nombre del cliente"
                value={customerData.name}
                onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                icon={User}
              />
              <Input
                placeholder="Teléfono"
                value={customerData.phone}
                onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                icon={Phone}
              />
              <Input
                placeholder="Dirección de entrega"
                value={customerData.address}
                onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                icon={MapPin}
              />
              <textarea
                placeholder="Notas del pedido"
                value={customerData.notes}
                onChange={(e) => setCustomerData({...customerData, notes: e.target.value})}
                className="w-full px-3 py-2 text-sm border rounded-md resize-none"
                rows="2"
              />
            </div>
          )}
        </div>
      )}

      {/* Discount Section */}
      {cart.length > 0 && (
        <div className="border-t dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Descuento</span>
          </div>
          <div className="flex gap-2">
            <Select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-24"
              options={[
                { value: 'percent', label: '%' },
                { value: 'amount', label: '$' }
              ]}
            />
            <Input
              type="number"
              placeholder="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleApplyDiscount}
              size="sm"
              variant="outline"
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {/* Summary & Checkout */}
      {cart.length > 0 && (
        <div className="border-t dark:border-gray-700 p-4 space-y-3">
          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Método de Pago
            </label>
            <Select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'Efectivo' },
                { value: 'card', label: 'Tarjeta' },
                { value: 'transfer', label: 'Transferencia' },
                { value: 'mercadopago', label: 'MercadoPago' }
              ]}
              icon={CreditCard}
            />
          </div>

          {/* Totals */}
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span className="text-venezia-600">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            variant="primary"
            className="w-full"
            icon={CreditCard}
          >
            Procesar Venta
          </Button>
        </div>
      )}
    </div>
  );
};

export default CartSummary;