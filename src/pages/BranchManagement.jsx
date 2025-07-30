import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, MapPin, Clock, Phone, Mail, Users, Package,
  TrendingUp, Edit, Trash2, Eye, Settings, Navigation,
  DollarSign, AlertCircle, Check, X, Copy, ExternalLink,
  BarChart3, Wifi, WifiOff, Star, Calendar, Filter
} from 'lucide-react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';
import BranchModal from '../components/multibranch/BranchModal';
import BranchMetrics from '../components/multibranch/BranchMetrics';

const BranchManagement = () => {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: -34.603684, lng: -58.381559 });
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      
      const { data: branchData } = await supabase
        .from('branches')
        .select(`
          *,
          branch_inventory(count),
          sales(count, total_amount)
        `)
        .eq('organization_id', user?.organization_id || 'demo')
        .order('created_at', { ascending: false });

      const branchesWithMetrics = await Promise.all(
        (branchData || []).map(async (branch) => {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: monthSales } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('branch_id', branch.id)
            .gte('created_at', startOfMonth.toISOString());

          const monthRevenue = monthSales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

          const { count: employeeCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .contains('branch_access', [branch.id]);

          const isOnline = Math.random() > 0.1;

          return {
            ...branch,
            monthRevenue,
            employeeCount: employeeCount || 0,
            isOnline,
            inventoryItems: branch.branch_inventory?.[0]?.count || 0
          };
        })
      );

      setBranches(branchesWithMetrics);
      
      if (branchesWithMetrics.length > 0 && branchesWithMetrics[0].coordinates) {
        setMapCenter({
          lat: branchesWithMetrics[0].coordinates.lat,
          lng: branchesWithMetrics[0].coordinates.lng
        });
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      showError('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = () => {
    setSelectedBranch(null);
    setShowModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;

    try {
      await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', branchId);

      success('Sucursal desactivada correctamente');
      loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      showError('Error al eliminar sucursal');
    }
  };

  const handleDuplicateBranch = async (branch) => {
    try {
      const newBranch = {
        ...branch,
        name: `${branch.name} (Copia)`,
        code: `${branch.code}-COPY`,
        is_main_branch: false
      };
      
      delete newBranch.id;
      delete newBranch.created_at;
      delete newBranch.updated_at;

      const { error } = await supabase
        .from('branches')
        .insert(newBranch);

      if (error) throw error;

      success('Sucursal duplicada correctamente');
      loadBranches();
    } catch (error) {
      console.error('Error duplicating branch:', error);
      showError('Error al duplicar sucursal');
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && branch.is_active) ||
      (filter === 'inactive' && !branch.is_active);
    
    const matchesSearch = branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const BranchCard = ({ branch }) => {
    const isOpen = checkIfOpen(branch);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-gray-950 rounded-xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-2xl dark:hover:shadow-gray-950/60"
      >
        {/* Header */}
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                branch.is_main_branch 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}>
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{branch.name}</h3>
                  {branch.is_main_branch && (
                    <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                      Principal
                    </span>
                  )}
                  <div className={`flex items-center gap-1 ${
                    branch.isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {branch.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="text-sm font-medium">{branch.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-300 mt-1">{branch.code}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEditBranch(branch)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleDuplicateBranch(branch)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Duplicar"
              >
                <Copy className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleDeleteBranch(branch.id)}
                className="p-3 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 text-base">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <MapPin className="h-5 w-5" />
              <span>{branch.address}</span>
            </div>
            
            {branch.phone && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Phone className="h-5 w-5" />
                <span>{branch.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className={isOpen ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400'}>
                {isOpen ? 'Abierto ahora' : 'Cerrado'}
              </span>
              <span className="text-gray-500 dark:text-gray-300">
                {getNextOpenTime(branch)}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600 dark:text-gray-300">Ventas del mes</span>
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(branch.monthRevenue)}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-600 dark:text-gray-300">Empleados</span>
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2">{branch.employeeCount}</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-3 mt-6">
            {branch.features?.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full"
              >
                {getFeatureLabel(feature)}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t dark:border-gray-800 px-8 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateToBranch(branch)}
              className="flex items-center gap-3 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Navigation className="h-5 w-5" />
              Cómo llegar
            </button>
            
            <button
              onClick={() => window.open(`/branch/${branch.id}`, '_blank')}
              className="flex items-center gap-3 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              Ver detalles
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const checkIfOpen = (branch) => {
    if (!branch.opening_hours || !branch.is_active) return false;
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = branch.opening_hours?.[dayName];
    if (!todayHours || !todayHours.open || !todayHours.close) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const getNextOpenTime = (branch) => {
    if (!branch.opening_hours) return '';
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const todayHours = branch.opening_hours?.[dayName];
    
    if (todayHours && todayHours.open) {
      return `${todayHours.open} - ${todayHours.close}`;
    }
    
    return 'Horario no disponible';
  };

  const getFeatureLabel = (feature) => {
    const labels = {
      delivery: 'Delivery',
      dine_in: 'Salón',
      takeaway: 'Para llevar',
      wholesale: 'Mayorista',
      parking: 'Estacionamiento',
      wifi: 'WiFi',
      outdoor: 'Mesas al aire libre',
      accessibility: 'Accesible'
    };
    return labels[feature] || feature;
  };

  const navigateToBranch = (branch) => {
    if (branch.coordinates) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${branch.coordinates.lat},${branch.coordinates.lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-2xl border-b border-gray-200 dark:border-gray-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Gestión de Sucursales
                </h1>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
                  Administra todas las sucursales de tu heladería
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateBranch}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transform transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-6 w-6" />
                Nueva Sucursal
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-gray-500 dark:text-gray-300" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border-2 dark:border-gray-700 rounded-lg px-4 py-3 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  showMap 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-700'
                }`}
              >
                <MapPin className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {branches.filter(b => b.is_active).length}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Sucursales Activas</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {branches.filter(b => checkIfOpen(b)).length}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Abiertas Ahora</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {branches.reduce((sum, b) => sum + b.employeeCount, 0)}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Empleados Total</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                {formatCurrency(branches.reduce((sum, b) => sum + b.monthRevenue, 0))}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Ventas del Mes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      {showMap && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200" style={{ height: '500px' }}>
            {process.env.REACT_APP_GOOGLE_MAPS_API_KEY && (
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={12}
                  options={{
                    styles: [
                      {
                        elementType: "geometry",
                        stylers: [{ color: "#242f3e" }]
                      },
                      {
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#242f3e" }]
                      },
                      {
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#746855" }]
                      }
                    ]
                  }}
                >
                  {filteredBranches.map(branch => 
                    branch.coordinates && (
                      <Marker
                        key={branch.id}
                        position={{
                          lat: branch.coordinates.lat,
                          lng: branch.coordinates.lng
                        }}
                        onClick={() => setSelectedMarker(branch)}
                        icon={{
                          url: branch.isOnline 
                            ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                          scaledSize: new window.google.maps.Size(40, 40)
                        }}
                      />
                    )
                  )}
                  
                  {selectedMarker && (
                    <InfoWindow
                      position={{
                        lat: selectedMarker.coordinates.lat,
                        lng: selectedMarker.coordinates.lng
                      }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-2">
                        <h3 className="text-lg font-bold">{selectedMarker.name}</h3>
                        <p className="text-base text-gray-600">{selectedMarker.address}</p>
                        <p className="text-base mt-2">
                          {checkIfOpen(selectedMarker) ? (
                            <span className="text-green-600">Abierto</span>
                          ) : (
                            <span className="text-red-600">Cerrado</span>
                          )}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            )}
          </div>
        </div>
      )}

      {/* Branches Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-gray-400 dark:text-gray-200 mx-auto mb-6" />
            <p className="text-lg text-gray-600 dark:text-gray-300">No se encontraron sucursales</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredBranches.map(branch => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Branch Modal */}
      <AnimatePresence>
        {showModal && (
          <BranchModal
            branch={selectedBranch}
            onClose={() => {
              setShowModal(false);
              setSelectedBranch(null);
            }}
            onSave={() => {
              setShowModal(false);
              loadBranches();
            }}
          />
        )}
      </AnimatePresence>

      {/* Metrics Modal */}
      <AnimatePresence>
        {selectedBranch && !showModal && (
          <BranchMetrics
            branch={selectedBranch}
            onClose={() => setSelectedBranch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchManagement;