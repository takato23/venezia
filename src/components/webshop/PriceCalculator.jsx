import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator,
  Plus,
  Minus,
  ShoppingCart,
  Users,
  Gift,
  Info,
  ChevronDown,
  Check,
  Percent
} from 'lucide-react';

const PriceCalculator = ({ products, onAddToCart }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [showPromo, setShowPromo] = useState(false);
  const [groupSize, setGroupSize] = useState(1);
  
  // Precios base por tamaño
  const sizeOptions = [
    { id: 'simple', name: '1 Bocha', price: 300, popular: false },
    { id: 'doble', name: '2 Bochas', price: 450, popular: true },
    { id: 'triple', name: '3 Bochas', price: 600, popular: false },
    { id: 'cuarto', name: '1/4 kg', price: 800, popular: false },
    { id: 'medio', name: '1/2 kg', price: 1500, popular: false },
    { id: 'kilo', name: '1 kg', price: 2800, popular: true }
  ];
  
  // Agregar o quitar items
  const addItem = () => {
    setSelectedItems([...selectedItems, {
      id: Date.now(),
      size: 'doble',
      quantity: 1,
      extras: []
    }]);
  };
  
  const removeItem = (id) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };
  
  const updateItem = (id, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  // Calcular precio de un item
  const getItemPrice = (item) => {
    const sizePrice = sizeOptions.find(s => s.id === item.size)?.price || 0;
    const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0);
    return (sizePrice + extrasPrice) * item.quantity;
  };
  
  // Calcular descuentos
  const getDiscount = () => {
    const subtotal = getSubtotal();
    let discount = 0;
    
    // Descuento por cantidad
    if (selectedItems.length >= 4) {
      discount += subtotal * 0.1; // 10% descuento
    }
    
    // Descuento por grupo grande
    if (groupSize >= 5) {
      discount += subtotal * 0.05; // 5% adicional
    }
    
    // Promo 2x1 los martes (simulado)
    const today = new Date().getDay();
    if (today === 2 && showPromo) { // Martes
      // Aplicar 50% de descuento al ítem más barato
      const prices = selectedItems.map(getItemPrice).sort((a, b) => a - b);
      if (prices.length >= 2) {
        discount += prices[0] * 0.5;
      }
    }
    
    return discount;
  };
  
  const getSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + getItemPrice(item), 0);
  };
  
  const getTotal = () => {
    return getSubtotal() - getDiscount();
  };
  
  // Extras disponibles
  const extras = [
    { id: 'chips', name: 'Chips de chocolate', price: 50 },
    { id: 'nueces', name: 'Nueces', price: 60 },
    { id: 'dulce', name: 'Dulce de leche extra', price: 40 },
    { id: 'cono', name: 'Cono bañado', price: 80 }
  ];
  
  const handleAddAllToCart = () => {
    selectedItems.forEach(item => {
      const size = sizeOptions.find(s => s.id === item.size);
      const product = {
        name: `Helado ${size.name}`,
        price: getItemPrice(item),
        quantity: 1,
        customData: item
      };
      onAddToCart(product, 1);
    });
    
    // Limpiar calculadora
    setSelectedItems([]);
  };
  
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Calculadora de Precios</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Calculá tu pedido
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> al instante</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Armá tu pedido y conocé el precio final con todos los descuentos aplicados
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panel de items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selector de grupo */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-800">¿Para cuántas personas?</span>
                </div>
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                  ))}
                </select>
              </label>
              {groupSize >= 5 && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  ¡5% de descuento por grupo grande aplicado!
                </p>
              )}
            </div>
            
            {/* Lista de items */}
            <AnimatePresence>
              {selectedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      Helado #{index + 1}
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Selector de tamaño */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {sizeOptions.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => updateItem(item.id, 'size', size.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            item.size === size.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-sm">{size.name}</p>
                          <p className="text-lg font-bold text-gray-800">${size.price}</p>
                          {size.popular && (
                            <span className="text-xs text-blue-600">Popular</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cantidad */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                        className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                        className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Extras */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extras (opcional)
                    </label>
                    <div className="space-y-2">
                      {extras.map((extra) => (
                        <label
                          key={extra.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={item.extras.some(e => e.id === extra.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateItem(item.id, 'extras', [...item.extras, extra]);
                                } else {
                                  updateItem(item.id, 'extras', item.extras.filter(e => e.id !== extra.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{extra.name}</span>
                          </div>
                          <span className="font-medium">+${extra.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Precio del item */}
                  <div className="mt-4 pt-4 border-t text-right">
                    <span className="text-lg font-bold text-gray-800">
                      Subtotal: ${getItemPrice(item)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Botón agregar */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Agregar otro helado
            </motion.button>
          </div>
          
          {/* Panel de resumen */}
          <div className="lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Resumen del pedido
              </h3>
              
              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Agregá helados para ver el precio
                </p>
              ) : (
                <>
                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {selectedItems.map((item, index) => {
                      const size = sizeOptions.find(s => s.id === item.size);
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x Helado {size?.name}
                          </span>
                          <span className="font-medium">${getItemPrice(item)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Subtotal */}
                  <div className="py-3 border-t border-b space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${getSubtotal()}</span>
                    </div>
                    
                    {getDiscount() > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-green-600"
                      >
                        <span className="flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          Descuentos
                        </span>
                        <span className="font-medium">-${getDiscount().toFixed(0)}</span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Total */}
                  <div className="mt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="text-lg text-gray-700">Total</span>
                      <span className="text-3xl font-bold text-blue-600">
                        ${getTotal()}
                      </span>
                    </div>
                    {groupSize > 1 && (
                      <p className="text-sm text-gray-500 text-right mt-1">
                        ${(getTotal() / groupSize).toFixed(0)} por persona
                      </p>
                    )}
                  </div>
                  
                  {/* Botón agregar al carrito */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddAllToCart}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Agregar todo al carrito
                  </motion.button>
                </>
              )}
              
              {/* Promociones */}
              <div className="mt-6">
                <button
                  onClick={() => setShowPromo(!showPromo)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-800">Promociones</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${
                    showPromo ? 'rotate-180' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {showPromo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          🎉 Martes 2x1 en helados simples
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          👥 10% off comprando 4 o más helados
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-800">
                          🎂 5% extra para grupos de 5+
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Info adicional */}
            <div className="mt-4 bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Los precios incluyen todos los sabores disponibles. 
                Podés elegir hasta 3 sabores por helado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;