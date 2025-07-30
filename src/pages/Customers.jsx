import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  Star,
  Gift,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import CustomerForm from '../components/crm/CustomerForm';
import CustomerDetail from '../components/crm/CustomerDetail';
import LoyaltyProgram from '../components/crm/LoyaltyProgram';
import CommunicationCenter from '../components/crm/CommunicationCenter';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const CustomersPage = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showCommunication, setShowCommunication] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  // Toast
  const { success, error } = useToast();

  // API Data
  const { 
    data: customersData, 
    loading, 
    error: apiError,
    refetch 
  } = useApiCache('/api/customers');

  const customers = customersData?.customers || [];

  // Customer segments
  const segments = {
    vip: { 
      label: 'VIP', 
      color: 'purple',
      criteria: 'Más de $50,000 en compras' 
    },
    frequent: { 
      label: 'Frecuente', 
      color: 'blue',
      criteria: 'Más de 10 compras' 
    },
    regular: { 
      label: 'Regular', 
      color: 'green',
      criteria: '3-10 compras' 
    },
    new: { 
      label: 'Nuevo', 
      color: 'yellow',
      criteria: 'Menos de 3 compras' 
    },
    inactive: { 
      label: 'Inactivo', 
      color: 'gray',
      criteria: 'Sin compras en 60+ días' 
    }
  };

  // Calculate customer metrics
  const metrics = useMemo(() => {
    if (!customers.length) return null;

    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
    const avgOrderValue = totalRevenue / customers.length;
    const vipCustomers = customers.filter(c => c.segment === 'vip').length;

    return {
      total: customers.length,
      active: activeCustomers,
      revenue: totalRevenue,
      avgOrder: avgOrderValue,
      vip: vipCustomers
    };
  }, [customers]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === filterStatus);
    }

    // Apply segment filter
    if (filterSegment !== 'all') {
      filtered = filtered.filter(customer => customer.segment === filterSegment);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'spent':
        filtered.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));
        break;
      case 'orders':
        filtered.sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.last_order_date || 0) - new Date(a.last_order_date || 0));
    }

    return filtered;
  }, [customers, searchTerm, filterStatus, filterSegment, sortBy]);

  // Handle customer creation/update
  const handleSaveCustomer = async (customerData) => {
    try {
      const url = selectedCustomer 
        ? `/api/customers/${selectedCustomer.id}`
        : '/api/customers';
      
      const method = selectedCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        success(
          selectedCustomer ? 'Cliente actualizado' : 'Cliente creado',
          `${customerData.name} ha sido ${selectedCustomer ? 'actualizado' : 'agregado'} exitosamente`
        );
        setShowCustomerForm(false);
        setSelectedCustomer(null);
        refetch();
      } else {
        throw new Error('Error al guardar cliente');
      }
    } catch (err) {
      error('Error', 'No se pudo guardar el cliente');
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${customer.name}?`)) return;

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Cliente eliminado', `${customer.name} ha sido eliminado`);
        refetch();
      } else {
        throw new Error('Error al eliminar cliente');
      }
    } catch (err) {
      error('Error', 'No se pudo eliminar el cliente');
    }
  };

  if (loading && !customers.length) {
    return <LoadingState message="Cargando clientes..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Clientes</h1>
          <p className="page-subtitle">
            Administra tu base de clientes y programa de fidelización
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            onClick={() => {/* Implementar exportación */}}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setSelectedCustomer(null);
              setShowCustomerForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Clientes registrados
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xs text-gray-500">Activos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Clientes activos
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-gray-500">Ingresos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${metrics.revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total generado
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="h-5 w-5 text-yellow-500" />
              <span className="text-xs text-gray-500">Ticket promedio</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${Math.round(metrics.avgOrder).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Por cliente
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-gray-500">VIP</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.vip}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Clientes VIP
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-40"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>

          {/* Segment Filter */}
          <Select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="w-40"
          >
            <option value="all">Todos los segmentos</option>
            {Object.entries(segments).map(([key, segment]) => (
              <option key={key} value={key}>{segment.label}</option>
            ))}
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-40"
          >
            <option value="recent">Más recientes</option>
            <option value="name">Nombre</option>
            <option value="spent">Mayor gasto</option>
            <option value="orders">Más pedidos</option>
          </Select>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCommunication(true)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comunicación
            </Button>
            <LoyaltyProgram customers={customers} />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Segmento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Compras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Compra
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        {customer.preferences && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Preferencias: {customer.preferences}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      {customer.email}
                    </div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={segments[customer.segment]?.color || 'gray'}
                      size="sm"
                    >
                      {segments[customer.segment]?.label || 'Sin segmento'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.total_orders || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ${(customer.total_spent || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.last_order_date 
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : 'Sin compras'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetail(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerForm(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron clientes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          customer={selectedCustomer}
          onSave={handleSaveCustomer}
          onClose={() => {
            setShowCustomerForm(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => {
            setShowCustomerDetail(false);
            setSelectedCustomer(null);
          }}
          onEdit={() => {
            setShowCustomerDetail(false);
            setShowCustomerForm(true);
          }}
        />
      )}

      {/* Communication Center Modal */}
      {showCommunication && (
        <CommunicationCenter
          customers={filteredCustomers}
          onClose={() => setShowCommunication(false)}
        />
      )}
    </div>
  );
};

export default CustomersPage;