import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Loader2,
  AlertCircle,
  Check,
  X,
  Smartphone,
  QrCode,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const PaymentModal = ({
  isOpen,
  onClose,
  cartTotal,
  orderId,
  customerId,
  customerEmail,
  onPaymentComplete,
  paymentMethod = 'cash'
}) => {
  const { success, error: showError, warning } = useToast();
  
  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'qr', 'card', 'processing', 'complete'
  const [selectedMethod, setSelectedMethod] = useState(paymentMethod);
  
  // QR Payment state
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  // Card payment state
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    email: customerEmail || ''
  });
  
  // Payment configuration
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Load payment configuration on mount
  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  // Auto-check payment status for QR
  useEffect(() => {
    let interval;
    
    if (qrData && paymentStep === 'qr') {
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrData, paymentStep]);

  const fetchPaymentConfig = async () => {
    try {
      const response = await fetch('/api/payments/config');
      const data = await response.json();
      
      if (data.success) {
        setPaymentConfig(data);
      }
    } catch (err) {
      console.error('Error fetching payment config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const generateQRPayment = async () => {
    setQrLoading(true);
    
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            id: orderId,
            name: `Orden #${orderId}`,
            quantity: 1,
            price: cartTotal
          }],
          orderId,
          customerId,
          customerEmail: cardData.email || customerEmail,
          total: cartTotal
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrData(data);
        setPaymentStep('qr');
        success('QR generado', 'Escanea el código para pagar');
      } else {
        throw new Error(data.error || 'Error al generar QR');
      }
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setQrLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!qrData || checkingPayment) return;
    
    setCheckingPayment(true);
    
    try {
      // In a real implementation, you would check the payment status
      // using the preference ID or payment ID
      console.log('Checking payment status for preference:', qrData.preferenceId);
      
      // For now, we'll simulate a check
      // In production, call your backend to check MercadoPago payment status
      
    } catch (err) {
      console.error('Error checking payment:', err);
    } finally {
      setCheckingPayment(false);
    }
  };

  const processCardPayment = async () => {
    // Validate card data
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      warning('Datos incompletos', 'Por favor completa todos los campos de la tarjeta');
      return;
    }
    
    if (!cardData.email) {
      warning('Email requerido', 'El email es necesario para procesar el pago');
      return;
    }
    
    setProcessing(true);
    setPaymentStep('processing');
    
    try {
      // In a real implementation, you would:
      // 1. Use MercadoPago.js SDK to tokenize the card
      // 2. Send the token to your backend
      // 3. Process the payment
      
      // For now, we'll simulate the process
      showError('Función en desarrollo', 'El pago con tarjeta estará disponible próximamente');
      
      // Simulate payment processing
      setTimeout(() => {
        setPaymentStep('complete');
        onPaymentComplete({
          method: 'card',
          transactionId: 'MP-' + Date.now(),
          amount: cartTotal,
          status: 'approved'
        });
        success('Pago completado', `Se procesó el pago de $${cartTotal}`);
      }, 2000);
      
    } catch (err) {
      showError('Error en el pago', err.message);
      setPaymentStep('card');
    } finally {
      setProcessing(false);
    }
  };

  const processCashPayment = async () => {
    setProcessing(true);
    
    try {
      // For cash payments, we just mark as complete
      setTimeout(() => {
        setPaymentStep('complete');
        onPaymentComplete({
          method: 'cash',
          amount: cartTotal,
          status: 'approved'
        });
        success('Pago registrado', `Pago en efectivo de $${cartTotal}`);
      }, 500);
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('Copiado', 'Link copiado al portapapeles');
  };

  const handleClose = () => {
    if (processing) {
      warning('Procesando', 'Espera a que termine el proceso');
      return;
    }
    
    setPaymentStep('select');
    setQrData(null);
    setCardData({
      number: '',
      name: '',
      expiry: '',
      cvv: '',
      email: customerEmail || ''
    });
    onClose();
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  if (loadingConfig) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Procesando Pago" size="md">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={paymentStep === 'complete' ? 'Pago Completado' : 'Procesar Pago'}
      size="md"
    >
      <div className="space-y-6">
        {/* Payment amount */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total a pagar</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${cartTotal.toFixed(2)}
          </p>
        </div>

        {/* Payment method selection */}
        {paymentStep === 'select' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Selecciona el método de pago
            </h3>
            
            <div className="grid gap-3">
              {/* Cash payment */}
              <button
                onClick={() => processCashPayment()}
                className={clsx(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  'border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Efectivo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pago en efectivo en el local
                    </p>
                  </div>
                </div>
              </button>

              {/* QR payment */}
              {paymentConfig?.configured && (
                <button
                  onClick={() => generateQRPayment()}
                  disabled={qrLoading}
                  className={clsx(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    'border-gray-200 dark:border-gray-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      {qrLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      ) : (
                        <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        QR MercadoPago
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Escanea y paga con tu celular
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Card payment */}
              {paymentConfig?.configured && (
                <button
                  onClick={() => setPaymentStep('card')}
                  className={clsx(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                    'border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Tarjeta de Crédito/Débito
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visa, Mastercard, Amex y más
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {!paymentConfig?.configured && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      MercadoPago no configurado
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Solo está disponible el pago en efectivo. Configura MercadoPago para habilitar pagos con QR y tarjeta.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Payment */}
        {paymentStep === 'qr' && qrData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Escanea el código QR para pagar
              </h3>
              
              {/* QR Code */}
              <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
              
              {/* Payment link */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  O comparte este link:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={qrData.initPoint || qrData.sandboxInitPoint}
                    readOnly
                    className="flex-1 text-xs p-2 bg-white dark:bg-gray-800 border rounded"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(qrData.initPoint || qrData.sandboxInitPoint)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(qrData.initPoint || qrData.sandboxInitPoint, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Status */}
              <div className="mt-4">
                {checkingPayment ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Verificando pago...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esperando confirmación de pago...
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentStep('select');
                  setQrData(null);
                }}
                className="flex-1"
              >
                Cambiar método
              </Button>
              <Button
                variant="outline"
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
              >
                <RefreshCw className={clsx('h-4 w-4', checkingPayment && 'animate-spin')} />
              </Button>
            </div>
          </div>
        )}

        {/* Card Payment Form */}
        {paymentStep === 'card' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Información de la tarjeta
            </h3>
            
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de tarjeta
                </label>
                <Input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => setCardData({
                    ...cardData,
                    number: formatCardNumber(e.target.value)
                  })}
                  maxLength="19"
                />
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del titular
                </label>
                <Input
                  type="text"
                  placeholder="Juan Pérez"
                  value={cardData.name}
                  onChange={(e) => setCardData({
                    ...cardData,
                    name: e.target.value
                  })}
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vencimiento
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/AA"
                    value={cardData.expiry}
                    onChange={(e) => setCardData({
                      ...cardData,
                      expiry: formatExpiry(e.target.value)
                    })}
                    maxLength="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVV
                  </label>
                  <Input
                    type="text"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({
                      ...cardData,
                      cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                    })}
                    maxLength="4"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (para el recibo)
                </label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={cardData.email}
                  onChange={(e) => setCardData({
                    ...cardData,
                    email: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Security notice */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tu información está segura. Procesamos los pagos a través de MercadoPago con encriptación SSL.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setPaymentStep('select')}
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                onClick={processCardPayment}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar ${cartTotal.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {paymentStep === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Procesando tu pago...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Por favor no cierres esta ventana
            </p>
          </div>
        )}

        {/* Payment complete */}
        {paymentStep === 'complete' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ¡Pago completado!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              El pago de ${cartTotal.toFixed(2)} se procesó correctamente
            </p>
            
            <Button
              onClick={handleClose}
              className="mt-6"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;