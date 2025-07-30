import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, MapPin, Clock, Phone, Mail, Globe, 
  DollarSign, Users, Package, Wifi, Car, 
  Utensils, ShoppingBag, Building, Plus, Minus,
  Copy, Check, AlertCircle, Navigation, Star
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const BranchModal = ({ branch, onClose, onSave }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    coordinates: { lat: null, lng: null },
    timezone: 'America/Argentina/Buenos_Aires',
    opening_hours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '12:00', close: '22:00' }
    },
    features: [],
    settings: {
      max_delivery_distance: 5,
      delivery_fee: 200,
      min_order_amount: 1000,
      tax_rate: 21,
      currency: 'ARS'
    },
    is_main_branch: false,
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [copiedDay, setCopiedDay] = useState(null);

  const availableFeatures = [
    { id: 'delivery', label: 'Delivery', icon: ShoppingBag, color: 'bg-purple-500' },
    { id: 'dine_in', label: 'Salón', icon: Utensils, color: 'bg-orange-500' },
    { id: 'takeaway', label: 'Para llevar', icon: Package, color: 'bg-green-500' },
    { id: 'wholesale', label: 'Mayorista', icon: Building, color: 'bg-blue-500' },
    { id: 'parking', label: 'Parking', icon: Car, color: 'bg-indigo-500' },
    { id: 'wifi', label: 'WiFi', icon: Wifi, color: 'bg-cyan-500' },
    { id: 'outdoor', label: 'Terraza', icon: Utensils, color: 'bg-yellow-500' },
    { id: 'accessibility', label: 'Accesible', icon: Users, color: 'bg-pink-500' }
  ];

  const tabs = [
    { id: 'basic', label: 'Información', icon: Building },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'hours', label: 'Horarios', icon: Clock },
    { id: 'features', label: 'Características', icon: Star },
    { id: 'settings', label: 'Configuración', icon: DollarSign }
  ];

  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  useEffect(() => {
    if (branch) {
      setFormData({
        ...branch,
        opening_hours: branch.opening_hours || formData.opening_hours,
        features: branch.features || [],
        settings: { ...formData.settings, ...branch.settings }
      });
    }
  }, [branch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleHoursChange = (day, type, value) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [type]: value
        }
      }
    }));
  };

  const toggleFeature = (featureId) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const geocodeAddress = async () => {
    if (!formData.address) {
      showError('Ingresa una dirección para buscar las coordenadas');
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        handleInputChange('coordinates', {
          lat: location.lat,
          lng: location.lng
        });
        success('Coordenadas encontradas');
      } else {
        showError('No se encontraron coordenadas para esta dirección');
      }
    } catch (error) {
      console.error('Error geocoding:', error);
      showError('Error al buscar coordenadas');
    } finally {
      setGeocoding(false);
    }
  };

  const generateCode = () => {
    const prefix = formData.name.substring(0, 3).toUpperCase() || 'SUC';
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    handleInputChange('code', `${prefix}${suffix}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.address) {
      showError('Completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        organization_id: user.organization_id || 'demo'
      };

      if (branch) {
        const { error } = await supabase
          .from('branches')
          .update(dataToSave)
          .eq('id', branch.id);

        if (error) throw error;
        success('Sucursal actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('branches')
          .insert(dataToSave);

        if (error) throw error;
        success('Sucursal creada correctamente');
      }

      onSave();
    } catch (error) {
      console.error('Error saving branch:', error);
      showError('Error al guardar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  const copyHours = (fromDay) => {
    const hours = formData.opening_hours[fromDay];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const newHours = { ...formData.opening_hours };
    days.forEach(day => {
      if (day !== fromDay) {
        newHours[day] = { ...hours };
      }
    });
    
    setFormData(prev => ({
      ...prev,
      opening_hours: newHours
    }));
    
    setCopiedDay(fromDay);
    setTimeout(() => setCopiedDay(null), 2000);
    success('Horarios copiados a todos los días');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Nombre de la Sucursal *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Ej: Heladería Venezia - Centro"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Código Único *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="SUC001"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 group"
                    title="Generar código automático"
                  >
                    <Plus className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-200" />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="+54 11 4567-8900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="sucursal@venezia.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_main_branch}
                  onChange={(e) => handleInputChange('is_main_branch', e.target.checked)}
                  className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Sucursal Principal
                </span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-4 focus:ring-green-500/20 transition-all duration-200"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Sucursal Activa
                </span>
              </label>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Dirección Completa *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  placeholder="Av. Corrientes 1234, CABA"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={geocodeAddress}
                  disabled={geocoding}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Navigation className={`h-5 w-5 ${geocoding ? 'animate-pulse' : ''}`} />
                  {geocoding ? 'Buscando...' : 'Obtener Coordenadas'}
                </motion.button>
              </div>
            </div>

            {formData.coordinates.lat && formData.coordinates.lng && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Coordenadas encontradas
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Latitud
                    </label>
                    <input
                      type="number"
                      value={formData.coordinates.lat}
                      onChange={(e) => handleInputChange('coordinates', { ...formData.coordinates, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      step="0.000001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Longitud
                    </label>
                    <input
                      type="number"
                      value={formData.coordinates.lng}
                      onChange={(e) => handleInputChange('coordinates', { ...formData.coordinates, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      step="0.000001"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Las coordenadas son necesarias para mostrar la sucursal en el mapa y calcular distancias de delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Horarios de Atención
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Haz clic en copiar para aplicar el mismo horario a todos los días
              </p>
            </div>
            
            {Object.entries(formData.opening_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-32">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {dayNames[day]}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <span className="text-gray-500 dark:text-gray-400">a</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => copyHours(day)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Copiar a todos los días"
                >
                  {copiedDay === day ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                Selecciona las características de esta sucursal
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableFeatures.map(feature => {
                  const Icon = feature.icon;
                  const isSelected = formData.features.includes(feature.id);
                  
                  return (
                    <motion.button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${isSelected ? feature.color : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center mx-auto mb-2 transition-all duration-200`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Radio de Delivery (km)
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.settings.max_delivery_distance}
                    onChange={(e) => handleSettingChange('max_delivery_distance', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Costo de Delivery
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.settings.delivery_fee}
                    onChange={(e) => handleSettingChange('delivery_fee', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Pedido Mínimo
                </label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.settings.min_order_amount}
                    onChange={(e) => handleSettingChange('min_order_amount', parseFloat(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  value={formData.settings.tax_rate}
                  onChange={(e) => handleSettingChange('tax_rate', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {branch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                  </h2>
                  <p className="text-blue-100">
                    Configura todos los detalles de tu sucursal
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={onClose}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-200"
                >
                  <X className="h-6 w-6 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                        activeTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                          : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-gray-950" style={{ maxHeight: 'calc(90vh - 280px)' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  * Campos obligatorios
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-5 w-5" />
                        </motion.div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {branch ? 'Actualizar' : 'Crear'} Sucursal
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BranchModal;