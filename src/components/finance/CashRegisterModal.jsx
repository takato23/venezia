import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calculator, 
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

const CashRegisterModal = ({ 
  isOpen, 
  date, 
  onOpen, 
  onClose, 
  onCancel,
  expectedCash = 0 
}) => {
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingData, setClosingData] = useState({
    cash_counted: '',
    card_total: '',
    other_payments: '',
    notes: '',
    denominations: {
      bills_1000: 0,
      bills_500: 0,
      bills_200: 0,
      bills_100: 0,
      bills_50: 0,
      bills_20: 0,
      bills_10: 0,
      coins: 0
    }
  });
  
  const [errors, setErrors] = useState({});

  // Calculate total from denominations
  const calculateTotalFromDenominations = () => {
    const { denominations } = closingData;
    return (
      denominations.bills_1000 * 1000 +
      denominations.bills_500 * 500 +
      denominations.bills_200 * 200 +
      denominations.bills_100 * 100 +
      denominations.bills_50 * 50 +
      denominations.bills_20 * 20 +
      denominations.bills_10 * 10 +
      denominations.coins
    );
  };

  useEffect(() => {
    if (isOpen) {
      const total = calculateTotalFromDenominations();
      setClosingData(prev => ({
        ...prev,
        cash_counted: total.toString()
      }));
    }
  }, [closingData.denominations, isOpen]);

  const validateOpeningForm = () => {
    const newErrors = {};
    
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      newErrors.openingAmount = 'Ingrese un monto válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateClosingForm = () => {
    const newErrors = {};
    
    if (!closingData.cash_counted || parseFloat(closingData.cash_counted) < 0) {
      newErrors.cash_counted = 'Ingrese el efectivo contado';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenCash = () => {
    if (validateOpeningForm()) {
      onOpen(parseFloat(openingAmount));
    }
  };

  const handleCloseCash = () => {
    if (validateClosingForm()) {
      onClose({
        cash_counted: parseFloat(closingData.cash_counted),
        card_total: parseFloat(closingData.card_total) || 0,
        other_payments: parseFloat(closingData.other_payments) || 0,
        notes: closingData.notes,
        denominations: closingData.denominations
      });
    }
  };

  const handleDenominationChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    setClosingData(prev => ({
      ...prev,
      denominations: {
        ...prev.denominations,
        [denomination]: numValue
      }
    }));
  };

  const cashDifference = parseFloat(closingData.cash_counted || 0) - expectedCash;
  const isDifferenceSignificant = Math.abs(cashDifference) > 10;

  return (
    <Modal isOpen onClose={onCancel} size="lg">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isOpen ? 'Cierre de Caja' : 'Apertura de Caja'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isOpen ? (
            // Opening Form
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Apertura de Caja
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Registra el monto inicial de efectivo para comenzar el día
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto de apertura
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0"
                    className="pl-10 text-lg"
                    error={errors.openingAmount}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Closing Form
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                      Cierre de Caja
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Cuenta el efectivo y registra los totales del día
                    </p>
                  </div>
                </div>
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Efectivo esperado
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${expectedCash.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Efectivo contado
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${(parseFloat(closingData.cash_counted) || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Denomination Counter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Conteo de Billetes y Monedas
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'bills_1000', label: '$1000', value: 1000 },
                    { key: 'bills_500', label: '$500', value: 500 },
                    { key: 'bills_200', label: '$200', value: 200 },
                    { key: 'bills_100', label: '$100', value: 100 },
                    { key: 'bills_50', label: '$50', value: 50 },
                    { key: 'bills_20', label: '$20', value: 20 },
                    { key: 'bills_10', label: '$10', value: 10 },
                    { key: 'coins', label: 'Monedas', value: 1 }
                  ].map(denom => (
                    <div key={denom.key} className="space-y-1">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        {denom.label}
                      </label>
                      <Input
                        type="number"
                        value={closingData.denominations[denom.key]}
                        onChange={(e) => handleDenominationChange(denom.key, e.target.value)}
                        placeholder="0"
                        min="0"
                        className="text-sm"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        = ${(closingData.denominations[denom.key] * (denom.key === 'coins' ? 1 : denom.value)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Total en Tarjetas
                  </label>
                  <Input
                    type="number"
                    value={closingData.card_total}
                    onChange={(e) => setClosingData(prev => ({ ...prev, card_total: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Banknote className="h-4 w-4 inline mr-1" />
                    Otros Pagos
                  </label>
                  <Input
                    type="number"
                    value={closingData.other_payments}
                    onChange={(e) => setClosingData(prev => ({ ...prev, other_payments: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Difference Alert */}
              {cashDifference !== 0 && (
                <div className={clsx(
                  'rounded-lg p-4',
                  isDifferenceSignificant
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-yellow-50 dark:bg-yellow-900/20'
                )}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={clsx(
                      'h-5 w-5 mt-0.5',
                      isDifferenceSignificant
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    )} />
                    <div>
                      <h4 className={clsx(
                        'font-medium',
                        isDifferenceSignificant
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-yellow-900 dark:text-yellow-100'
                      )}>
                        Diferencia de ${Math.abs(cashDifference).toLocaleString()}
                      </h4>
                      <p className={clsx(
                        'text-sm mt-1',
                        isDifferenceSignificant
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      )}>
                        Hay {cashDifference > 0 ? 'más' : 'menos'} efectivo del esperado
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observaciones
                </label>
                <TextArea
                  value={closingData.notes}
                  onChange={(e) => setClosingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas sobre el cierre de caja..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              {isOpen && cashDifference !== 0 && (
                <Badge 
                  variant={cashDifference > 0 ? 'success' : 'danger'}
                  size="lg"
                >
                  {cashDifference > 0 ? '+' : ''}{cashDifference.toLocaleString()} diferencia
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={isOpen ? handleCloseCash : handleOpenCash}
              >
                <Save className="h-4 w-4 mr-2" />
                {isOpen ? 'Cerrar Caja' : 'Abrir Caja'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CashRegisterModal;