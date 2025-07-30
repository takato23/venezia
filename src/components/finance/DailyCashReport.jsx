import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  PieChart,
  BarChart3,
  FileText,
  Share2
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import clsx from 'clsx';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DailyCashReport = ({ 
  date, 
  summary, 
  movements, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  // Group movements by category for charts
  const expensesByCategory = movements
    .filter(m => m.type === 'expense')
    .reduce((acc, movement) => {
      const category = movement.category || 'other';
      acc[category] = (acc[category] || 0) + movement.amount;
      return acc;
    }, {});

  const incomeByMethod = movements
    .filter(m => m.type === 'income')
    .reduce((acc, movement) => {
      const method = movement.payment_method || 'cash';
      acc[method] = (acc[method] || 0) + movement.amount;
      return acc;
    }, {});

  // Chart data
  const expenseChartData = {
    labels: Object.keys(expensesByCategory).map(cat => {
      const labels = {
        supplier: 'Proveedores',
        salary: 'Sueldos',
        rent: 'Alquiler',
        utilities: 'Servicios',
        maintenance: 'Mantenimiento',
        transport: 'Transporte',
        marketing: 'Marketing',
        other: 'Otros'
      };
      return labels[cat] || cat;
    }),
    datasets: [{
      data: Object.values(expensesByCategory),
      backgroundColor: [
        '#3B82F6', // blue
        '#10B981', // green
        '#F59E0B', // yellow
        '#EF4444', // red
        '#8B5CF6', // purple
        '#EC4899', // pink
        '#14B8A6', // teal
        '#6B7280'  // gray
      ],
      borderWidth: 0
    }]
  };

  const paymentMethodChartData = {
    labels: Object.keys(incomeByMethod).map(method => {
      const labels = {
        cash: 'Efectivo',
        card: 'Tarjeta',
        transfer: 'Transferencia',
        check: 'Cheque'
      };
      return labels[method] || method;
    }),
    datasets: [{
      label: 'Ingresos',
      data: Object.values(incomeByMethod),
      backgroundColor: '#10B981',
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: {
            size: 12
          }
        }
      }
    }
  };

  const handleExport = (format) => {
    // Implementar exportación a PDF/Excel
    console.log(`Exportando reporte en formato ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Implementar compartir por email
    console.log('Compartiendo reporte por email');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reporte de Caja Diaria
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Compartir
              </Button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'summary', label: 'Resumen', icon: BarChart3 },
              { id: 'movements', label: 'Movimientos', icon: FileText },
              { id: 'charts', label: 'Gráficos', icon: PieChart }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Apertura</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${summary.openingCash.toLocaleString()}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ingresos</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +${summary.income.toLocaleString()}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Egresos</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    -${summary.expenses.toLocaleString()}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Cierre</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${summary.actualCash.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Balance del Día
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Efectivo inicial</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${summary.openingCash.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Total ingresos</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +${summary.income.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Total egresos</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -${summary.expenses.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Efectivo esperado
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ${summary.expectedCash.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 dark:text-gray-400">Efectivo contado</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${summary.actualCash.toLocaleString()}
                    </span>
                  </div>
                  
                  {summary.difference !== 0 && (
                    <div className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-900/50 px-3 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Diferencia</span>
                      <Badge 
                        variant={summary.difference > 0 ? 'success' : 'danger'}
                        size="lg"
                      >
                        {summary.difference > 0 ? '+' : ''}{summary.difference.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Métodos de Pago
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {method === 'cash' ? 'Efectivo' : 
                         method === 'card' ? 'Tarjeta' : 
                         method === 'transfer' ? 'Transferencia' : method}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'movements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detalle de Movimientos
                </h3>
                <Badge variant="gray">
                  {movements.length} movimientos
                </Badge>
              </div>
              
              <div className="space-y-2">
                {movements.map((movement, index) => (
                  <div
                    key={movement.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        'p-2 rounded-lg',
                        movement.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      )}>
                        {movement.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {movement.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(movement.created_at), 'HH:mm')} - 
                          {movement.category} - 
                          {movement.payment_method === 'cash' ? 'Efectivo' : 
                           movement.payment_method === 'card' ? 'Tarjeta' : 
                           movement.payment_method}
                        </div>
                      </div>
                    </div>
                    
                    <div className={clsx(
                      'text-lg font-medium',
                      movement.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      {movement.type === 'income' ? '+' : '-'}${movement.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* Expenses by Category */}
              {Object.keys(expensesByCategory).length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Egresos por Categoría
                  </h3>
                  <div className="h-64">
                    <Doughnut data={expenseChartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Income by Payment Method */}
              {Object.keys(incomeByMethod).length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Ingresos por Método de Pago
                  </h3>
                  <div className="h-64">
                    <Bar data={paymentMethodChartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DailyCashReport;