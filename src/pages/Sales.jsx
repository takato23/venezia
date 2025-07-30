import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Printer
} from 'lucide-react';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import receiptService from '../services/receiptService';
import clsx from 'clsx';

const SalesPage = () => {
  const { success, error } = useToast();
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  
  // Datos de API
  const { 
    data: salesData, 
    loading: loadingSales, 
    refetch: refetchSales 
  } = useApiCache('/api/sales', null, { staleTime: 30000 });
  
  const { 
    data: todaySales, 
    loading: loadingToday 
  } = useApiCache('/api/sales/today', null, { staleTime: 30000 });

  // Procesar datos de ventas
  const sales = salesData?.sales || [];
  const salesSummary = salesData?.summary || {};
  const todayData = todaySales || {};

  // Filtrar ventas
  const filteredSales = useMemo(() => {
    let filtered = [...sales];
    
    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      filtered = filtered.filter(sale => {
        const saleDate = sale.date.split('T')[0];
        switch(dateFilter) {
          case 'today': return saleDate === today;
          case 'yesterday': return saleDate === yesterday;
          case 'week': return saleDate >= weekAgo;
          default: return true;
        }
      });
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items?.some(item => 
          item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return filtered;
  }, [sales, dateFilter, statusFilter, searchTerm]);

  // Función para ver detalles de venta
  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    try {
      await refetchSales();
      success('Datos actualizados');
    } catch (err) {
      error('Error al actualizar datos');
    }
  };

  // Función para exportar datos
  const handleExport = async () => {
    try {
      // Preparar datos para exportar
      const exportData = {
        fecha_exportacion: new Date().toLocaleString(),
        periodo: dateFilter === 'all' ? 'Todas las fechas' : dateFilter,
        total_ventas: salesSummary.total_sales || 0,
        total_transacciones: salesSummary.total_transactions || 0,
        ticket_promedio: salesSummary.average_ticket || 0,
        ventas: filteredSales.map(sale => ({
          numero_recibo: sale.receipt_number,
          fecha: new Date(sale.date).toLocaleString(),
          cliente: sale.customer?.name || 'Sin nombre',
          telefono: sale.customer?.phone || '',
          productos: sale.items?.map(item => `${item.product_name} x${item.quantity}`).join(', '),
          subtotal: sale.subtotal,
          descuento: sale.discount_amount,
          total: sale.total,
          metodo_pago: sale.payment_method,
          estado: sale.status
        }))
      };

      // Convertir a CSV
      const headers = ['Recibo', 'Fecha', 'Cliente', 'Teléfono', 'Productos', 'Subtotal', 'Descuento', 'Total', 'Método Pago', 'Estado'];
      const csvContent = [
        `Reporte de Ventas - ${exportData.fecha_exportacion}`,
        `Período: ${exportData.periodo}`,
        `Total Ventas: $${exportData.total_ventas}`,
        `Total Transacciones: ${exportData.total_transacciones}`,
        `Ticket Promedio: $${exportData.ticket_promedio}`,
        '',
        headers.join(','),
        ...exportData.ventas.map(venta => [
          venta.numero_recibo,
          `"${venta.fecha}"`,
          `"${venta.cliente}"`,
          venta.telefono,
          `"${venta.productos}"`,
          venta.subtotal,
          venta.descuento,
          venta.total,
          venta.metodo_pago,
          venta.estado
        ].join(','))
      ].join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success('Exportación completada', 'El archivo CSV ha sido descargado');
    } catch (err) {
      console.error('Error exporting:', err);
      error('Error al exportar', 'No se pudo generar el archivo de exportación');
    }
  };

  const loading = loadingSales || loadingToday;

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona y revisa todas las transacciones de tu heladería
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${todayData.total_sales?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayData.total_transactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${todayData.average_ticket?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${salesSummary.total_sales?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por recibo, cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              icon={Search}
            />
          </div>
          
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-48"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Última semana</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </Select>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transacciones ({filteredSales.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron ventas con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Receipt className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {sale.receipt_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {sale.customer?.name || 'Cliente sin nombre'}
                      </div>
                      {sale.customer?.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {sale.customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(sale.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(sale.date).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {sale.items?.length || 0} productos
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${sale.total?.toLocaleString()}
                      </div>
                      {sale.discount_amount > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Desc: ${sale.discount_amount?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          sale.status === 'completed' ? 'success' :
                          sale.status === 'pending' ? 'warning' : 'danger'
                        }
                      >
                        {sale.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {sale.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {sale.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {sale.status === 'completed' ? 'Completada' :
                         sale.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSaleDetails(sale)}
                          className="flex items-center gap-1"
                          title="Ver detalles"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Prepare sale data for receipt
                            const saleData = {
                              ...sale,
                              items: sale.items || [],
                              customer_name: sale.customer?.name || 'Cliente General',
                              customer_phone: sale.customer?.phone || '',
                              customer_email: sale.customer?.email || ''
                            };
                            receiptService.downloadReceipt(saleData);
                          }}
                          className="flex items-center gap-1"
                          title="Descargar recibo"
                        >
                          <Receipt size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Prepare sale data for receipt
                            const saleData = {
                              ...sale,
                              items: sale.items || [],
                              customer_name: sale.customer?.name || 'Cliente General',
                              customer_phone: sale.customer?.phone || '',
                              customer_email: sale.customer?.email || ''
                            };
                            receiptService.printReceipt(saleData);
                          }}
                          className="flex items-center gap-1"
                          title="Imprimir recibo"
                        >
                          <Printer size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles de venta */}
      <Modal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title={`Detalle de Venta - ${selectedSale?.receipt_number}`}
        maxWidth="4xl"
      >
        {selectedSale && (
          <div className="space-y-6">
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Información de la Venta</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Recibo:</span> {selectedSale.receipt_number}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(selectedSale.date).toLocaleString()}</p>
                  <p><span className="font-medium">Método de Pago:</span> {selectedSale.payment_method}</p>
                  <p><span className="font-medium">Estado:</span> {selectedSale.status}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Información del Cliente</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Nombre:</span> {selectedSale.customer?.name || 'N/A'}</p>
                  <p><span className="font-medium">Teléfono:</span> {selectedSale.customer?.phone || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {selectedSale.customer?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Items de la venta */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Productos Vendidos</h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Precio Unit.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedSale.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">${item.unit_price?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">${item.total_price?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resumen Financiero</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${selectedSale.subtotal?.toLocaleString()}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Descuento ({selectedSale.discount_percentage}%):</span>
                    <span>-${selectedSale.discount_amount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span>${selectedSale.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Receipt Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Documentos</h4>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const saleData = {
                      ...selectedSale,
                      items: selectedSale.items || [],
                      customer_name: selectedSale.customer?.name || 'Cliente General',
                      customer_phone: selectedSale.customer?.phone || '',
                      customer_email: selectedSale.customer?.email || ''
                    };
                    receiptService.downloadReceipt(saleData);
                  }}
                  className="flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Descargar Recibo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const saleData = {
                      ...selectedSale,
                      items: selectedSale.items || [],
                      customer_name: selectedSale.customer?.name || 'Cliente General',
                      customer_phone: selectedSale.customer?.phone || '',
                      customer_email: selectedSale.customer?.email || ''
                    };
                    receiptService.downloadInvoice(saleData);
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Descargar Factura
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const saleData = {
                      ...selectedSale,
                      items: selectedSale.items || [],
                      customer_name: selectedSale.customer?.name || 'Cliente General',
                      customer_phone: selectedSale.customer?.phone || '',
                      customer_email: selectedSale.customer?.email || ''
                    };
                    receiptService.printReceipt(saleData);
                  }}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesPage;