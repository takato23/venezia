import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Globe, 
  ShoppingBag,
  Settings,
  Package,
  CreditCard,
  Truck,
  Users,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Image,
  Star,
  CheckCircle,
  Save,
  Tag,
  DollarSign,
  BarChart,
  History,
  ShoppingCart
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ProductImagePlaceholder from '../components/ui/ProductImagePlaceholder';
import ProductCatalogManager from '../components/shop/ProductCatalogManager';
import OnlineOrderManager from '../components/shop/OnlineOrderManager';
import ShopAnalytics from '../components/shop/ShopAnalytics';
import CouponManager from '../components/shop/CouponManager';
import PricingManager from '../components/shop/PricingManager';
import OrderHistory from '../components/shop/OrderHistory';
import { useInventorySync } from '../hooks/useInventorySync';
import { useToast } from '../hooks/useToast';

const ShopPage = () => {
  const { success, error: showError, warning } = useToast();
  
  // Estado principal
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  
  // Datos de la tienda
  const [shopProducts, setShopProducts] = useState([]);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [shopConfig, setShopConfig] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  
  // Modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Estado para nuevo producto web
  const [newWebProduct, setNewWebProduct] = useState({
    productId: '',
    webPrice: '',
    webDescription: '',
    webImages: [],
    isActive: true,
    isFeatured: false
  });
  
  // Estado para controlar loading del formulario
  const [submittingProduct, setSubmittingProduct] = useState(false);
  
  // Estado para configuración temporal
  const [tempConfig, setTempConfig] = useState({});
  const [configChanged, setConfigChanged] = useState(false);

  // Hook de sincronización de inventario
  const {
    syncStatus,
    stockAlerts,
    syncInventory,
    getAvailableStock,
    checkStockLevels
  } = useInventorySync(allProducts, shopProducts);

  // Cargar datos iniciales
  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, ordersResponse, configResponse, allProductsResponse] = await Promise.all([
        fetch('/api/shop/products'),
        fetch('/api/shop/orders'),
        fetch('/api/shop/config'),
        fetch('/api/products')
      ]);
      
      // Verificar que las respuestas sean exitosas antes de parsear JSON
      const products = productsResponse.ok ? await productsResponse.json() : { products: [] };
      const orders = ordersResponse.ok ? await ordersResponse.json() : { orders: [] };
      const configData = configResponse.ok ? await configResponse.json() : { config: {} };
      const allProds = allProductsResponse.ok ? await allProductsResponse.json() : [];
      
      // Asegurar que los productos y órdenes sean arrays
      setShopProducts(Array.isArray(products.products) ? products.products : []);
      setOnlineOrders(Array.isArray(orders.orders) ? orders.orders : []);
      setShopConfig(configData.config || {});
      setTempConfig(configData.config || {});
      setAllProducts(Array.isArray(allProds) ? allProds : []);
      
    } catch (error) {
      showError('Error al cargar datos', 'No se pudieron cargar los datos de la tienda');
      // Establecer valores por defecto en caso de error
      setShopProducts([]);
      setOnlineOrders([]);
      setShopConfig({});
      setTempConfig({});
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Crear/editar producto web
  const handleSaveWebProduct = async () => {
    if (submittingProduct) return;
    
    setSubmittingProduct(true);
    
    try {
      const method = selectedProduct ? 'PUT' : 'POST';
      const url = selectedProduct 
        ? `/api/shop/products/${selectedProduct.id}`
        : '/api/shop/products';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebProduct)
      });
      
      if (response.ok) {
        success('Producto guardado', selectedProduct ? 'Producto actualizado correctamente' : 'Producto agregado a la tienda web');
        setShowProductModal(false);
        loadShopData();
        setNewWebProduct({
          productId: '',
          webPrice: '',
          webDescription: '',
          webImages: [],
          isActive: true,
          isFeatured: false
        });
        setSelectedProduct(null);
      } else {
        const errorData = await response.json();
        showError('Error al guardar', errorData.error || 'No se pudo guardar el producto');
      }
    } catch (error) {
      showError('Error de conexión', 'No se pudo conectar con el servidor');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Alternar estado activo del producto
  const toggleProductActive = async (productId, isActive) => {
    try {
      const response = await fetch(`/api/shop/products/${productId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (response.ok) {
        const newState = !isActive;
        success(
          'Estado actualizado', 
          `Producto ${newState ? 'activado' : 'desactivado'} en la tienda web`
        );
        loadShopData();
      } else {
        showError('Error', 'No se pudo actualizar el estado del producto');
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el estado del producto');
    }
  };

  // Actualizar estado de orden
  const updateOrderStatus = async (orderId, updates) => {
    try {
      const response = await fetch(`/api/shop/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        success('Estado actualizado', 'La orden ha sido actualizada correctamente');
        loadShopData();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el estado de la orden');
    }
  };
  
  // Guardar configuración de la tienda
  const saveShopConfig = async () => {
    try {
      const response = await fetch('/api/shop/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempConfig)
      });
      
      if (response.ok) {
        success('Configuración guardada', 'La configuración de la tienda se actualizó correctamente');
        setShopConfig(tempConfig);
        setConfigChanged(false);
      } else {
        showError('Error', 'No se pudo guardar la configuración');
      }
    } catch (error) {
      showError('Error', 'Error al guardar la configuración');
    }
  };
  
  // Manejar cambios en la configuración
  const handleConfigChange = (field, value) => {
    setTempConfig(prev => ({ ...prev, [field]: value }));
    setConfigChanged(true);
  };

  // Calcular métricas
  const metrics = {
    totalProducts: shopProducts.length,
    activeProducts: shopProducts.filter(p => p.isActive).length,
    pendingOrders: onlineOrders.filter(o => o.status === 'pending').length,
    totalRevenue: onlineOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  };

  const tabs = [
    { id: 'products', label: 'Productos Web', icon: Package },
    { id: 'orders', label: 'Órdenes Online', icon: ShoppingBag },
    { id: 'pricing', label: 'Precios', icon: DollarSign },
    { id: 'coupons', label: 'Cupones', icon: Tag },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'config', label: 'Configuración', icon: Settings }
  ];

  const orderStatuses = [
    { value: 'pending', label: 'Pendiente', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmada', color: 'blue' },
    { value: 'preparing', label: 'Preparando', color: 'orange' },
    { value: 'ready', label: 'Lista', color: 'green' },
    { value: 'delivered', label: 'Entregada', color: 'green' },
    { value: 'cancelled', label: 'Cancelada', color: 'red' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-venezia-900">Tienda Online</h1>
          <p className="text-venezia-600 mt-1">E-commerce y gestión web</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => window.open('/webshop', '_blank')}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Globe className="h-5 w-5 mr-2" />
            Ver Tienda Web
          </Button>
          <Button onClick={() => setShowProductModal(true)}>
            <Package className="h-5 w-5 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Alertas de stock */}
      {stockAlerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Alertas de Inventario
          </h3>
          <div className="space-y-1">
            {stockAlerts.slice(0, 3).map((alert, index) => (
              <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                • {alert.message}
              </p>
            ))}
            {stockAlerts.length > 3 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                +{stockAlerts.length - 3} alertas más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Productos Totales</p>
              <p className="text-2xl font-bold text-venezia-900">{metrics.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-venezia-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Productos Activos</p>
              <p className="text-2xl font-bold text-green-600">{metrics.activeProducts}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Órdenes Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-venezia-600">Ingresos Web</p>
              <p className="text-2xl font-bold text-blue-600">${metrics.totalRevenue.toFixed(2)}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-venezia-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-venezia-500 text-venezia-600'
                    : 'border-transparent text-venezia-500 hover:text-venezia-700 hover:border-venezia-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido por tab */}
      {activeTab === 'products' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-venezia-200">
            <h3 className="text-lg font-semibold text-venezia-900">Productos en Tienda Web</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-venezia-200">
              <thead className="bg-venezia-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Precio Web</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Destacado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-venezia-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-venezia-200">
                {shopProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay productos en la tienda web
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Comienza agregando productos desde tu inventario
                        </p>
                        <Button
                          onClick={() => setShowProductModal(true)}
                          variant="primary"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Agregar Primer Producto
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  shopProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-venezia-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ProductImagePlaceholder 
                            productName={product.product?.name || product.name}
                            size="default"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-venezia-900">{product.product?.name || product.name}</div>
                          <div className="text-sm text-venezia-500">{product.product?.category || product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-venezia-900">${product.webPrice?.toFixed(2) || product.price?.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isFeatured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleProductActive(product.id, product.isActive)}
                        >
                          {product.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setNewWebProduct({
                              productId: product.productId,
                              webPrice: product.webPrice || product.price,
                              webDescription: product.webDescription || '',
                              webImages: product.webImages || [],
                              isActive: product.isActive,
                              isFeatured: product.isFeatured || false
                            });
                            setShowProductModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <OnlineOrderManager 
          orders={onlineOrders}
          onUpdateOrder={updateOrderStatus}
          onRefresh={loadShopData}
        />
      )}

      {activeTab === 'pricing' && (
        <PricingManager
          products={shopProducts}
          onUpdatePricing={async (productId, pricing) => {
            await fetch(`/api/shop/products/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pricing)
            });
            loadShopData();
          }}
        />
      )}

      {activeTab === 'coupons' && (
        <CouponManager
          onCouponChange={loadShopData}
        />
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Órdenes
          </h3>
          <OrderHistory customerId="shop" />
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-venezia-900">Configuración de Tienda</h3>
              <div className="flex items-center space-x-3">
                {configChanged && (
                  <div className="flex items-center text-sm text-orange-600">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mr-2"></div>
                    Cambios sin guardar
                  </div>
                )}
                {configChanged && (
                  <Button
                    onClick={saveShopConfig}
                    variant="primary"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-venezia-700 mb-2">Nombre de la Tienda</label>
                <Input 
                  value={tempConfig.storeName || ''} 
                  onChange={(e) => handleConfigChange('storeName', e.target.value)}
                  placeholder="Venezia Gelato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-venezia-700 mb-2">Email de Contacto</label>
                <Input 
                  value={tempConfig.storeEmail || ''} 
                  onChange={(e) => handleConfigChange('storeEmail', e.target.value)}
                  placeholder="info@veneziagelato.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-venezia-700 mb-2">Teléfono</label>
                <Input 
                  value={tempConfig.storePhone || ''} 
                  onChange={(e) => handleConfigChange('storePhone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-venezia-700 mb-2">Dirección</label>
                <Input 
                  value={tempConfig.storeAddress || ''} 
                  onChange={(e) => handleConfigChange('storeAddress', e.target.value)}
                  placeholder="Av. Corrientes 1234, CABA"
                />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-venezia-900 mb-4">Configuración de Delivery</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-venezia-900">Delivery Habilitado</p>
                  <p className="text-sm text-venezia-500">Permitir entregas a domicilio</p>
                </div>
                <button
                  onClick={() => handleConfigChange('deliveryEnabled', !tempConfig.deliveryEnabled)}
                  className="p-1"
                >
                  {tempConfig.deliveryEnabled ? (
                    <ToggleRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-venezia-700 mb-2">Costo de Delivery</label>
                  <Input 
                    type="number" 
                    value={tempConfig.deliveryFee || ''} 
                    onChange={(e) => handleConfigChange('deliveryFee', e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-venezia-700 mb-2">Pedido Mínimo</label>
                  <Input 
                    type="number" 
                    value={tempConfig.minimumOrderAmount || ''} 
                    onChange={(e) => handleConfigChange('minimumOrderAmount', e.target.value)}
                    placeholder="1500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <ShopAnalytics 
          orders={onlineOrders}
          products={shopProducts}
          customers={[]} // Por ahora vacío, se puede integrar con el sistema de clientes
        />
      )}

      {/* Modal Producto Web */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
          setNewWebProduct({
            productId: '',
            webPrice: '',
            webDescription: '',
            webImages: [],
            isActive: true,
            isFeatured: false
          });
        }}
        title={selectedProduct ? 'Editar Producto Web' : 'Agregar Producto a Tienda Web'}
      >
        <div className="space-y-4">
          <Select
            label="Producto"
            value={newWebProduct.productId}
            onChange={(e) => setNewWebProduct({...newWebProduct, productId: e.target.value})}
            required
            disabled={!!selectedProduct}
          >
            <option value="">Seleccionar producto...</option>
            {allProducts.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
          
          <Input
            label="Precio Web"
            type="number"
            value={newWebProduct.webPrice}
            onChange={(e) => setNewWebProduct({...newWebProduct, webPrice: e.target.value})}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-venezia-700 mb-2">Descripción Web</label>
            <textarea
              className="w-full px-3 py-2 border border-venezia-300 rounded-md focus:outline-none focus:ring-2 focus:ring-venezia-500"
              rows="3"
              value={newWebProduct.webDescription}
              onChange={(e) => setNewWebProduct({...newWebProduct, webDescription: e.target.value})}
              placeholder="Descripción especial para la tienda web..."
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={newWebProduct.isActive}
                onChange={(e) => setNewWebProduct({...newWebProduct, isActive: e.target.checked})}
                className="h-4 w-4 text-venezia-600 focus:ring-venezia-500 border-venezia-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-venezia-900">
                Producto Activo
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                checked={newWebProduct.isFeatured}
                onChange={(e) => setNewWebProduct({...newWebProduct, isFeatured: e.target.checked})}
                className="h-4 w-4 text-venezia-600 focus:ring-venezia-500 border-venezia-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-venezia-900">
                Producto Destacado
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowProductModal(false);
                setSelectedProduct(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveWebProduct}
              disabled={submittingProduct}
            >
              {submittingProduct ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                `${selectedProduct ? 'Actualizar' : 'Agregar'} Producto`
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalles Orden */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        title="Detalles de Orden"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-venezia-700">Orden #</label>
                <p className="mt-1 text-sm text-venezia-900">{selectedOrder.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-venezia-700">Estado Actual</label>
                <Select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  className="mt-1"
                >
                  {orderStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-venezia-700">Cliente</label>
              <p className="mt-1 text-sm text-venezia-900">{selectedOrder.customerName}</p>
              <p className="text-sm text-venezia-500">{selectedOrder.customerEmail}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-venezia-700">Total</label>
              <p className="mt-1 text-lg font-semibold text-venezia-900">${selectedOrder.total?.toFixed(2)}</p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowOrderModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShopPage; 