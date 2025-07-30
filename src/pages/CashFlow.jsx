import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Receipt,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Wallet,
  Search,
  ShoppingCart,
  Users,
  Package
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApiCache } from '../hooks/useApiCache';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import CashRegisterModal from '../components/finance/CashRegisterModal';
import ExpenseModal from '../components/finance/ExpenseModal';
import CashMovementModal from '../components/finance/CashMovementModal';
import DailyCashReport from '../components/finance/DailyCashReport';
import clsx from 'clsx';

const CashFlowPage = () => {
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [cashStatus, setCashStatus] = useState(null);

  // Toast
  const { success, error, warning } = useToast();

  // API Data
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  
  const { 
    data: cashFlowData, 
    loading, 
    refetch 
  } = useApiCache(`/api/cashflow?date=${dateString}`);

  const { 
    data: cashRegisterStatus,
    refetch: refetchStatus
  } = useApiCache(`/api/cashflow/status?date=${dateString}`);

  useEffect(() => {
    if (cashRegisterStatus) {
      setCashStatus(cashRegisterStatus);
    }
  }, [cashRegisterStatus]);

  // Calculate daily summary
  const dailySummary = useMemo(() => {
    if (!cashFlowData) return null;

    const movements = cashFlowData.movements || [];
    
    const income = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const expenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const balance = income - expenses;
    const openingCash = cashFlowData.opening_cash || 0;
    const expectedCash = openingCash + balance;
    const actualCash = cashFlowData.closing_cash || expectedCash;
    const difference = actualCash - expectedCash;

    // Payment methods breakdown
    const paymentMethods = movements.reduce((acc, m) => {
      if (m.type === 'income') {
        const method = m.payment_method || 'cash';
        acc[method] = (acc[method] || 0) + m.amount;
      }
      return acc;
    }, {});

    return {
      income,
      expenses,
      balance,
      openingCash,
      expectedCash,
      actualCash,
      difference,
      paymentMethods,
      movementCount: movements.length
    };
  }, [cashFlowData]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    if (!cashFlowData?.movements) return [];

    let filtered = [...cashFlowData.movements];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by time descending
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered;
  }, [cashFlowData, filterType, searchTerm]);

  // Handle cash register operations
  const handleOpenCashRegister = async (openingAmount) => {
    try {
      const response = await fetch('/api/cashflow/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateString,
          opening_amount: openingAmount
        })
      });

      if (response.ok) {
        success('Caja abierta', `Caja abierta con $${openingAmount.toLocaleString()}`);
        refetch();
        refetchStatus();
        setShowCashRegister(false);
      } else {
        throw new Error('Error al abrir caja');
      }
    } catch (err) {
      error('Error', 'No se pudo abrir la caja');
    }
  };

  const handleCloseCashRegister = async (closingData) => {
    try {
      const response = await fetch('/api/cashflow/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateString,
          ...closingData
        })
      });

      if (response.ok) {
        success('Caja cerrada', 'El cierre de caja se realizó correctamente');
        refetch();
        refetchStatus();
        setShowCashRegister(false);
        setShowDailyReport(true);
      } else {
        throw new Error('Error al cerrar caja');
      }
    } catch (err) {
      error('Error', 'No se pudo cerrar la caja');
    }
  };

  // Handle movements
  const handleSaveMovement = async (movementData) => {
    try {
      const url = selectedMovement 
        ? `/api/cashflow/movements/${selectedMovement.id}`
        : '/api/cashflow/movements';
      
      const method = selectedMovement ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movementData,
          date: dateString
        })
      });

      if (response.ok) {
        success(
          selectedMovement ? 'Movimiento actualizado' : 'Movimiento registrado',
          'El movimiento se guardó correctamente'
        );
        refetch();
        setShowMovementModal(false);
        setShowExpenseModal(false);
        setSelectedMovement(null);
      } else {
        throw new Error('Error al guardar movimiento');
      }
    } catch (err) {
      error('Error', 'No se pudo guardar el movimiento');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      sales: ShoppingCart,
      expense: Minus,
      salary: Users,
      supplier: Package,
      other: DollarSign
    };
    return icons[category] || DollarSign;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      card: CreditCard,
      transfer: ArrowUpRight,
      check: Receipt
    };
    return icons[method] || DollarSign;
  };

  if (loading && !cashFlowData) {
    return <LoadingState message="Cargando información de caja..." />;
  }

  const isCashOpen = cashStatus?.status === 'open';
  const isCashClosed = cashStatus?.status === 'closed';
  const canRegisterMovements = isCashOpen && isToday(selectedDate);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Caja</h1>
          <p className="page-subtitle">
            Gestión de ingresos, egresos y flujo de efectivo
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            onClick={() => setShowDailyReport(true)}
            disabled={!dailySummary}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Reporte
          </Button>
          
          {!isCashOpen && isToday(selectedDate) && (
            <Button 
              variant="primary"
              onClick={() => setShowCashRegister(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Abrir Caja
            </Button>
          )}
          
          {isCashOpen && isToday(selectedDate) && (
            <Button 
              variant="warning"
              onClick={() => setShowCashRegister(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Cerrar Caja
            </Button>
          )}
        </div>
      </div>

      {/* Date Selector and Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-48"
          />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Estado:</span>
            {isCashOpen && (
              <Badge variant="success">
                <Clock className="h-3 w-3 mr-1" />
                Caja Abierta
              </Badge>
            )}
            {isCashClosed && (
              <Badge variant="gray">
                <CheckCircle className="h-3 w-3 mr-1" />
                Caja Cerrada
              </Badge>
            )}
            {!cashStatus && (
              <Badge variant="warning">
                <AlertCircle className="h-3 w-3 mr-1" />
                Sin Apertura
              </Badge>
            )}
          </div>
        </div>

        {canRegisterMovements && (
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setSelectedMovement(null);
                setShowMovementModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ingreso
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedMovement(null);
                setShowExpenseModal(true);
              }}
            >
              <Minus className="h-4 w-4 mr-1" />
              Egreso
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {dailySummary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-500">Apertura</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${dailySummary.openingCash.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Efectivo inicial
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xs text-gray-500">Ingresos</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +${dailySummary.income.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total ingresos
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-xs text-gray-500">Egresos</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              -${dailySummary.expenses.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total egresos
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-gray-500">Balance</span>
            </div>
            <div className={clsx(
              "text-2xl font-bold",
              dailySummary.balance >= 0 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-red-600 dark:text-red-400"
            )}>
              ${Math.abs(dailySummary.balance).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {dailySummary.balance >= 0 ? 'Ganancia' : 'Pérdida'} del día
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-gray-500">Cierre</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${dailySummary.actualCash.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isCashClosed ? 'Efectivo final' : 'Esperado'}
            </div>
            {dailySummary.difference !== 0 && isCashClosed && (
              <div className={clsx(
                "text-xs mt-1",
                dailySummary.difference > 0 ? "text-green-600" : "text-red-600"
              )}>
                {dailySummary.difference > 0 ? '+' : ''}{dailySummary.difference.toLocaleString()} diferencia
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {dailySummary && Object.keys(dailySummary.paymentMethods).length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ingresos por Método de Pago
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dailySummary.paymentMethods).map(([method, amount]) => {
              const Icon = getPaymentMethodIcon(method);
              return (
                <div key={method} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : method}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      ${amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
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
                placeholder="Buscar movimiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-48"
          >
            <option value="all">Todos los movimientos</option>
            <option value="income">Solo ingresos</option>
            <option value="expense">Solo egresos</option>
          </Select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMovements.map((movement) => {
                const isIncome = movement.type === 'income';
                const CategoryIcon = getCategoryIcon(movement.category);
                const PaymentIcon = getPaymentMethodIcon(movement.payment_method);
                
                return (
                  <tr 
                    key={movement.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(movement.created_at), 'HH:mm', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'p-2 rounded-lg',
                          isIncome 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-red-100 dark:bg-red-900/20'
                        )}>
                          {isIncome ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {movement.description}
                          </div>
                          {movement.reference && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Ref: {movement.reference}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {movement.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {movement.payment_method === 'cash' ? 'Efectivo' : 
                           movement.payment_method === 'card' ? 'Tarjeta' : 
                           movement.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={clsx(
                        'text-sm font-medium',
                        isIncome 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {isIncome ? '+' : '-'}${movement.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedMovement(movement);
                          if (movement.type === 'income') {
                            setShowMovementModal(true);
                          } else {
                            setShowExpenseModal(true);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        disabled={!canRegisterMovements}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredMovements.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay movimientos registrados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cash Register Modal */}
      {showCashRegister && (
        <CashRegisterModal
          isOpen={isCashOpen}
          date={selectedDate}
          onOpen={handleOpenCashRegister}
          onClose={handleCloseCashRegister}
          onCancel={() => setShowCashRegister(false)}
          expectedCash={dailySummary?.expectedCash}
        />
      )}

      {/* Movement Modal (Income) */}
      {showMovementModal && (
        <CashMovementModal
          type="income"
          movement={selectedMovement}
          onSave={handleSaveMovement}
          onClose={() => {
            setShowMovementModal(false);
            setSelectedMovement(null);
          }}
        />
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          expense={selectedMovement}
          onSave={handleSaveMovement}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedMovement(null);
          }}
        />
      )}

      {/* Daily Report Modal */}
      {showDailyReport && dailySummary && (
        <DailyCashReport
          date={selectedDate}
          summary={dailySummary}
          movements={cashFlowData?.movements || []}
          isOpen={showDailyReport}
          onClose={() => setShowDailyReport(false)}
        />
      )}
    </div>
  );
};

export default CashFlowPage;