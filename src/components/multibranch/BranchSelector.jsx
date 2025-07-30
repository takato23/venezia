import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, Clock, ChevronDown, Check } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const BranchSelector = ({ onBranchChange, currentBranch }) => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentBranch);

  useEffect(() => {
    loadUserBranches();
  }, [user]);

  const loadUserBranches = async () => {
    if (!user) return;

    try {
      // Cargar sucursales a las que el usuario tiene acceso
      const { data } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .in('id', user.branch_access || []);

      setBranches(data || []);

      // Si no hay sucursal seleccionada, seleccionar la primera
      if (!selectedBranch && data && data.length > 0) {
        const mainBranch = data.find(b => b.is_main_branch) || data[0];
        setSelectedBranch(mainBranch);
        onBranchChange(mainBranch);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    onBranchChange(branch);
    setIsOpen(false);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('selectedBranchId', branch.id);
  };

  const isOpenNow = (branch) => {
    if (!branch.opening_hours) return true;
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = branch.opening_hours[dayName];
    if (!todayHours) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  if (branches.length <= 1) {
    return null; // No mostrar selector si solo hay una sucursal
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <Store className="h-5 w-5 text-blue-500" />
        <div className="text-left">
          <p className="font-semibold text-sm">{selectedBranch?.name || 'Seleccionar Sucursal'}</p>
          {selectedBranch && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {selectedBranch.address?.split(',')[0]}
            </p>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2">
              {branches.map(branch => {
                const isSelected = selectedBranch?.id === branch.id;
                const isOpen = isOpenNow(branch);
                
                return (
                  <motion.button
                    key={branch.id}
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleBranchSelect(branch)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{branch.name}</p>
                          {branch.is_main_branch && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{branch.address}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs flex items-center gap-1 ${
                            isOpen ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                          {branch.phone && (
                            <span className="text-xs text-gray-500">
                              {branch.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Quick stats */}
            <div className="border-t px-4 py-3 bg-gray-50">
              <p className="text-xs text-gray-600">
                Tienes acceso a {branches.length} sucursales
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchSelector;