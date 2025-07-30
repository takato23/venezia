import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Clock,
  Gift,
  MessageSquare,
  BarChart3,
  Save,
  X,
  Plus,
  Trash2,
  Edit,
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Package,
  Store,
  Phone,
  Mail,
  Instagram,
  Facebook,
  ChevronRight,
  Toggle,
  Eye,
  EyeOff
} from 'lucide-react';

const SimpleConfig = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Estados de configuración
  const [storeInfo, setStoreInfo] = useState({
    name: 'Heladería Venezia',
    phone: '+54 11 1234-5678',
    email: 'info@heladeria.com',
    address: 'Av. Callao 1234, CABA',
    instagram: '@heladeria_venezia',
    facebook: 'heladeriavenecia'
  });
  
  const [schedule, setSchedule] = useState({
    monday: { open: '12:00', close: '23:00', closed: false },
    tuesday: { open: '12:00', close: '23:00', closed: false },
    wednesday: { open: '12:00', close: '23:00', closed: false },
    thursday: { open: '12:00', close: '23:00', closed: false },
    friday: { open: '12:00', close: '00:00', closed: false },
    saturday: { open: '12:00', close: '00:00', closed: false },
    sunday: { open: '12:00', close: '23:00', closed: false }
  });
  
  const [announcements, setAnnouncements] = useState([
    { id: 1, text: '¡Nuevos sabores veganos disponibles!', active: true },
    { id: 2, text: '2x1 en helados los martes', active: false }
  ]);
  
  const [simpleRewards, setSimpleRewards] = useState({
    enabled: true,
    pointsPerPurchase: 10,
    pointsForFreeItem: 100,
    freeItemText: 'Helado simple gratis'
  });
  
  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    minOrder: 500,
    deliveryFee: 150,
    freeDeliveryFrom: 2000,
    estimatedTime: '30-45 min'
  });
  
  const tabs = [
    { id: 'general', name: 'Información General', icon: Store },
    { id: 'schedule', name: 'Horarios', icon: Clock },
    { id: 'rewards', name: 'Programa de Puntos', icon: Gift },
    { id: 'announcements', name: 'Anuncios', icon: MessageSquare },
    { id: 'delivery', name: 'Delivery', icon: Package },
    { id: 'stats', name: 'Estadísticas', icon: BarChart3 }
  ];
  
  const handleSave = () => {
    setShowSuccess(true);
    setUnsavedChanges(false);
    setTimeout(() => setShowSuccess(false), 3000);
    // Aquí se enviarían los datos al backend
  };
  
  const getDayName = (day) => {
    const names = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return names[day];
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Panel de Configuración</h2>
              <p className="text-pink-100">Gestiona tu tienda de forma simple</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-50 px-6 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-purple-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Información General */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Esta información aparecerá en tu tienda web y será visible para todos los clientes.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la tienda
                    </label>
                    <input
                      type="text"
                      value={storeInfo.name}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, name: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={storeInfo.phone}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, phone: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={storeInfo.email}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, email: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={storeInfo.address}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, address: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={storeInfo.instagram}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, instagram: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="@usuario"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={storeInfo.facebook}
                      onChange={(e) => {
                        setStoreInfo({ ...storeInfo, facebook: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="pagina"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Horarios */}
            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Los clientes verán estos horarios y sabrán cuándo pueden visitarte o hacer pedidos.
                  </p>
                </div>
                
                {Object.entries(schedule).map(([day, hours]) => (
                  <div key={day} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="font-medium text-gray-800 w-24">{getDayName(day)}</h3>
                        
                        {!hours.closed && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => {
                                setSchedule({
                                  ...schedule,
                                  [day]: { ...hours, open: e.target.value }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="px-3 py-2 border border-gray-200 rounded-lg"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => {
                                setSchedule({
                                  ...schedule,
                                  [day]: { ...hours, close: e.target.value }
                                });
                                setUnsavedChanges(true);
                              }}
                              className="px-3 py-2 border border-gray-200 rounded-lg"
                            />
                          </div>
                        )}
                        
                        {hours.closed && (
                          <span className="text-red-600 font-medium">Cerrado</span>
                        )}
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-600">Cerrado</span>
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => {
                            setSchedule({
                              ...schedule,
                              [day]: { ...hours, closed: e.target.checked }
                            });
                            setUnsavedChanges(true);
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* Programa de Puntos Simple */}
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-800 flex items-start gap-2">
                    <Gift className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Un programa simple que premia la fidelidad de tus clientes.
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Programa de Puntos</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">
                        {simpleRewards.enabled ? 'Activado' : 'Desactivado'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={simpleRewards.enabled}
                          onChange={(e) => {
                            setSimpleRewards({ ...simpleRewards, enabled: e.target.checked });
                            setUnsavedChanges(true);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          simpleRewards.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            simpleRewards.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {simpleRewards.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Puntos por cada compra
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={simpleRewards.pointsPerPurchase}
                            onChange={(e) => {
                              setSimpleRewards({ ...simpleRewards, pointsPerPurchase: parseInt(e.target.value) || 0 });
                              setUnsavedChanges(true);
                            }}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="1"
                            max="100"
                          />
                          <span className="text-gray-600">puntos</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Puntos necesarios para premio
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={simpleRewards.pointsForFreeItem}
                            onChange={(e) => {
                              setSimpleRewards({ ...simpleRewards, pointsForFreeItem: parseInt(e.target.value) || 0 });
                              setUnsavedChanges(true);
                            }}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="10"
                            max="1000"
                            step="10"
                          />
                          <span className="text-gray-600">puntos</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Premio al completar puntos
                        </label>
                        <input
                          type="text"
                          value={simpleRewards.freeItemText}
                          onChange={(e) => {
                            setSimpleRewards({ ...simpleRewards, freeItemText: e.target.value });
                            setUnsavedChanges(true);
                          }}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Ej: Helado simple gratis"
                        />
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-gray-700">
                          <strong>Ejemplo:</strong> Si un cliente compra {Math.ceil(simpleRewards.pointsForFreeItem / simpleRewards.pointsPerPurchase)} veces, 
                          obtiene "{simpleRewards.freeItemText}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Anuncios */}
            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-purple-800 flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Los anuncios aparecen en la parte superior de tu tienda web.
                  </p>
                </div>
                
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={announcement.active}
                          onChange={(e) => {
                            setAnnouncements(announcements.map(a => 
                              a.id === announcement.id ? { ...a, active: e.target.checked } : a
                            ));
                            setUnsavedChanges(true);
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={announcement.text}
                          onChange={(e) => {
                            setAnnouncements(announcements.map(a => 
                              a.id === announcement.id ? { ...a, text: e.target.value } : a
                            ));
                            setUnsavedChanges(true);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Escribe tu anuncio aquí..."
                        />
                        <button
                          onClick={() => {
                            setAnnouncements(announcements.filter(a => a.id !== announcement.id));
                            setUnsavedChanges(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setAnnouncements([...announcements, {
                        id: Date.now(),
                        text: '',
                        active: true
                      }]);
                      setUnsavedChanges(true);
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Agregar anuncio
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Delivery */}
            {activeTab === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Configuración de Delivery</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">
                        {deliverySettings.enabled ? 'Activado' : 'Desactivado'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={deliverySettings.enabled}
                          onChange={(e) => {
                            setDeliverySettings({ ...deliverySettings, enabled: e.target.checked });
                            setUnsavedChanges(true);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          deliverySettings.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            deliverySettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {deliverySettings.enabled && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pedido mínimo
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            value={deliverySettings.minOrder}
                            onChange={(e) => {
                              setDeliverySettings({ ...deliverySettings, minOrder: parseInt(e.target.value) || 0 });
                              setUnsavedChanges(true);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                            step="100"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Costo de envío
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            value={deliverySettings.deliveryFee}
                            onChange={(e) => {
                              setDeliverySettings({ ...deliverySettings, deliveryFee: parseInt(e.target.value) || 0 });
                              setUnsavedChanges(true);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                            step="50"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Envío gratis desde
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            value={deliverySettings.freeDeliveryFrom}
                            onChange={(e) => {
                              setDeliverySettings({ ...deliverySettings, freeDeliveryFrom: parseInt(e.target.value) || 0 });
                              setUnsavedChanges(true);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                            step="500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tiempo estimado
                        </label>
                        <input
                          type="text"
                          value={deliverySettings.estimatedTime}
                          onChange={(e) => {
                            setDeliverySettings({ ...deliverySettings, estimatedTime: e.target.value });
                            setUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Ej: 30-45 min"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Estadísticas */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-8 w-8 text-blue-600" />
                      <span className="text-xs text-green-600 font-medium">+12%</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">1,234</p>
                    <p className="text-sm text-gray-600">Visitas hoy</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <ShoppingCart className="h-8 w-8 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+8%</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">45</p>
                    <p className="text-sm text-gray-600">Pedidos hoy</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-8 w-8 text-purple-600" />
                      <span className="text-xs text-green-600 font-medium">+15%</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">$23,450</p>
                    <p className="text-sm text-gray-600">Ventas hoy</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Heart className="h-8 w-8 text-pink-600" />
                      <span className="text-xs text-gray-600 font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">892</p>
                    <p className="text-sm text-gray-600">Clientes con puntos</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos más vendidos hoy</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍦</span>
                        <div>
                          <p className="font-medium text-gray-800">Chocolate Belga</p>
                          <p className="text-sm text-gray-600">23 unidades</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-800">$4,830</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍨</span>
                        <div>
                          <p className="font-medium text-gray-800">Dulce de Leche</p>
                          <p className="text-sm text-gray-600">18 unidades</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-800">$3,780</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍧</span>
                        <div>
                          <p className="font-medium text-gray-800">Limón Granizado</p>
                          <p className="text-sm text-gray-600">15 unidades</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-800">$2,850</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer con botones de acción */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              {unsavedChanges && (
                <p className="text-sm text-orange-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Tienes cambios sin guardar
                </p>
              )}
              {showSuccess && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-green-600 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Cambios guardados correctamente
                </motion.p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!unsavedChanges}
                className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                  unsavedChanges
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="h-5 w-5" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SimpleConfig;