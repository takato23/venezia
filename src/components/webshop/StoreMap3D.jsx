import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map,
  Navigation,
  Info,
  Clock,
  Phone,
  Mail,
  MapPin,
  Car,
  Bike,
  PersonStanding,
  Bus,
  Calendar,
  Star,
  Coffee,
  Utensils,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Compass,
  Layers,
  Eye,
  X
} from 'lucide-react';

const StoreMap3D = () => {
  const [activeView, setActiveView] = useState('3d');
  const [selectedArea, setSelectedArea] = useState(null);
  const [transportMode, setTransportMode] = useState('car');
  const [showDirections, setShowDirections] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const mapRef = useRef(null);
  
  // Áreas de la tienda
  const storeAreas = [
    {
      id: 'entrance',
      name: 'Entrada Principal',
      icon: MapPin,
      description: 'Acceso principal con rampa',
      x: 50,
      y: 90,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'counter',
      name: 'Mostrador de Helados',
      icon: ShoppingBag,
      description: '24 sabores artesanales',
      x: 50,
      y: 50,
      color: 'from-pink-400 to-pink-600'
    },
    {
      id: 'seating',
      name: 'Área de Mesas',
      icon: Coffee,
      description: 'Espacio climatizado para 30 personas',
      x: 25,
      y: 50,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'takeaway',
      name: 'Para Llevar',
      icon: Utensils,
      description: 'Pedidos rápidos y delivery',
      x: 75,
      y: 50,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'parking',
      name: 'Estacionamiento',
      icon: Car,
      description: 'Parking gratuito para clientes',
      x: 50,
      y: 10,
      color: 'from-gray-400 to-gray-600'
    }
  ];
  
  // Información de transporte
  const transportInfo = {
    car: {
      time: '10 min',
      distance: '3.2 km',
      instructions: 'Por Av. Libertador, girar en Callao'
    },
    bike: {
      time: '15 min',
      distance: '3.2 km',
      instructions: 'Carril bici disponible en Av. del Libertador'
    },
    walk: {
      time: '25 min',
      distance: '2.1 km',
      instructions: 'Caminar por Av. Santa Fe hasta Callao'
    },
    bus: {
      time: '20 min',
      lines: ['152', '29', '64'],
      instructions: 'Parada a 100m en Av. Callao'
    }
  };
  
  // Simular rotación automática en vista 3D
  useEffect(() => {
    if (activeView === '3d' && !selectedArea) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeView, selectedArea]);
  
  const handleAreaClick = (area) => {
    setSelectedArea(area);
    setRotation(0);
  };
  
  const getTransportIcon = (mode) => {
    switch(mode) {
      case 'car': return Car;
      case 'bike': return Bike;
      case 'walk': return PersonStanding;
      case 'bus': return Bus;
      default: return Car;
    }
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full mb-4">
            <Map className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Ubicación y Mapa 3D</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Visítanos en nuestra
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> heladería</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explora nuestro local en 3D y descubre cómo llegar fácilmente
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mapa principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Controles del mapa */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveView('3d')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeView === '3d'
                          ? 'bg-white shadow-md text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Eye className="inline-block w-4 h-4 mr-2" />
                      Vista 3D
                    </button>
                    <button
                      onClick={() => setActiveView('2d')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeView === '2d'
                          ? 'bg-white shadow-md text-blue-600'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Layers className="inline-block w-4 h-4 mr-2" />
                      Plano 2D
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMapZoom(Math.max(0.5, mapZoom - 0.2))}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <ZoomOut className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setMapZoom(Math.min(2, mapZoom + 0.2))}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <ZoomIn className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setRotation(0)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <Compass className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Área del mapa */}
              <div
                ref={mapRef}
                className="relative h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden"
              >
                {activeView === '3d' ? (
                  // Vista 3D
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `scale(${mapZoom}) rotateX(-30deg) rotateZ(${rotation}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* Base del edificio */}
                    <div className="relative w-80 h-80">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg shadow-2xl transform-gpu"
                           style={{ transform: 'translateZ(0px)' }}>
                        {/* Piso */}
                        <div className="absolute inset-4 bg-gradient-to-br from-white to-gray-100 rounded">
                          {storeAreas.map((area) => (
                            <motion.div
                              key={area.id}
                              whileHover={{ scale: 1.1, zIndex: 10 }}
                              onClick={() => handleAreaClick(area)}
                              className={`absolute cursor-pointer bg-gradient-to-br ${area.color} rounded-lg shadow-lg transform-gpu transition-all`}
                              style={{
                                left: `${area.x}%`,
                                top: `${area.y}%`,
                                width: area.id === 'counter' ? '40%' : '20%',
                                height: area.id === 'counter' ? '30%' : '20%',
                                transform: `translate(-50%, -50%) translateZ(${area.id === 'counter' ? '30px' : '20px'})`
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center text-white">
                                <area.icon className="h-6 w-6" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Paredes */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Pared frontal */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-400 to-gray-300 transform-gpu"
                             style={{ transform: 'rotateX(90deg) translateZ(40px)' }} />
                        {/* Pared trasera */}
                        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-400 to-gray-300 transform-gpu"
                             style={{ transform: 'rotateX(-90deg) translateZ(40px)' }} />
                        {/* Pared izquierda */}
                        <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-gray-400 to-gray-300 transform-gpu"
                             style={{ transform: 'rotateY(-90deg) translateZ(40px)' }} />
                        {/* Pared derecha */}
                        <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-gray-400 to-gray-300 transform-gpu"
                             style={{ transform: 'rotateY(90deg) translateZ(40px)' }} />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Vista 2D
                  <div
                    className="absolute inset-0 p-8"
                    style={{ transform: `scale(${mapZoom})` }}
                  >
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner">
                      {storeAreas.map((area) => (
                        <motion.div
                          key={area.id}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleAreaClick(area)}
                          className={`absolute cursor-pointer bg-gradient-to-br ${area.color} rounded-lg shadow-md p-4`}
                          style={{
                            left: `${area.x}%`,
                            top: `${area.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: area.id === 'counter' ? '40%' : '25%',
                            height: area.id === 'counter' ? '30%' : '20%'
                          }}
                        >
                          <div className="flex flex-col items-center justify-center h-full text-white">
                            <area.icon className="h-8 w-8 mb-2" />
                            <span className="text-sm font-medium text-center">{area.name}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Información del área seleccionada */}
                <AnimatePresence>
                  {selectedArea && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${selectedArea.color} rounded-lg flex items-center justify-center`}>
                            <selectedArea.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{selectedArea.name}</h3>
                            <p className="text-sm text-gray-600">{selectedArea.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedArea(null)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* Panel de información */}
          <div className="space-y-6">
            {/* Dirección y horarios */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Información del Local
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Dirección</p>
                    <p className="text-sm text-gray-600">Av. Callao 1234, CABA</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Horarios</p>
                    <p className="text-sm text-gray-600">Lun-Dom: 12:00 - 23:00</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Teléfono</p>
                    <p className="text-sm text-gray-600">+54 11 1234-5678</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-sm text-gray-600">info@heladeria.com</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowDirections(true)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="h-5 w-5" />
                Cómo llegar
              </button>
            </motion.div>
            
            {/* Características del local */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-600" />
                Características
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  WiFi Gratis
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Aire Acondicionado
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Acceso Silla de Ruedas
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Área para Niños
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Pet Friendly
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Pagos Digitales
                </div>
              </div>
            </motion.div>
            
            {/* Reseñas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Calificación
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-800">4.8</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Basado en 2,345 reseñas
                  </p>
                  <div className="mt-2 space-y-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-2">{rating}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                            style={{
                              width: `${rating === 5 ? 75 : rating === 4 ? 20 : 5}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Modal de direcciones */}
        <AnimatePresence>
          {showDirections && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDirections(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Cómo llegar</h3>
                    <button
                      onClick={() => setShowDirections(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Selector de transporte */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {['car', 'bike', 'walk', 'bus'].map((mode) => {
                      const Icon = getTransportIcon(mode);
                      return (
                        <button
                          key={mode}
                          onClick={() => setTransportMode(mode)}
                          className={`p-4 rounded-xl transition-all ${
                            transportMode === mode
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs font-medium capitalize">{mode === 'walk' ? 'Caminar' : mode}</p>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Información de ruta */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-3xl font-bold text-gray-800">
                          {transportInfo[transportMode].time}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transportInfo[transportMode].distance || `Líneas: ${transportInfo[transportMode].lines?.join(', ')}`}
                        </p>
                      </div>
                      <div className={`w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center`}>
                        {React.createElement(getTransportIcon(transportMode), { className: 'h-8 w-8 text-blue-600' })}
                      </div>
                    </div>
                    <p className="text-gray-700">{transportInfo[transportMode].instructions}</p>
                  </div>
                  
                  {/* Mapa embebido (simulado) */}
                  <div className="bg-gray-200 rounded-2xl h-64 mb-6 flex items-center justify-center">
                    <p className="text-gray-500">Mapa interactivo aquí</p>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all">
                      Abrir en Google Maps
                    </button>
                    <button className="py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all">
                      Compartir ubicación
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default StoreMap3D;