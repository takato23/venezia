import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnhancedSearch from './EnhancedSearch';
import RecentOrders from './RecentOrders';
import QuickProducts from './QuickProducts';
import CashIndicator from './CashIndicator';

// Mock data para demostrar los componentes
const mockProducts = [
  { id: 1, name: 'Helado Chocolate', price: 350, stock: 25, barcode: '123456' },
  { id: 2, name: 'Helado Vainilla', price: 320, stock: 30, barcode: '123457' },
  { id: 3, name: 'Helado Frutilla', price: 340, stock: 3, barcode: '123458' },
  { id: 4, name: 'Paleta Agua', price: 180, stock: 50, barcode: '123459' },
  { id: 5, name: 'Cono Simple', price: 220, stock: 40, barcode: '123460' },
  { id: 6, name: 'Sundae Especial', price: 480, stock: 12, barcode: '123461' },
  { id: 7, name: 'Milkshake', price: 420, stock: 15, barcode: '123462' },
  { id: 8, name: 'Torta Helada', price: 850, stock: 8, barcode: '123463' },
  { id: 9, name: 'Banana Split', price: 520, stock: 10, barcode: '123464' }
];

const mockRecentOrders = [
  {
    id: 1,
    customer_name: 'Juan Pérez',
    created_at: new Date(Date.now() - 300000), // hace 5 minutos
    items_count: 3,
    total: 890,
    items_preview: '2x Helado Chocolate, 1x Cono Simple'
  },
  {
    id: 2,
    customer_name: null,
    created_at: new Date(Date.now() - 900000), // hace 15 minutos
    items_count: 2,
    total: 520,
    items_preview: '1x Milkshake, 1x Paleta Agua'
  },
  {
    id: 3,
    customer_name: 'María González',
    created_at: new Date(Date.now() - 1800000), // hace 30 minutos
    items_count: 1,
    total: 850,
    items_preview: '1x Torta Helada'
  }
];

const EnhancedPOSExample = () => {
  const [cart, setCart] = useState([]);
  const [cashAvailable, setCashAvailable] = useState(250); // Efectivo bajo para demo

  const handleProductSelect = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRepeatOrder = (order) => {
    // En una implementación real, aquí cargarías los items de la orden
    console.log('Repitiendo orden:', order);
    alert(`Orden #${order.id} agregada al carrito!`);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          POS Mejorado - Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Búsqueda Mejorada */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Búsqueda Inteligente
              </h2>
              <EnhancedSearch
                products={mockProducts}
                onProductSelect={handleProductSelect}
                topProducts={mockProducts.slice(0, 5)}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Presiona F2 para enfocar la búsqueda, usa las flechas para navegar
              </p>
            </div>

            {/* Productos de Acceso Rápido */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Productos Frecuentes
              </h2>
              <QuickProducts
                products={mockProducts}
                onProductSelect={handleProductSelect}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Presiona 1-9 para agregar productos rápidamente
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Indicador de Efectivo */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Estado de Caja
              </h2>
              <CashIndicator cashAvailable={cashAvailable} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setCashAvailable(100)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                >
                  Crítico
                </button>
                <button
                  onClick={() => setCashAvailable(300)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm"
                >
                  Bajo
                </button>
                <button
                  onClick={() => setCashAvailable(1500)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
                >
                  Normal
                </button>
              </div>
            </div>

            {/* Órdenes Recientes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Repetir Pedidos
              </h2>
              <RecentOrders
                orders={mockRecentOrders}
                onRepeatOrder={handleRepeatOrder}
              />
            </div>

            {/* Carrito Simple */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Carrito ({cartItems})
              </h3>
              {cart.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Agrega productos usando la búsqueda o teclas rápidas
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity}x ${item.price}
                        </div>
                      </div>
                      <div className="font-bold text-sm">
                        ${(item.price * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${cartTotal.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPOSExample;