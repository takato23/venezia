import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  ShoppingBag,
  Clock,
  MapPin,
  User,
  Phone,
  Send,
  Check,
  AlertCircle,
  X,
  Plus,
  Minus,
  ChevronRight
} from 'lucide-react';

const WhatsAppOrder = ({ cart, isOpen, onClose, shopConfig }) => {
  const [orderType, setOrderType] = useState('pickup'); // pickup o delivery
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [pickupTime, setPickupTime] = useState('30min');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Obtener el total del carrito
  const getTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.webPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  // Formatear el pedido para WhatsApp
  const formatWhatsAppMessage = () => {
    const phoneNumber = shopConfig?.whatsappNumber || '5491123456789';
    let message = `🍦 *NUEVO PEDIDO - Heladería*\n\n`;
    
    // Información del cliente
    message += `👤 *Cliente:* ${customerInfo.name}\n`;
    message += `📱 *Teléfono:* ${customerInfo.phone}\n\n`;
    
    // Tipo de pedido
    if (orderType === 'delivery') {
      message += `🚚 *DELIVERY*\n`;
      message += `📍 *Dirección:* ${customerInfo.address}\n\n`;
    } else {
      message += `🏪 *RETIRO EN LOCAL*\n`;
      message += `⏰ *Horario:* ${pickupTime === 'ahora' ? 'Lo antes posible' : `En ${pickupTime}`}\n\n`;
    }
    
    // Productos
    message += `📋 *PEDIDO:*\n`;
    message += `------------------------\n`;
    cart.forEach(item => {
      const itemName = item.product?.name || item.name;
      const itemPrice = item.webPrice || item.price || 0;
      message += `• ${item.quantity}x ${itemName}\n`;
      message += `  $${(itemPrice * item.quantity).toFixed(2)}\n`;
    });
    message += `------------------------\n`;
    message += `💰 *TOTAL: $${getTotal().toFixed(2)}*\n\n`;
    
    // Notas adicionales
    if (customerInfo.notes) {
      message += `📝 *Notas:* ${customerInfo.notes}\n\n`;
    }
    
    message += `_Enviado desde la web_`;
    
    // Codificar para URL de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };
  
  const handleSendOrder = () => {
    // Validar campos requeridos
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Por favor completa tu nombre y teléfono');
      return;
    }
    
    if (orderType === 'delivery' && !customerInfo.address) {
      alert('Por favor ingresa tu dirección de entrega');
      return;
    }
    
    // Abrir WhatsApp con el mensaje
    window.open(formatWhatsAppMessage(), '_blank');
    setShowConfirmation(true);
    
    // Limpiar carrito después de 3 segundos
    setTimeout(() => {
      localStorage.removeItem('cart');
      window.location.reload();
    }, 3000);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {!showConfirmation ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Pedido por WhatsApp</h2>
                      <p className="text-green-100">Rápido y fácil</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Tipo de pedido */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">¿Cómo querés recibir tu pedido?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType('pickup')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        orderType === 'pickup'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ShoppingBag className={`h-8 w-8 mx-auto mb-2 ${
                        orderType === 'pickup' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">Retiro en local</p>
                      <p className="text-sm text-gray-600">Sin costo adicional</p>
                    </button>
                    
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        orderType === 'delivery'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <MapPin className={`h-8 w-8 mx-auto mb-2 ${
                        orderType === 'delivery' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-gray-600">+${shopConfig?.deliveryFee || 150}</p>
                    </button>
                  </div>
                </div>
                
                {/* Horario de retiro */}
                {orderType === 'pickup' && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">¿Cuándo lo retirás?</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {['ahora', '30min', '1hora'].map((time) => (
                        <button
                          key={time}
                          onClick={() => setPickupTime(time)}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            pickupTime === time
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time === 'ahora' ? 'Lo antes posible' : `En ${time}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información del cliente */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Tus datos</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Juan Pérez"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="11 1234-5678"
                      />
                    </div>
                  </div>
                  
                  {orderType === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección de entrega
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Calle 123, Barrio"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows="3"
                      placeholder="Ej: Timbre rojo, sin azúcar, etc."
                    />
                  </div>
                </div>
                
                {/* Resumen del pedido */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Resumen del pedido</h3>
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.product?.name || item.name}
                        </span>
                        <span className="font-medium">
                          ${((item.webPrice || item.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600">Envío</span>
                        <span className="font-medium">${shopConfig?.deliveryFee || 150}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-green-600">
                        ${(getTotal() + (orderType === 'delivery' ? (shopConfig?.deliveryFee || 150) : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Información importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Al hacer clic en "Enviar pedido", se abrirá WhatsApp con tu pedido. 
                      Confirma el envío del mensaje para completar tu orden.
                    </span>
                  </p>
                </div>
                
                {/* Botón de envío */}
                <button
                  onClick={handleSendOrder}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  Enviar pedido por WhatsApp
                </button>
              </div>
            </>
          ) : (
            // Pantalla de confirmación
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <Check className="h-12 w-12 text-green-600" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ¡Pedido enviado!
              </h2>
              
              <p className="text-gray-600 mb-8">
                Tu pedido fue enviado por WhatsApp. En breve recibirás la confirmación.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-xl p-6 text-left max-w-sm mx-auto"
              >
                <h3 className="font-semibold text-gray-800 mb-3">Próximos pasos:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">1.</span>
                    Revisa tu WhatsApp y confirma el mensaje
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">2.</span>
                    Espera la confirmación de la heladería
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">3.</span>
                    {orderType === 'pickup' 
                      ? 'Retira tu pedido en el horario acordado'
                      : 'Recibe tu pedido en la puerta de tu casa'
                    }
                  </li>
                </ol>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WhatsAppOrder;