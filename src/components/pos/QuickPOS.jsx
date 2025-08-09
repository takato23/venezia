// Componente POS Ultra-Rápido para empleados
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  MinusIcon, 
  ShoppingCartIcon,
  CreditCardIcon,
  CashIcon,
  QrCodeIcon,
  BanknotesIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

// Hook para sonidos de feedback
const useSound = () => {
  const sounds = useRef({
    add: new Audio('/sounds/add.wav'),
    remove: new Audio('/sounds/remove.wav'),
    checkout: new Audio('/sounds/checkout.wav')
  });

  const playSound = useCallback((type) => {
    try {
      sounds.current[type]?.play();
    } catch (error) {
      console.log('Sound not available');
    }
  }, []);

  return { playSound };
};

const QuickPOS = () => {
  // Estados principales
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Refs
  const searchInputRef = useRef(null);
  const { playSound } = useSound();

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.products || data || []);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Error cargando productos');
      }
    };
    loadProducts();
  }, []);

  // Calcular total
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 12); // Mostrar solo 12 productos más vendidos
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 12);
  }, [products, searchTerm]);

  // Agregar al carrito
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    playSound('add');
    toast.success(`${product.name} agregado`);
  }, [playSound]);

  // Quitar del carrito
  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
      const item = prev.find(item => item.id === productId);
      if (item && item.quantity > 1) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
    playSound('remove');
  }, [playSound]);

  // Procesar venta
  const processCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setIsProcessing(true);
    try {
      const saleData = {
        items: cart,
        total,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        playSound('checkout');
        toast.success(`Venta procesada: $${total.toFixed(2)}`);
        setCart([]);
        setSearchTerm('');
        searchInputRef.current?.focus();
      } else {
        throw new Error('Error procesando venta');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Error procesando la venta');
    } finally {
      setIsProcessing(false);
    }
  }, [cart, total, paymentMethod, playSound]);

  // Hotkeys
  useHotkeys('ctrl+enter', processCheckout);
  useHotkeys('esc', () => {
    setCart([]);
    setSearchTerm('');
  });
  useHotkeys('ctrl+f', () => {
    searchInputRef.current?.focus();
  });

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Panel de productos */}
      <div className="flex-1 p-4">
        {/* Búsqueda */}
        <div className="mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar productos... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 h-[calc(100vh-120px)] overflow-y-auto">
          {filteredProducts.map(product => (
            <motion.button
              key={product.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
            >
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  ${product.price}
                </span>
                <PlusIcon className="h-5 w-5 text-green-600" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Panel del carrito */}
      <div className="w-80 bg-white shadow-lg border-l flex flex-col">
        {/* Header del carrito */}
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Carrito
            </h2>
            <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">
            {cart.length} artículos
          </p>
        </div>

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      ${item.price} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {cart.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Carrito vacío</p>
            </div>
          )}
        </div>

        {/* Total y checkout */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-1 ${
                    paymentMethod === 'cash'
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <BanknotesIcon className="h-4 w-4" />
                  Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-1 ${
                    paymentMethod === 'card'
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCardIcon className="h-4 w-4" />
                  Tarjeta
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botón de checkout */}
            <button
              onClick={processCheckout}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Procesando...' : 'Finalizar Venta (Ctrl+Enter)'}
            </button>

            {/* Botón limpiar */}
            <button
              onClick={() => setCart([])}
              className="w-full bg-gray-200 text-gray-700 p-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Limpiar Carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPOS;