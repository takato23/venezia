import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ArrowRight, Plus, Minus, Search, 
  Check, X, Clock, Truck, AlertCircle
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const StockTransfer = ({ isOpen, onClose, fromBranch }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [branches, setBranches] = useState([]);
  const [toBranch, setToBranch] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, fromBranch]);

  const loadData = async () => {
    try {
      // Cargar sucursales (excepto la actual)
      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .neq('id', fromBranch.id);
      
      setBranches(branchData || []);

      // Cargar inventario de la sucursal actual
      const { data: inventoryData } = await supabase
        .from('branch_inventory')
        .select(`
          *,
          products(name, category, unit)
        `)
        .eq('branch_id', fromBranch.id)
        .gt('current_stock', 0);
      
      setProducts(inventoryData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar datos');
    }
  };

  const handleProductToggle = (product) => {
    const exists = selectedProducts.find(p => p.product_id === product.product_id);
    
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.product_id !== product.product_id));
    } else {
      setSelectedProducts([...selectedProducts, {
        ...product,
        transferQuantity: 1
      }]);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const product = products.find(p => p.product_id === productId);
    const maxQuantity = product.current_stock;
    
    if (quantity < 0 || quantity > maxQuantity) return;
    
    setSelectedProducts(selectedProducts.map(p => 
      p.product_id === productId 
        ? { ...p, transferQuantity: quantity }
        : p
    ));
  };

  const handleTransferRequest = async () => {
    if (!toBranch || selectedProducts.length === 0) {
      showError('Selecciona una sucursal destino y al menos un producto');
      return;
    }

    setLoading(true);
    try {
      // Crear solicitud de transferencia
      const { data: transfer, error: transferError } = await supabase
        .from('branch_transfers')
        .insert({
          from_branch_id: fromBranch.id,
          to_branch_id: toBranch.id,
          status: 'pending',
          requested_by: user.id,
          notes
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Crear items de transferencia
      const transferItems = selectedProducts.map(product => ({
        transfer_id: transfer.id,
        product_id: product.product_id,
        requested_quantity: product.transferQuantity,
        unit: product.stock_unit
      }));

      await supabase
        .from('transfer_items')
        .insert(transferItems);

      success('Solicitud de transferencia creada exitosamente');
      onClose();
      
      // Notificar a la sucursal destino
      await notifyBranch(toBranch, transfer);
      
    } catch (error) {
      console.error('Error creating transfer:', error);
      showError('Error al crear la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const notifyBranch = async (branch, transfer) => {
    // Aquí puedes implementar notificaciones push, email, etc.
    console.log('Notifying branch:', branch.name, 'about transfer:', transfer.id);
  };

  const filteredProducts = products.filter(product =>
    product.products.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Transferencia de Stock</h2>
                  <p className="text-gray-600">Desde {fromBranch.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Destination Branch */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal Destino
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branches.map(branch => (
                  <motion.button
                    key={branch.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setToBranch(branch)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      toBranch?.id === branch.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-semibold">{branch.name}</p>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                      </div>
                      {toBranch?.id === branch.id && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Product Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const isSelected = selectedProducts.find(p => p.product_id === product.product_id);
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleProductToggle(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100'
                          }`}
                        >
                          {isSelected ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                        </button>
                        
                        <div>
                          <p className="font-semibold">{product.products.name}</p>
                          <p className="text-sm text-gray-600">
                            Stock disponible: {product.current_stock} {product.stock_unit}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(
                              product.product_id, 
                              isSelected.transferQuantity - 1
                            )}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input
                            type="number"
                            value={isSelected.transferQuantity}
                            onChange={(e) => handleQuantityChange(
                              product.product_id,
                              parseInt(e.target.value) || 0
                            )}
                            className="w-20 px-2 py-1 text-center border rounded"
                            min="1"
                            max={product.current_stock}
                          />
                          
                          <button
                            onClick={() => handleQuantityChange(
                              product.product_id, 
                              isSelected.transferQuantity + 1
                            )}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          
                          <span className="text-sm text-gray-600 ml-2">
                            {product.stock_unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre esta transferencia..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            {/* Summary */}
            {selectedProducts.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Resumen de Transferencia</h4>
                <div className="space-y-1 text-sm">
                  <p>Desde: <span className="font-medium">{fromBranch.name}</span></p>
                  <p>Hacia: <span className="font-medium">{toBranch?.name || 'No seleccionada'}</span></p>
                  <p>Productos: <span className="font-medium">{selectedProducts.length}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                <span>La transferencia requiere aprobación del encargado</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransferRequest}
                  disabled={loading || !toBranch || selectedProducts.length === 0}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                           flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Solicitar Transferencia
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockTransfer;