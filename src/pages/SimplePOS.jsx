import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Coffee,
  IceCream,
  Plus,
  Minus,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Percent,
  User,
  Truck,
  X,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

// Componente para selección de sabores
const FlavorSelector = ({ flavors, maxFlavors, selectedFlavors, onChange, stockData }) => {
  const handleFlavorToggle = (flavorId) => {
    if (selectedFlavors.includes(flavorId)) {
      onChange(selectedFlavors.filter(f => f !== flavorId));
    } else if (selectedFlavors.length < maxFlavors) {
      onChange([...selectedFlavors, flavorId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sabores ({selectedFlavors.length}/{maxFlavors})
        </span>
        {selectedFlavors.length === maxFlavors && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Completo
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {flavors.map(flavor => {
          const stock = stockData?.[flavor.id] || 0;
          const isOutOfStock = stock <= 0;
          const isLowStock = stock > 0 && stock < 5;
          const isSelected = selectedFlavors.includes(flavor.id);
          
          return (
            <button
              key={flavor.id}
              onClick={() => !isOutOfStock && handleFlavorToggle(flavor.id)}
              disabled={isOutOfStock || (!isSelected && selectedFlavors.length >= maxFlavors)}
              className={clsx(
                'relative p-3 rounded-lg border-2 transition-all text-center',
                isSelected && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                !isSelected && !isOutOfStock && 'border-gray-200 dark:border-gray-600 hover:border-gray-300',
                isOutOfStock && 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed',
                !isOutOfStock && !isSelected && selectedFlavors.length >= maxFlavors && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div 
                className={clsx(
                  'w-8 h-8 rounded-full mx-auto mb-1',
                  flavor.color || 'bg-gray-300'
                )}
                style={{ backgroundColor: flavor.color }}
              />
              <div className="text-xs font-medium truncate">
                {flavor.name}
              </div>
              <div className={clsx(
                'text-xs mt-1',
                isOutOfStock && 'text-red-600 dark:text-red-400 font-bold',
                isLowStock && !isOutOfStock && 'text-orange-600 dark:text-orange-400',
                !isOutOfStock && !isLowStock && 'text-gray-500 dark:text-gray-400'
              )}>
                {isOutOfStock ? 'AGOTADO' : `${stock}kg`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Componente principal del POS simplificado
const SimplePOS = () => {
  const { success, error, warning } = useToast();
  
  // Estado del carrito
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('helados');
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  
  // Estado de descuentos y pagos
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 });
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  
  // API Data
  const { 
    data: products, 
    loading: loadingProducts,
    refetch: refetchProducts 
  } = useApiCache('/api/products');
  
  const { 
    data: flavors,
    loading: loadingFlavors 
  } = useApiCache('/api/flavors');
  
  const { 
    data: stockData,
    loading: loadingStock,
    refetch: refetchStock
  } = useApiCache('/api/stock/current');

  // Datos seguros
  const safeProducts = Array.isArray(products?.data?.items)
    ? products.data.items
    : Array.isArray(products?.data)
      ? products.data
      : Array.isArray(products?.products)
        ? products.products
        : Array.isArray(products)
          ? products
          : [];
  const safeFlavors = Array.isArray(flavors) ? flavors : [];
  
  // Productos por categoría
  const productsByCategory = useMemo(() => {
    const isActive = (p) => p.active !== false;
    // Considerar category_id=1 como Helados; el resto como Otros si no hay nombre de categoría
    const helados = safeProducts.filter(p => (p.category?.name === 'Helados' || p.category_id === 1) && isActive(p));
    const otros = safeProducts.filter(p => !(p.category?.name === 'Helados' || p.category_id === 1) && isActive(p));
    return { helados, otros };
  }, [safeProducts]);

  // Cálculo del total
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    
    if (discount.type === 'percent') {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    
    return { subtotal, discountAmount, total };
  }, [cart, discount]);

  // Agregar producto al carrito
  const addToCart = (product) => {
    if (product.max_flavors > 0) {
      // Producto con sabores - abrir modal
      setSelectedProduct(product);
      setSelectedFlavors([]);
      setShowFlavorModal(true);
    } else {
      // Producto simple - agregar directo
      const newItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxFlavors: 0,
        flavors: []
      };
      setCart([...cart, newItem]);
      success('Agregado', `${product.name} agregado al carrito`);
    }
  };

  // Confirmar selección de sabores
  const confirmFlavors = () => {
    if (selectedFlavors.length !== selectedProduct.max_flavors) {
      warning('Sabores incompletos', `Seleccione ${selectedProduct.max_flavors} sabores`);
      return;
    }

    const flavorNames = selectedFlavors.map(fId => 
      safeFlavors.find(f => f.id === fId)?.name || ''
    );

    if (editingItem) {
      // Editando item existente
      setCart(cart.map(item => 
        item.id === editingItem.id 
          ? { ...item, flavors: selectedFlavors, flavorNames }
          : item
      ));
      success('Actualizado', 'Sabores actualizados');
      setEditingItem(null);
    } else {
      // Nuevo item
      const newItem = {
        id: Date.now(),
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        maxFlavors: selectedProduct.max_flavors,
        flavors: selectedFlavors,
        flavorNames
      };
      setCart([...cart, newItem]);
      success('Agregado', `${selectedProduct.name} agregado al carrito`);
    }

    setShowFlavorModal(false);
    setSelectedProduct(null);
    setSelectedFlavors([]);
  };

  // Actualizar cantidad
  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Editar sabores
  const editFlavors = (item) => {
    setEditingItem(item);
    setSelectedProduct({ 
      id: item.productId, 
      name: item.name, 
      max_flavors: item.maxFlavors 
    });
    setSelectedFlavors(item.flavors);
    setShowFlavorModal(true);
  };

  // Eliminar del carrito
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Limpiar carrito
  const clearCart = () => {
    if (cart.length === 0) return;
    
    if (window.confirm('¿Limpiar todo el carrito?')) {
      setCart([]);
      setDiscount({ type: 'percent', value: 0 });
      setSelectedCustomer(null);
      success('Carrito limpio', 'Se eliminaron todos los productos');
    }
  };

  // Procesar pago
  const processPayment = async () => {
    if (!paymentMethod) {
      error('Error', 'Seleccione un método de pago');
      return;
    }

    if (paymentMethod === 'cash' && !amountReceived) {
      error('Error', 'Ingrese el monto recibido');
      return;
    }

    // Aquí iría la lógica de procesamiento de pago
    // Por ahora simulamos
    
    success('Venta completada', `Total: $${cartTotals.total.toFixed(2)}`);
    
    // Limpiar todo
    setCart([]);
    setDiscount({ type: 'percent', value: 0 });
    setSelectedCustomer(null);
    setShowPaymentModal(false);
    setPaymentMethod('');
    setAmountReceived('');
    
    // Refrescar stock
    refetchStock();
  };

  // Calcular vuelto
  const change = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - cartTotals.total);
  }, [amountReceived, cartTotals.total]);

  const loading = loadingProducts || loadingFlavors || loadingStock;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IceCream className="w-6 h-6 text-venezia-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Venezia POS
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>•</span>
          <span>Centro</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Productos */}
        <div className="flex-1 flex flex-col p-4">
          {/* Tabs de categorías */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeCategory === 'helados' ? 'primary' : 'outline'}
              onClick={() => setActiveCategory('helados')}
              icon={IceCream}
              size="sm"
            >
              Helados
            </Button>
            <Button
              variant={activeCategory === 'otros' ? 'primary' : 'outline'}
              onClick={() => setActiveCategory('otros')}
              icon={Coffee}
              size="sm"
            >
              Otros
            </Button>
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productsByCategory[activeCategory].map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-venezia-500 dark:hover:border-venezia-400 transition-all"
                >
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    {product.max_flavors > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {product.max_flavors} {product.max_flavors === 1 ? 'sabor' : 'sabores'}
                      </p>
                    )}
                    <p className="text-lg font-bold text-venezia-600 dark:text-venezia-400 mt-2">
                      ${product.price}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header del carrito */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Venta Actual
              </h2>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Carrito vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.quantity}x {item.name}
                      </h4>
                      {item.flavorNames && item.flavorNames.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.flavorNames.join(' + ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {item.maxFlavors > 0 && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => editFlavors(item)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y acciones */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">${cartTotals.subtotal.toFixed(2)}</span>
              </div>

              {/* Descuento */}
              {discount.value > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Descuento {discount.type === 'percent' ? `${discount.value}%` : ''}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -${cartTotals.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">TOTAL</span>
                <span className="text-venezia-600 dark:text-venezia-400">
                  ${cartTotals.total.toFixed(2)}
                </span>
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountModal(true)}
                  icon={Percent}
                >
                  Descuento
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={User}
                >
                  Cliente
                </Button>
              </div>

              {/* Botón de cobrar */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowPaymentModal(true)}
                icon={DollarSign}
                className="w-full"
              >
                COBRAR
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección de sabores */}
      <Modal
        isOpen={showFlavorModal}
        onClose={() => {
          setShowFlavorModal(false);
          setSelectedProduct(null);
          setSelectedFlavors([]);
          setEditingItem(null);
        }}
        title={`Seleccionar sabores - ${selectedProduct?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <FlavorSelector
            flavors={safeFlavors}
            maxFlavors={selectedProduct?.max_flavors || 1}
            selectedFlavors={selectedFlavors}
            onChange={setSelectedFlavors}
            stockData={stockData}
          />
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFlavorModal(false);
                setSelectedProduct(null);
                setSelectedFlavors([]);
                setEditingItem(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={confirmFlavors}
              disabled={selectedFlavors.length !== selectedProduct?.max_flavors}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de descuento */}
      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Aplicar Descuento"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={discount.type === 'percent' ? 'primary' : 'outline'}
              onClick={() => setDiscount({ ...discount, type: 'percent' })}
              size="sm"
            >
              Porcentaje %
            </Button>
            <Button
              variant={discount.type === 'fixed' ? 'primary' : 'outline'}
              onClick={() => setDiscount({ ...discount, type: 'fixed' })}
              size="sm"
            >
              Monto Fijo $
            </Button>
          </div>
          
          <Input
            type="number"
            placeholder={discount.type === 'percent' ? 'Porcentaje' : 'Monto'}
            value={discount.value}
            onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
            min="0"
            max={discount.type === 'percent' ? '100' : undefined}
          />
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDiscount({ type: 'percent', value: 0 });
                setShowDiscountModal(false);
              }}
            >
              Quitar
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowDiscountModal(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentMethod('');
          setAmountReceived('');
        }}
        title="Procesar Pago"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total a Pagar</p>
            <p className="text-3xl font-bold text-venezia-600 dark:text-venezia-400">
              ${cartTotals.total.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className="flex flex-col items-center py-4"
            >
              <DollarSign className="w-6 h-6 mb-1" />
              <span>Efectivo</span>
            </Button>
            <Button
              variant={paymentMethod === 'qr' ? 'primary' : 'outline'}
              onClick={() => setPaymentMethod('qr')}
              className="flex flex-col items-center py-4"
            >
              <Smartphone className="w-6 h-6 mb-1" />
              <span>QR MP</span>
            </Button>
            <Button
              variant={paymentMethod === 'card' ? 'primary' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="flex flex-col items-center py-4"
            >
              <CreditCard className="w-6 h-6 mb-1" />
              <span>Tarjeta</span>
            </Button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Monto recibido"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="text-2xl font-bold text-center"
                autoFocus
              />
              
              {amountReceived && parseFloat(amountReceived) >= cartTotals.total && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vuelto</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${change.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentMethod('');
                setAmountReceived('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={processPayment}
              disabled={!paymentMethod || (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < cartTotals.total))}
              className="flex-1"
            >
              Confirmar Pago
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SimplePOS;