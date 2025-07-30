import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  History, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Package,
  DollarSign,
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const TransactionCard = ({ transaction, onView }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'adjustment':
        return <ArrowUpDown className="h-5 w-5 text-blue-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES'),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(transaction.created_at);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {transaction.ingredient_name || 'Ingrediente desconocido'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {transaction.id}
            </p>
          </div>
        </div>
        
        <Badge variant={getStatusColor(transaction.status)}>
          {transaction.status === 'completed' ? 'Completada' : 
           transaction.status === 'pending' ? 'Pendiente' : 'Cancelada'}
        </Badge>
      </div>
      
      {/* Transaction Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tipo
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {transaction.type === 'in' ? 'Entrada' : 
             transaction.type === 'out' ? 'Salida' : 'Ajuste'}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Cantidad
          </p>
          <p className={clsx(
            "text-sm font-medium",
            transaction.type === 'in' ? 'text-green-600' : 
            transaction.type === 'out' ? 'text-red-600' : 'text-blue-600'
          )}>
            {transaction.type === 'out' ? '-' : '+'}{transaction.quantity} {transaction.unit}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Costo Total
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            ${(transaction.unit_cost * transaction.quantity).toFixed(2)}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Fecha
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {date}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {time}
          </p>
        </div>
      </div>
      
      {/* Notes */}
      {transaction.notes && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Notas
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {transaction.notes}
          </p>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(transaction)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalles
        </Button>
      </div>
    </div>
  );
};

const TransactionForm = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ingredient_id: '',
    type: 'in',
    quantity: '',
    unit_cost: '',
    notes: '',
    reference: ''
  });

  const { data: ingredients } = useApiCache('/api/ingredients');
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const resetForm = () => {
    setFormData({
      ingredient_id: '',
      type: 'in',
      quantity: '',
      unit_cost: '',
      notes: '',
      reference: ''
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Transacción"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingrediente
            </label>
            <Select
              value={formData.ingredient_id}
              onChange={(value) => setFormData(prev => ({ ...prev, ingredient_id: value }))}
              required
            >
              <option value="">Seleccionar ingrediente...</option>
              {safeIngredients.map(ingredient => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} - {ingredient.unit}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Transacción
            </label>
            <Select
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              required
            >
              <option value="in">Entrada</option>
              <option value="out">Salida</option>
              <option value="adjustment">Ajuste</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cantidad
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Costo Unitario
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
              required
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Referencia
            </label>
            <Input
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Factura #123, Orden #456, etc."
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notas
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Información adicional sobre la transacción..."
          />
        </div>
        
        {/* Summary */}
        {formData.quantity && formData.unit_cost && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumen</h4>
            <div className="flex justify-between">
              <span>Costo Total:</span>
              <span className="font-semibold">
                ${(parseFloat(formData.quantity) * parseFloat(formData.unit_cost)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
          >
            Crear Transacción
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const TransactionsPage = () => {
  const location = useLocation();
  const { success, error, warning } = useToast();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // Modal States
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // API Data
  const { 
    data: transactions, 
    loading: loadingTransactions, 
    refetch: refetchTransactions 
  } = useApiCache('/api/transactions');
  
  // Safe data
  const safeTransactions = transactions || [];
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = safeTransactions.filter(transaction => {
      const matchesSearch = transaction.ingredient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
      
      // Date filter
      if (dateRange !== 'all') {
        const transactionDate = new Date(transaction.created_at);
        const now = new Date();
        let filterDate = new Date();
        
        switch (dateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (dateRange !== 'all' && transactionDate < filterDate) {
          return false;
        }
      }
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'amount_desc':
          return (b.quantity * b.unit_cost) - (a.quantity * a.unit_cost);
        case 'amount_asc':
          return (a.quantity * a.unit_cost) - (b.quantity * b.unit_cost);
        case 'ingredient':
          return a.ingredient_name?.localeCompare(b.ingredient_name) || 0;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [safeTransactions, searchTerm, filterType, filterStatus, dateRange, sortBy]);
  
  // Transaction stats
  const transactionStats = useMemo(() => {
    const today = safeTransactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === today.getTime();
    });
    
    const totalIn = safeTransactions.filter(t => t.type === 'in').reduce((sum, t) => sum + (t.quantity * t.unit_cost), 0);
    const totalOut = safeTransactions.filter(t => t.type === 'out').reduce((sum, t) => sum + (t.quantity * t.unit_cost), 0);
    const pending = safeTransactions.filter(t => t.status === 'pending').length;
    
    return {
      todayCount: today.length,
      totalIn,
      totalOut,
      pending
    };
  }, [safeTransactions]);
  
  // Handlers
  const handleAddTransaction = () => {
    setShowTransactionForm(true);
  };
  
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };
  
  const handleSaveTransaction = async (transactionData) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        throw new Error('Error al crear la transacción');
      }
      
      success('Transacción creada', 'La transacción ha sido registrada exitosamente');
      setShowTransactionForm(false);
      refetchTransactions();
      
    } catch (err) {
      error('Error', err.message || 'Error al crear la transacción');
    }
  };
  
  if (loadingTransactions) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
          <p className="text-gray-600 dark:text-gray-400">Historial de movimientos de inventario</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleAddTransaction} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transacciones Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactionStats.todayCount}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Entradas Totales</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${transactionStats.totalIn.toFixed(0)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Salidas Totales</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">${transactionStats.totalOut.toFixed(0)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{transactionStats.pending}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={filterType} onChange={setFilterType}>
          <option value="all">Todos los tipos</option>
          <option value="in">Entradas</option>
          <option value="out">Salidas</option>
          <option value="adjustment">Ajustes</option>
        </Select>
        
        <Select value={filterStatus} onChange={setFilterStatus}>
          <option value="all">Todos los estados</option>
          <option value="completed">Completadas</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Canceladas</option>
        </Select>
        
        <Select value={sortBy} onChange={setSortBy}>
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguas</option>
          <option value="amount_desc">Mayor monto</option>
          <option value="amount_asc">Menor monto</option>
          <option value="ingredient">Por ingrediente</option>
        </Select>
      </div>
      
      {/* Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransactions.map(transaction => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onView={handleViewTransaction}
          />
        ))}
      </div>
      
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron transacciones
          </p>
        </div>
      )}
      
      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSave={handleSaveTransaction}
      />
      
      {/* Transaction Details Modal */}
      <Modal
        isOpen={showTransactionDetails}
        onClose={() => {
          setShowTransactionDetails(false);
          setSelectedTransaction(null);
        }}
        title="Detalles de Transacción"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
                <p className="text-lg text-gray-900 dark:text-white">{selectedTransaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <Badge variant={selectedTransaction.status === 'completed' ? 'success' : 'warning'}>
                  {selectedTransaction.status === 'completed' ? 'Completada' : 'Pendiente'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingrediente</label>
                <p className="text-lg text-gray-900 dark:text-white">{selectedTransaction.ingredient_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedTransaction.type === 'in' ? 'Entrada' : 
                   selectedTransaction.type === 'out' ? 'Salida' : 'Ajuste'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedTransaction.quantity} {selectedTransaction.unit}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Costo Total</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  ${(selectedTransaction.quantity * selectedTransaction.unit_cost).toFixed(2)}
                </p>
              </div>
            </div>
            
            {selectedTransaction.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</label>
                <p className="text-gray-900 dark:text-white">{selectedTransaction.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransactionDetails(false);
                  setSelectedTransaction(null);
                }}
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

export default TransactionsPage;