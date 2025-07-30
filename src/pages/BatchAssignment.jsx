import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Factory,
  User,
  ArrowRight,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import BatchAssignment from '../components/production/BatchAssignment';
import clsx from 'clsx';

const BatchCard = ({ batch, onEdit, onDelete, onView, onAssign }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'assigned':
        return 'info';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'assigned':
        return 'Asignado';
      case 'in_progress':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Lote #{batch.batch_number || batch.id}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {batch.product_name || 'Producto desconocido'}
            </p>
          </div>
        </div>
        
        <Badge variant={getStatusColor(batch.status)}>
          {getStatusText(batch.status)}
        </Badge>
      </div>
      
      {/* Batch Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Cantidad
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {batch.quantity} {batch.unit || 'unidades'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Fecha Programada
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(batch.scheduled_date)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Asignado a
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {batch.assigned_user_name || 'Sin asignar'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Progreso
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${batch.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {batch.progress || 0}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Notes */}
      {batch.notes && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Notas
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {batch.notes}
          </p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(batch)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver
        </Button>
        
        {batch.status === 'pending' && (
          <Button
            size="sm"
            onClick={() => onAssign(batch)}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Asignar
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(batch)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(batch)}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const BatchAssignmentPage = () => {
  const location = useLocation();
  const { success, error, warning } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [sortBy, setSortBy] = useState('scheduled_date');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal States
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  
  // API Data
  const { 
    data: batches, 
    loading: loadingBatches, 
    refetch: refetchBatches 
  } = useApiCache('/api/production_batches');
  
  const { 
    data: users, 
    loading: loadingUsers 
  } = useApiCache('/api/users');
  
  const { 
    data: productionOrders, 
    loading: loadingOrders 
  } = useApiCache('/api/production_orders');
  
  // Safe data
  const safeBatches = Array.isArray(batches) ? batches : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeOrders = Array.isArray(productionOrders) ? productionOrders : [];
  
  // Filter and sort batches
  const filteredBatches = useMemo(() => {
    let filtered = safeBatches.filter(batch => {
      const matchesSearch = batch.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           batch.assigned_user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
      const matchesUser = filterUser === 'all' || batch.assigned_user_id === parseInt(filterUser);
      
      return matchesSearch && matchesStatus && matchesUser;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'scheduled_date':
          return new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0);
        case 'priority':
          return (b.priority || 0) - (a.priority || 0);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'product_name':
          return a.product_name?.localeCompare(b.product_name) || 0;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [safeBatches, searchTerm, filterStatus, filterUser, sortBy]);
  
  // Batch stats
  const batchStats = useMemo(() => {
    const total = safeBatches.length;
    const pending = safeBatches.filter(b => b.status === 'pending').length;
    const assigned = safeBatches.filter(b => b.status === 'assigned').length;
    const inProgress = safeBatches.filter(b => b.status === 'in_progress').length;
    const completed = safeBatches.filter(b => b.status === 'completed').length;
    
    return { total, pending, assigned, inProgress, completed };
  }, [safeBatches]);
  
  // Handlers
  const handleAssignBatch = (batch) => {
    setSelectedBatch(batch);
    setShowBatchAssignment(true);
  };
  
  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDetails(true);
  };
  
  const handleEditBatch = (batch) => {
    // Navigate to edit batch page or open edit modal
    console.log('Edit batch:', batch);
  };
  
  const handleDeleteBatch = async (batch) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el lote #${batch.batch_number}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/production_batches/${batch.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el lote');
      }
      
      success('Lote eliminado', `Lote #${batch.batch_number} eliminado exitosamente`);
      refetchBatches();
      
    } catch (err) {
      error('Error', err.message || 'Error al eliminar el lote');
    }
  };
  
  const handleAssignmentSave = async (assignmentData) => {
    try {
      const response = await fetch(`/api/production_batches/${selectedBatch.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        throw new Error('Error al asignar el lote');
      }
      
      success('Lote asignado', 'El lote ha sido asignado exitosamente');
      setShowBatchAssignment(false);
      setSelectedBatch(null);
      refetchBatches();
      
    } catch (err) {
      error('Error', err.message || 'Error al asignar el lote');
    }
  };
  
  const loading = loadingBatches || loadingUsers || loadingOrders;
  
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asignar Lotes</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona la asignación de lotes de producción</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Lotes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{batchStats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{batchStats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Asignados</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{batchStats.assigned}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{batchStats.inProgress}</p>
            </div>
            <Factory className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{batchStats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Input
            placeholder="Buscar lotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={filterStatus} onChange={setFilterStatus}>
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="assigned">Asignados</option>
          <option value="in_progress">En Proceso</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Cancelados</option>
        </Select>
        
        <Select value={filterUser} onChange={setFilterUser}>
          <option value="all">Todos los usuarios</option>
          {safeUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        
        <Select value={sortBy} onChange={setSortBy}>
          <option value="scheduled_date">Por fecha programada</option>
          <option value="priority">Por prioridad</option>
          <option value="progress">Por progreso</option>
          <option value="product_name">Por producto</option>
        </Select>
      </div>
      
      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map(batch => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onEdit={handleEditBatch}
            onDelete={handleDeleteBatch}
            onView={handleViewBatch}
            onAssign={handleAssignBatch}
          />
        ))}
      </div>
      
      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron lotes de producción
          </p>
        </div>
      )}
      
      {/* Batch Assignment Modal */}
      {selectedBatch && (
        <BatchAssignment
          isOpen={showBatchAssignment}
          onClose={() => {
            setShowBatchAssignment(false);
            setSelectedBatch(null);
          }}
          batch={selectedBatch}
          users={safeUsers}
          onSave={handleAssignmentSave}
        />
      )}
      
      {/* Batch Details Modal */}
      <Modal
        isOpen={showBatchDetails}
        onClose={() => {
          setShowBatchDetails(false);
          setSelectedBatch(null);
        }}
        title="Detalles del Lote"
        size="lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Número de Lote</label>
                <p className="text-lg text-gray-900 dark:text-white">#{selectedBatch.batch_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <Badge variant={selectedBatch.status === 'completed' ? 'success' : 'warning'}>
                  {selectedBatch.status === 'completed' ? 'Completado' : 'En Proceso'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Producto</label>
                <p className="text-lg text-gray-900 dark:text-white">{selectedBatch.product_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedBatch.quantity} {selectedBatch.unit}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedBatch.assigned_user_name || 'Sin asignar'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Progreso</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${selectedBatch.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-lg text-gray-900 dark:text-white">
                    {selectedBatch.progress || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            {selectedBatch.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</label>
                <p className="text-gray-900 dark:text-white">{selectedBatch.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchDetails(false);
                  setSelectedBatch(null);
                }}
              >
                Cerrar
              </Button>
              {selectedBatch.status === 'pending' && (
                <Button
                  onClick={() => {
                    setShowBatchDetails(false);
                    handleAssignBatch(selectedBatch);
                  }}
                >
                  Asignar Lote
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BatchAssignmentPage;