import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Minus,
  ShoppingBag,
  Calculator,
  Percent,
  Tag,
  Truck,
  Store,
  Phone,
  Smartphone
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ProductCard from '../components/pos/ProductCard';
import CartSummary from '../components/pos/CartSummary';
import QuickSearch from '../components/pos/QuickSearch';
import EnhancedSearch from '../components/pos/EnhancedSearch';
import RecentOrders from '../components/pos/RecentOrders';
import QuickProducts from '../components/pos/QuickProducts';
import CashIndicator from '../components/pos/CashIndicator';
import POSAnalytics from '../components/pos/POSAnalytics';
import POSAIAssistant from '../components/pos/POSAIAssistant';
import CrossSellSuggestions from '../components/pos/CrossSellSuggestions';
import ActiveDeliveries from '../components/pos/ActiveDeliveries';
import DynamicDiscounts from '../components/pos/DynamicDiscounts';
import SmartStockManager from '../components/pos/SmartStockManager';
import VIPCustomerManager from '../components/pos/VIPCustomerManager';
import receiptService from '../services/receiptService';
import PaymentModal from '../components/pos/PaymentModal';
import clsx from 'clsx';

const POSPage = () => {
  const location = useLocation();
  const { success, error, warning } = useToast();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderType, setOrderType] = useState('pickup'); // 'pickup' | 'delivery'
  const [deliveryData, setDeliveryData] = useState({
    address: '',
    phone: '',
    estimatedTime: '30-45 minutos',
    notes: ''
  });
  const [lastSale, setLastSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeInfo, setAdminCodeInfo] = useState(null);
  const [adminCodeStatus, setAdminCodeStatus] = useState(null); // 'valid' | 'invalid' | 'expired' | 'capacity' | 'disabled' | 'store_mismatch'
  
  // API Data
  const { 
    data: products, 
    loading: loadingProducts, 
    refetch: refetchProducts 
  } = useApiCache('/api/products');
  
  const { 
    data: categories, 
    loading: loadingCategories 
  } = useApiCache('/api/categories');
  
  const { 
    data: customers, 
    loading: loadingCustomers 
  } = useApiCache('/api/customers');
  
  const { 
    data: recentSales, 
    loading: loadingRecentSales 
  } = useApiCache('/api/sales/recent?limit=5');
  
  const { 
    data: cashStatus, 
    loading: loadingCashStatus 
  } = useApiCache('/api/cashflow/status');
  
  // Loading state
  const loading = loadingProducts || loadingCategories || loadingCustomers || loadingRecentSales || loadingCashStatus;

  // Safe data with proper API response structure handling
  const safeProducts = Array.isArray(products?.data) ? products.data : 
                      Array.isArray(products?.products) ? products.products :
                      Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories?.data) ? categories.data : 
                        Array.isArray(categories?.categories) ? categories.categories :
                        Array.isArray(categories) ? categories : [];
  const safeCustomers = Array.isArray(customers?.data) ? customers.data : 
                       Array.isArray(customers) ? customers : [];
  const safeRecentSales = Array.isArray(recentSales?.data) ? recentSales.data : 
                         Array.isArray(recentSales?.sales) ? recentSales.sales :
                         Array.isArray(recentSales) ? recentSales : [];
  const safeCashStatus = cashStatus?.data || cashStatus || { available: 0 };
  
  // Filter products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(safeProducts)) {
      return [];
    }
    
    return safeProducts.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_id === parseInt(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [safeProducts, searchTerm, selectedCategory]);
  
  // Cart calculations
  const cartStats = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = discountType === 'percent' 
      ? subtotal * (discount / 100)
      : discount;
    const total = Math.max(0, subtotal - discountAmount);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      itemCount
    };
  }, [cart, discount, discountType]);

  const validateAdminCode = async () => {
    try {
      setAdminCodeStatus(null);
      const resp = await fetch('/api/admin/admin_codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode, store_id: 1 })
      });
      const result = await resp.json();
      if (!resp.ok || !result?.success) {
        const code = result?.error?.code || 'INVALID';
        setAdminCodeInfo(null);
        if (code === 'EXPIRED') setAdminCodeStatus('expired');
        else if (code === 'CAPACITY_REACHED') setAdminCodeStatus('capacity');
        else if (code === 'DISABLED') setAdminCodeStatus('disabled');
        else if (code === 'STORE_MISMATCH') setAdminCodeStatus('store_mismatch');
        else setAdminCodeStatus('invalid');
        error('Código inválido', result?.error?.msg || 'No se pudo validar el código');
        return;
      }
      setAdminCodeInfo(result.data);
      setAdminCodeStatus('valid');
      // Aplicar descuento al carrito para vista previa
      if (result.data.discount_type === 'percent') {
        setDiscountType('percent');
        setDiscount(Number(result.data.discount_value || 0));
      } else if (result.data.discount_type === 'amount') {
        setDiscountType('fixed');
        setDiscount(Number(result.data.discount_value || 0));
      } else {
        setDiscountType('percent');
        setDiscount(0);
      }
      success('Código aplicado', 'Descuento aplicado al total');
    } catch (e) {
      error('Error', 'No se pudo validar el código');
    }
  };

  const removeAdminCode = () => {
    setAdminCode('');
    setAdminCodeInfo(null);
    setAdminCodeStatus(null);
    setDiscount(0);
    setDiscountType('percent');
  };
  
  // Top products (sorted by sales frequency)
  const topProducts = useMemo(() => {
    // En una implementación real, esto vendría del backend
    // Por ahora, simular con los primeros productos
    if (!Array.isArray(safeProducts)) {
      return [];
    }
    return safeProducts.slice(0, 9);
  }, [safeProducts]);
  
  // Repeat order function
  const handleRepeatOrder = async (order) => {
    try {
      // En una implementación real, cargaríamos los items de la orden desde el backend
      success('Pedido repetido', `Orden #${order.id} agregada al carrito`);
      
      // Mock: agregar algunos productos al carrito
      const mockItems = Array.isArray(safeProducts) && safeProducts.length > 0 ? [
        { ...safeProducts[0], quantity: 2 },
        ...(safeProducts[1] ? [{ ...safeProducts[1], quantity: 1 }] : [])
      ].filter(item => item.id) : []; // Solo si existen los productos
      
      if (mockItems.length > 0) {
        setCart(prev => {
          const newCart = [...prev];
          mockItems.forEach(item => {
            const existing = newCart.find(cartItem => cartItem.id === item.id);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              newCart.push(item);
            }
          });
          return newCart;
        });
      }
    } catch (err) {
      error('Error', 'No se pudo repetir el pedido');
    }
  };
  
  // Cart operations
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    success('Producto agregado', `${product.name} agregado al carrito`);
  };
  
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setDiscount(0);
    setOrderType('pickup');
    setDeliveryData({
      address: '',
      phone: '',
      estimatedTime: '30-45 minutos',
      notes: ''
    });
    setLastSale(null);
  };
  
  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      warning('Carrito vacío', 'Agrega productos antes de procesar la venta');
      return;
    }
    
    // Validar datos de delivery si es necesario
    if (orderType === 'delivery') {
      if (!deliveryData.address || !deliveryData.phone) {
        warning('Datos incompletos', 'La dirección y teléfono son requeridos para delivery');
        return;
      }
    }
    
    // If payment method is card or QR, open payment modal
    if (paymentMethod === 'card' || paymentMethod === 'qr') {
      setShowCheckout(false);
      setShowPaymentModal(true);
      return;
    }
    
    setProcessing(true);
    
    try {
      const baseData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customer: customer ? {
          name: customer.name || 'Cliente sin nombre',
          phone: customer.phone || deliveryData.phone || '',
          email: customer.email || ''
        } : {
          name: 'Cliente sin nombre',
          phone: deliveryData.phone || ''
        },
        payment_method: paymentMethod,
        store_id: 1,
        admin_code: adminCodeInfo?.code || undefined
      };
      
      let endpoint = '/api/sales';
      let saleData = baseData;
      
      // Si es delivery, usar endpoint específico y agregar datos de entrega
      if (orderType === 'delivery') {
        endpoint = '/api/pos/create-delivery-order';
        saleData = {
          ...baseData,
          delivery_address: deliveryData.address,
          delivery_phone: deliveryData.phone,
          estimated_time: deliveryData.estimatedTime,
          notes: deliveryData.notes
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar la venta');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Save sale data for receipt generation
        const saleData = {
          ...result.sale,
          items: cart.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            price: item.price
          })),
          customer_name: customer?.name || 'Cliente General',
          customer_phone: customer?.phone || deliveryData.phone || '',
          customer_email: customer?.email || '',
          payment_method: paymentMethod,
          receipt_number: result.receipt_number,
          discount: result?.data?.discount ?? discount,
          discount_type: adminCodeInfo?.discount_type === 'amount' ? 'fixed' : (adminCodeInfo?.discount_type || discountType),
          sale_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryData.address : null,
          estimated_time: orderType === 'delivery' ? deliveryData.estimatedTime : null
        };
        
        setLastSale(saleData);
        
        if (orderType === 'delivery') {
          success('🚚 Orden de delivery creada exitosamente', 
            `Recibo: ${result.receipt_number} | Total: $${result.sale.total} | Tiempo estimado: ${result.delivery.estimated_time}`
          );
        } else {
          success('🎉 Venta procesada exitosamente', 
            `Recibo: ${result.receipt_number} | Total: $${result.sale.total}`
          );
        }
        
        // Mostrar detalles del stock actualizado si hay cambios
        if (result.stock_updated && result.stock_updated.length > 0) {
          console.log('📦 Stock actualizado:', result.stock_updated);
        }
        
        setShowCheckout(false);
        // Clear cart but keep last sale
        setCart([]);
        setCustomer(null);
        setDiscount(0);
        setAdminCode('');
        setAdminCodeInfo(null);
        setAdminCodeStatus(null);
        setOrderType('pickup');
        setDeliveryData({
          address: '',
          phone: '',
          estimatedTime: '30-45 minutos',
          notes: ''
        });
        
        // Show receipt modal
        setShowReceiptModal(true);
        
        // Opcional: Invalidar cache de productos para actualizar stock en tiempo real
        // refetchProducts();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
      
    } catch (err) {
      error('Error', err.message || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle payment completion from PaymentModal
  const handlePaymentComplete = async (paymentData) => {
    setShowPaymentModal(false);
    setProcessing(true);
    
    try {
      const baseData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customer: customer ? {
          name: customer.name || 'Cliente sin nombre',
          phone: customer.phone || deliveryData.phone || '',
          email: customer.email || ''
        } : {
          name: 'Cliente sin nombre',
          phone: deliveryData.phone || ''
        },
        payment_method: paymentData.method,
        payment_id: paymentData.transactionId,
        discount: discountType === 'percent' ? discount : 0,
        total: parseFloat(cartStats.total)
      };
      
      let endpoint = '/api/sales';
      let saleData = baseData;
      
      // Si es delivery, usar endpoint específico y agregar datos de entrega
      if (orderType === 'delivery') {
        endpoint = '/api/pos/create-delivery-order';
        saleData = {
          ...baseData,
          delivery_address: deliveryData.address,
          delivery_phone: deliveryData.phone,
          estimated_time: deliveryData.estimatedTime,
          notes: deliveryData.notes
        };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar la venta');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Save sale data for receipt generation
        const saleData = {
          ...result.sale,
          items: cart.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            price: item.price
          })),
          customer_name: customer?.name || 'Cliente General',
          customer_phone: customer?.phone || deliveryData.phone || '',
          customer_email: customer?.email || '',
          payment_method: paymentData.method,
          payment_id: paymentData.transactionId,
          receipt_number: result.receipt_number,
          discount: result?.data?.discount ?? discount,
          discount_type: adminCodeInfo?.discount_type === 'amount' ? 'fixed' : (adminCodeInfo?.discount_type || discountType),
          sale_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryData.address : null,
          estimated_time: orderType === 'delivery' ? deliveryData.estimatedTime : null
        };
        
        setLastSale(saleData);
        
        success('💳 Pago procesado exitosamente', 
          `Recibo: ${result.receipt_number} | Total: $${result.sale.total} | Método: ${paymentData.method}`
        );
        
        // Clear cart but keep last sale
        setCart([]);
        setCustomer(null);
        setDiscount(0);
        setAdminCode('');
        setAdminCodeInfo(null);
        setAdminCodeStatus(null);
        setOrderType('pickup');
        setDeliveryData({
          address: '',
          phone: '',
          estimatedTime: '30-45 minutos',
          notes: ''
        });
        
        // Show receipt modal
        setShowReceiptModal(true);
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
      
    } catch (err) {
      error('Error', err.message || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Punto de Venta</h1>
          <p className="text-gray-700 dark:text-gray-300">Sistema de ventas rápido y eficiente</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCustomerForm(true)}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            {customer ? customer.name : 'Cliente'}
          </Button>
          
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Carrito ({cartStats.itemCount})
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <POSAnalytics />
      
      {/* Enhanced Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <EnhancedSearch
            products={safeProducts}
            onProductSelect={addToCart}
            topProducts={topProducts}
          />
        </div>
        
        {/* Cash Status & Active Deliveries */}
        <div className="space-y-4">
          <CashIndicator 
            cashAvailable={safeCashStatus.available}
            lowCashThreshold={500}
            criticalCashThreshold={100}
          />
          <ActiveDeliveries />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Products */}
          <QuickProducts
            products={topProducts}
            onProductSelect={addToCart}
            maxProducts={9}
          />
          
          {/* Products Grid (cuando hay búsqueda por categoría) */}
          {selectedCategory !== 'all' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Productos por Categoría
                </h3>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  className="w-48"
                >
                  <option value="all">Todas las categorías</option>
                  {safeCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    cartQuantity={cart.find(item => item.id === product.id)?.quantity || 0}
                  />
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron productos en esta categoría
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cart Summary */}
          <CartSummary
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            cartStats={cartStats}
            onCheckout={() => setShowCheckout(true)}
          />
          
          {/* AI Assistant */}
          <POSAIAssistant cart={cart} />
          
          {/* VIP Customer Management */}
          <VIPCustomerManager 
            customer={customer}
            cart={cart}
            onApplyVIPBenefit={(benefit) => {
              if (benefit.type === 'discount') {
                setDiscount(benefit.value);
                setDiscountType('percent');
                success('🎯 Beneficio VIP aplicado', `${benefit.title} - ${benefit.description}`);
              } else if (benefit.type === 'shipping') {
                success('🚚 Envío gratis activado', 'Delivery sin costo para cliente VIP');
              } else if (benefit.type === 'gift') {
                success('🎁 Regalo incluido', `${benefit.value} agregado como cortesía`);
              } else if (benefit.type === 'points') {
                success('⭐ Puntos dobles', `Ganarás ${benefit.value} puntos extra`);
              }
            }}
          />
          
          {/* Dynamic Discounts */}
          <DynamicDiscounts 
            cart={cart}
            customer={customer}
            onApplyDiscount={(discount) => {
              setDiscount(discount.value);
              setDiscountType(discount.type);
              success('¡Descuento aplicado!', `${discount.title} - Ahorras: $${(discount.type === 'percent' ? 
                cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (discount.value / 100) : 
                discount.value).toFixed(2)}`);
            }}
          />
          
          {/* Smart Stock Management */}
          <SmartStockManager 
            cart={cart}
            products={safeProducts}
            onAddToCart={addToCart}
          />
          
          {/* Cross-Sell Suggestions */}
          <CrossSellSuggestions 
            cart={cart}
            products={safeProducts}
            onProductSelect={addToCart}
          />
          
          {/* Recent Orders */}
          <RecentOrders
            orders={safeRecentSales}
            onRepeatOrder={handleRepeatOrder}
            maxOrders={5}
          />
        </div>
      </div>
      
      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Procesar Venta"
        size="lg"
      >
        <div className="space-y-6">
          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Orden
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType('pickup')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  orderType === 'pickup'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Store className="h-5 w-5" />
                  <span className="font-medium">Retiro en Local</span>
                </div>
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  orderType === 'delivery'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span className="font-medium">Delivery</span>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Information (only show if delivery is selected) */}
          {orderType === 'delivery' && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Información de Entrega
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono *
                  </label>
                  <Input
                    type="tel"
                    placeholder="123-456-7890"
                    value={deliveryData.phone}
                    onChange={(e) => setDeliveryData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiempo Estimado
                  </label>
                  <Select
                    value={deliveryData.estimatedTime}
                    onChange={(value) => setDeliveryData(prev => ({ ...prev, estimatedTime: value }))}
                  >
                    <option value="20-30 minutos">20-30 minutos</option>
                    <option value="30-45 minutos">30-45 minutos</option>
                    <option value="45-60 minutos">45-60 minutos</option>
                    <option value="1-2 horas">1-2 horas</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección de Entrega *
                </label>
                <Input
                  placeholder="Calle, número, barrio, referencias"
                  value={deliveryData.address}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas adicionales
                </label>
                <Input
                  placeholder="Indicaciones especiales, referencias, etc."
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={customer?.name || 'Cliente General'}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setShowCustomerForm(true)}
              >
                Cambiar
              </Button>
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <DollarSign className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm">Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCard className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm">Tarjeta</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Smartphone className="h-5 w-5 mx-auto mb-1" />
                <span className="text-sm">QR</span>
              </button>
            </div>
          </div>
          
          {/* Dynamic Discounts */}
          <DynamicDiscounts 
            cart={cart}
            customer={customer}
            onApplyDiscount={(discount) => {
              setDiscount(discount.value);
              setDiscountType(discount.type);
              success('¡Descuento aplicado!', `${discount.title} - Ahorras: $${(discount.type === 'percent' ? 
                cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (discount.value / 100) : 
                discount.value).toFixed(2)}`);
            }}
            className="mb-4"
          />

          {/* Admin Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código de administrador
            </label>
            <div className="flex items-center gap-2">
              <Input
                aria-label="Código de administrador"
                placeholder="Ingresa el código"
                value={adminCode}
                onChange={(e)=>setAdminCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={validateAdminCode} aria-label="Validar y aplicar código">
                Validar/Aplicar
              </Button>
              {adminCodeInfo && (
                <Button variant="outline" onClick={removeAdminCode} aria-label="Quitar código aplicado">
                  Quitar
                </Button>
              )}
            </div>
            {adminCodeStatus === 'valid' && (
              <p className="text-green-600 text-sm mt-1">Código válido. Descuento aplicado.</p>
            )}
            {adminCodeStatus && adminCodeStatus !== 'valid' && (
              <p className="text-red-600 text-sm mt-1">
                {adminCodeStatus === 'expired' && 'Código expirado'}
                {adminCodeStatus === 'capacity' && 'Límite de usos alcanzado'}
                {adminCodeStatus === 'disabled' && 'Código deshabilitado'}
                {adminCodeStatus === 'store_mismatch' && 'Código no aplicable a esta tienda'}
                {adminCodeStatus === 'invalid' && 'Código inválido'}
              </p>
            )}
          </div>
          
          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descuento Manual
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="flex-1"
                placeholder="0.00"
              />
              <Select
                value={discountType}
                onChange={setDiscountType}
                className="w-24"
              >
                <option value="percent">%</option>
                <option value="fixed">$</option>
              </Select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              O usa los descuentos automáticos de arriba
            </p>
          </div>
          
          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cartStats.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento:</span>
                <span>-${cartStats.discountAmount}</span>
              </div>
              {adminCodeInfo && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Código aplicado:</span>
                  <span>{adminCodeInfo.code} ({adminCodeInfo.discount_type === 'percent' ? `${adminCodeInfo.discount_value}%` : `$${adminCodeInfo.discount_value}`})</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${cartStats.total}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={processSale}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Procesar Venta
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Form Modal */}
      <Modal
        isOpen={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        title="Seleccionar Cliente"
        size="md"
      >
        <div className="space-y-4">
          {/* Quick Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente Frecuente
            </label>
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const selectedCustomer = safeCustomers.find(c => c.id === parseInt(e.target.value));
                  if (selectedCustomer) {
                    setCustomer(selectedCustomer);
                    setShowCustomerForm(false);
                    success('Cliente seleccionado');
                  }
                }
              }}
              className="w-full"
            >
              <option value="">Seleccionar cliente...</option>
              {safeCustomers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.phone || 'Sin teléfono'}
                </option>
              ))}
            </Select>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O ingrese datos manualmente</span>
            </div>
          </div>

          {/* Manual Customer Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const newCustomer = {
              name: formData.get('name'),
              phone: formData.get('phone'),
              email: formData.get('email'),
              address: formData.get('address')
            };
            
            if (newCustomer.name) {
              setCustomer(newCustomer);
              setShowCustomerForm(false);
              success('Cliente agregado');
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <Input
                  name="name"
                  placeholder="Nombre del cliente"
                  required
                  defaultValue={customer?.name || ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="123-456-7890"
                  defaultValue={customer?.phone || ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="cliente@email.com"
                  defaultValue={customer?.email || ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <Input
                  name="address"
                  placeholder="Dirección de entrega"
                  defaultValue={customer?.address || ''}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustomer(null);
                  setShowCustomerForm(false);
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Venta Completada"
        size="md"
      >
        <div className="space-y-6">
          {lastSale && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Venta Exitosa!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Recibo: {lastSale.receipt_number}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  Total: ${parseFloat(lastSale.total).toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  ¿Qué deseas hacer con el recibo?
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      receiptService.printReceipt(lastSale);
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Imprimir Recibo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      receiptService.downloadReceipt(lastSale);
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Descargar Recibo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      receiptService.printInvoice(lastSale);
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Imprimir Factura
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      receiptService.downloadInvoice(lastSale);
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Descargar Factura
                  </Button>
                </div>

                {/* Email option (future implementation) */}
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-3">
                    <Input
                      type="email"
                      placeholder="Email del cliente (opcional)"
                      defaultValue={lastSale.customer_email || ''}
                      disabled
                    />
                    <Button variant="outline" disabled>
                      Enviar por Email
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Función disponible próximamente
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowReceiptModal(false);
                    clearCart();
                  }}
                  className="flex-1"
                >
                  Nueva Venta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartTotal={parseFloat(cartStats.total)}
        orderId={Date.now()} // In production, use actual order ID
        customerId={customer?.id}
        customerEmail={customer?.email}
        onPaymentComplete={handlePaymentComplete}
        paymentMethod={paymentMethod}
      />
    </div>
  );
};

export default POSPage;