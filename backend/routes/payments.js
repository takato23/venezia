const express = require('express');
const router = express.Router();
const MercadoPagoService = require('../services/mercadopagoService');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const { models, USE_SUPABASE } = require('../config/database');
const { getNotificationService } = require('../services/notificationService.instance');

// Initialize MercadoPago service
let mercadoPagoService;
try {
  mercadoPagoService = new MercadoPagoService();
} catch (error) {
  console.error('⚠️  MercadoPago service not configured:', error.message);
}

// Middleware to check if MercadoPago is configured
const requireMercadoPago = (req, res, next) => {
  if (!mercadoPagoService) {
    return res.status(503).json({
      success: false,
      error: 'Payment service not configured',
      message: 'Please configure MercadoPago credentials in environment variables'
    });
  }
  next();
};

/**
 * POST /api/payments/create-preference
 * Create a payment preference for Point of Sale with QR code
 */
router.post('/create-preference', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const { items, orderId, customerId, customerEmail, total } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required for creating a payment preference'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Create the preference
    const result = await mercadoPagoService.createPOSPreference({
      items,
      orderId,
      customerId,
      customerEmail,
      total
    });

    // Store preference data in database if needed
    // This is where you'd save the preference ID with the order

    res.json(result);

  } catch (error) {
    console.error('Error creating payment preference:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to create payment preference',
      details: error.details
    });
  }
});

/**
 * POST /api/payments/process-card
 * Process a credit/debit card payment
 */
router.post('/process-card', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const {
      token,
      installments,
      paymentMethodId,
      payerEmail,
      amount,
      description,
      orderId,
      customerId
    } = req.body;

    // Validate required fields
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Payment token is required'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    if (!payerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Payer email is required'
      });
    }

    // Process the payment
    const result = await mercadoPagoService.processCardPayment({
      token,
      installments,
      paymentMethodId,
      payerEmail,
      amount,
      description,
      orderId,
      customerId
    });

    // Update order status based on payment result
    if (result.success && orderId) {
      // Update your order/sale record with payment information
      // This is where you'd update the sale status to 'paid'
      try {
        const Sale = models.Sale;
        if (Sale && Sale.updatePaymentStatus) {
          await Sale.updatePaymentStatus(orderId, {
            status: 'paid',
            paymentId: result.paymentId,
            paymentMethod: 'mercadopago_card',
            paymentDetails: {
              lastFourDigits: result.lastFourDigits,
              authorizationCode: result.authorizationCode,
              installments: result.installments
            }
          });
        }
      } catch (updateError) {
        console.error('Error updating order payment status:', updateError);
        // Don't fail the response, payment was successful
      }
    }

    res.json(result);

  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to process payment',
      details: error.details
    });
  }
});

/**
 * GET /api/payments/:paymentId
 * Get payment information by ID
 */
router.get('/:paymentId', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const result = await mercadoPagoService.getPayment(paymentId);
    res.json(result);

  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to get payment information',
      details: error.details
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle MercadoPago webhook notifications
 */
router.post('/webhook', async (req, res) => {
  try {
    const notification = req.body;
    const signature = req.headers['x-signature'];

    // Log webhook reception
    console.log('📨 MercadoPago webhook received:', notification.type);

    // Process the webhook
    const result = await mercadoPagoService.processWebhook(notification, signature);

    // Always return 200 OK to MercadoPago
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to avoid webhook retries
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * POST /api/payments/:paymentId/refund
 * Create a refund for a payment
 */
router.post('/:paymentId/refund', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const result = await mercadoPagoService.refundPayment(paymentId, amount);

    // Update order/sale status if refund is successful
    if (result.success) {
      // Update your order record with refund information
      // This is where you'd update the sale status to 'refunded'
    }

    res.json({
      ...result,
      reason // Include the reason for record keeping
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to create refund',
      details: error.details
    });
  }
});

/**
 * GET /api/payments/search
 * Search payments by criteria
 */
router.get('/search', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const { orderId, customerId, status, dateFrom, dateTo } = req.query;

    const result = await mercadoPagoService.searchPayments({
      orderId,
      customerId,
      status,
      dateFrom,
      dateTo
    });

    res.json(result);

  } catch (error) {
    console.error('Error searching payments:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to search payments',
      details: error.details
    });
  }
});

/**
 * GET /api/payments/config
 * Get payment configuration (public info only)
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    configured: !!mercadoPagoService,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    supportedMethods: ['credit_card', 'debit_card', 'qr_code'],
    supportedCardBrands: ['visa', 'mastercard', 'amex', 'maestro', 'cabal'],
    currency: 'ARS'
  });
});

/**
 * POST /api/payments/reconcile
 * Reconcile payments with orders
 */
router.post('/reconcile', flexibleAuth, requireMercadoPago, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.body;

    // Search for payments in the date range
    const paymentsResult = await mercadoPagoService.searchPayments({
      dateFrom: dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Default last 24h
      dateTo: dateTo || new Date().toISOString()
    });

    const reconciliationResults = [];

    // Process each payment
    for (const payment of paymentsResult.payments) {
      const orderId = payment.metadata?.order_id;
      
      if (orderId) {
        try {
          // Update order with payment information
          const Sale = models.Sale;
          if (Sale && Sale.reconcilePayment) {
            const result = await Sale.reconcilePayment(orderId, {
              paymentId: payment.id,
              status: payment.status,
              amount: payment.transaction_amount,
              dateApproved: payment.date_approved
            });
            
            reconciliationResults.push({
              orderId,
              paymentId: payment.id,
              status: 'reconciled',
              result
            });
          }
        } catch (error) {
          reconciliationResults.push({
            orderId,
            paymentId: payment.id,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    res.json({
      success: true,
      totalPayments: paymentsResult.total,
      reconciled: reconciliationResults.filter(r => r.status === 'reconciled').length,
      errors: reconciliationResults.filter(r => r.status === 'error').length,
      results: reconciliationResults
    });

  } catch (error) {
    console.error('Error reconciling payments:', error);
    res.status(500).json({
      success: false,
      error: error.error || 'Failed to reconcile payments',
      details: error.details
    });
  }
});

module.exports = router;