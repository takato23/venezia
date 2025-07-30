import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Menu, 
  X, 
  Home,
  Package,
  User,
  LogIn,
  IceCream,
  Star,
  Clock,
  MapPin
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import ProductImagePlaceholder from '../components/ui/ProductImagePlaceholder';
import Checkout from '../components/webshop/Checkout';

const WebShop = () => {
  const { success, error: showError, info } = useToast();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [shopConfig, setShopConfig] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadShopData();
    loadCartFromStorage();
  }, []);
  
  // Filtrar productos cuando cambian los filtros
  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchTerm, products]);
  
  const loadShopData = async () => {
    try {
      setLoading(true);
      
      // Usar las nuevas APIs públicas
      const [productsRes, configRes] = await Promise.all([
        fetch('/api/public/shop/products'),
        fetch('/api/public/shop/config')
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        const activeProducts = data.products?.filter(p => p.isActive) || [];
        setProducts(activeProducts);
        
        // Extraer categorías únicas
        const uniqueCategories = [...new Set(activeProducts.map(p => p.product?.category || p.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }
      
      if (configRes.ok) {
        const data = await configRes.json();
        setShopConfig(data.config || {});
      }
    } catch (error) {
      showError('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };
  
  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('venezia_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };
  
  const saveCartToStorage = (cartItems) => {
    localStorage.setItem('venezia_cart', JSON.stringify(cartItems));
  };
  
  const filterProducts = () => {
    let filtered = [...products];
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        (p.product?.category || p.category) === selectedCategory
      );
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const productName = (p.product?.name || p.name || '').toLowerCase();
        const productDescription = (p.webDescription || p.description || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return productName.includes(searchLower) || productDescription.includes(searchLower);
      });
    }
    
    setFilteredProducts(filtered);
  };
  
  const addToCart = (product) => {
    const newCart = [...cart];
    const existingItem = newCart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCart.push({
        ...product,
        quantity: 1
      });
    }
    
    setCart(newCart);
    saveCartToStorage(newCart);
    success('Agregado al carrito', `${product.product?.name || product.name} agregado`);
  };
  
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    
    setCart(newCart);
    saveCartToStorage(newCart);
  };
  
  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    saveCartToStorage(newCart);
    info('Producto eliminado', 'Producto eliminado del carrito');
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.webPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const handleOrderComplete = (order) => {
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Si estamos en checkout, mostrar ese componente
  if (showCheckout && cart.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Checkout
            cart={cart}
            shopConfig={shopConfig}
            onBack={() => setShowCheckout(false)}
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y nombre */}
            <div className="flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center ml-2 md:ml-0">
                <IceCream className="h-8 w-8 text-venezia-600" />
                <h1 className="ml-2 text-xl font-bold text-venezia-900">
                  {shopConfig.storeName || 'Venezia Gelato'}
                </h1>
              </div>
            </div>
            
            {/* Barra de búsqueda - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-venezia-500"
                />
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <User className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-venezia-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Barra de búsqueda - Mobile */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-venezia-500"
              />
            </div>
          </div>
        </div>
        
        {/* Categorías - Desktop */}
        <div className="hidden md:block border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 py-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-sm font-medium ${
                  selectedCategory === 'all' 
                    ? 'text-venezia-600 border-b-2 border-venezia-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-sm font-medium ${
                    selectedCategory === category 
                      ? 'text-venezia-600 border-b-2 border-venezia-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categorías</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setShowMobileMenu(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded ${
                  selectedCategory === 'all' 
                    ? 'bg-venezia-100 text-venezia-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos los productos
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-4 py-2 rounded ${
                    selectedCategory === category 
                      ? 'bg-venezia-100 text-venezia-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner promocional */}
        <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 mb-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-yellow-300 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-300 rounded-full opacity-20"></div>
          <h2 className="text-3xl font-bold mb-3 relative z-10">
            🍦 Helados Artesanales Venezia
          </h2>
          <p className="text-pink-100 text-lg relative z-10">
            Sabores únicos hechos con amor y los mejores ingredientes naturales
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
              🥛 100% Natural
            </span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
              🍓 Frutas Frescas
            </span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
              🌱 Opciones Veganas
            </span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
              🍰 Sin Azúcar
            </span>
          </div>
        </div>
        
        {/* Categorías especiales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🍨</div>
            <h3 className="font-semibold text-gray-800">Helados Clásicos</h3>
            <p className="text-sm text-gray-600">Sabores tradicionales</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🍒</div>
            <h3 className="font-semibold text-gray-800">Sorbetes de Fruta</h3>
            <p className="text-sm text-gray-600">100% fruta natural</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🌱</div>
            <h3 className="font-semibold text-gray-800">Línea Vegana</h3>
            <p className="text-sm text-gray-600">Sin lácteos</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-4xl mb-2">🍰</div>
            <h3 className="font-semibold text-gray-800">Postres Helados</h3>
            <p className="text-sm text-gray-600">Tortas y especialidades</p>
          </div>
        </div>
        
        {/* Grid de productos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500">
              Intenta con otra búsqueda o categoría
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const isIceCream = (product.product?.category || product.category) === 'Helados';
              const isSorbet = (product.product?.category || product.category) === 'Sorbetes';
              const isVegan = (product.product?.name || product.name || '').toLowerCase().includes('vegan');
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div className="relative">
                    <div className="aspect-w-1 aspect-h-1">
                      <ProductImagePlaceholder 
                        productName={product.product?.name || product.name}
                        size="lg"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {product.isFeatured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Destacado
                      </div>
                    )}
                    {isVegan && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        🌱 Vegano
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">
                      {product.product?.name || product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.webDescription || product.description || 'Elaborado artesanalmente con ingredientes premium'}
                    </p>
                    
                    {/* Tamaños disponibles */}
                    {isIceCream && (
                      <div className="flex gap-2 mb-3">
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                          1/4 kg
                        </span>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                          1/2 kg
                        </span>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                          1 kg
                        </span>
                      </div>
                    )}
                    
                    {isSorbet && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          🍓 100% Fruta
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Sin Lácteos
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500">Desde</span>
                        <span className="text-xl font-bold text-pink-600 block">
                          ${(product.webPrice || product.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Carrito lateral */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform z-50 ${
        showCart ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Mi Carrito</h2>
            <button
              onClick={() => setShowCart(false)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4 border-b">
                    <ProductImagePlaceholder 
                      productName={item.product?.name || item.name}
                      size="sm"
                      className="w-16 h-16 rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.product?.name || item.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ${(item.webPrice || item.price || 0).toFixed(2)} c/u
                      </p>
                      <div className="flex items-center mt-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          -
                        </button>
                        <span className="mx-3 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto text-red-500 hover:text-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-venezia-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
              <Button 
                className="w-full bg-venezia-600 hover:bg-venezia-700"
                onClick={() => setShowCheckout(true)}
              >
                Proceder al pago
              </Button>
              {shopConfig.deliveryEnabled && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Delivery disponible • Mínimo: ${shopConfig.minimumOrderAmount || 0}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay del carrito */}
      {showCart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowCart(false)}
        />
      )}
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <IceCream className="h-8 w-8 text-pink-400 mr-2" />
                <h3 className="text-xl font-bold">Venezia Gelato</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Helados artesanales elaborados con pasión desde 1985. 
                Ingredientes naturales, sabores únicos.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-gray-300">
                {shopConfig.storePhone && (
                  <p className="flex items-center text-sm">
                    <span className="mr-2">📞</span> {shopConfig.storePhone}
                  </p>
                )}
                {shopConfig.storeEmail && (
                  <p className="flex items-center text-sm">
                    <span className="mr-2">✉️</span> {shopConfig.storeEmail}
                  </p>
                )}
                {shopConfig.storeAddress && (
                  <p className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" /> {shopConfig.storeAddress}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Horarios</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Lun-Jue: 12:00 - 23:00
                </p>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Vie-Sáb: 12:00 - 00:00
                </p>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Domingo: 11:00 - 23:00
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Especialidades</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>🍨 Más de 40 sabores</p>
                <p>🌱 Opciones veganas</p>
                <p>🍰 Tortas heladas</p>
                <p>🎉 Catering para eventos</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Síguenos</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                    Instagram
                  </a>
                  <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                    Facebook
                  </a>
                  <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 {shopConfig.storeName || 'Venezia Gelato Artesanal'}. Todos los derechos reservados.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Hecho con ❤️ y mucho helado
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebShop;