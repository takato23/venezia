const { MercadoPagoConfig, Payment, Preference, MerchantOrder } = require('mercadopago');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { getNotificationService } = require('./notificationService.instance');

class MercadoPagoService {
  constructor() {
    // Initialize with environment-based configuration
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!accessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    // Initialize the client with the new SDK
    this.client = new MercadoPagoConfig({ 
      accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc' // You should generate unique keys for each request
      }
    });

    // Initialize API clients
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
    this.merchantOrder = new MerchantOrder(this.client);

    // Store configuration
    this.config = {
      accessToken,
      isProduction,
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
      storeId: process.env.MERCADOPAGO_STORE_ID || 'venezia-pos-001',
      externalPosId: process.env.MERCADOPAGO_EXTERNAL_POS_ID || 'venezia-caja-01',
      notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL || 'https://your-domain.com/api/payments/webhook',
      successUrl: process.env.MERCADOPAGO_SUCCESS_URL || 'https://your-domain.com/payment-success',
      failureUrl: process.env.MERCADOPAGO_FAILURE_URL || 'https://your-domain.com/payment-failure',
      pendingUrl: process.env.MERCADOPAGO_PENDING_URL || 'https://your-domain.com/payment-pending'
    };

    console.log(`💳 MercadoPago service initialized in ${isProduction ? 'PRODUCTION' : 'SANDBOX'} mode`);
  }

  /**
   * Create a payment preference for Point of Sale
   * @param {Object} orderData - Order information
   * @returns {Object} Preference data with QR code
   */
  async createPOSPreference(orderData) {
    try {
      const { items, orderId, customerId, customerEmail, total } = orderData;

      // Build preference items
      const preferenceItems = items.map(item => ({
        id: item.id?.toString() || crypto.randomUUID(),
        title: item.name || item.title,
        description: item.description || '',
        category_id: item.category || 'food',
        quantity: parseInt(item.quantity) || 1,
        currency_id: 'ARS', // Argentine Peso
        unit_price: parseFloat(item.price) || 0
      }));

      // Create preference data
      const preferenceData = {
        items: preferenceItems,
        external_reference: `order_${orderId}`,
        notification_url: this.config.notificationUrl,
        back_urls: {
          success: this.config.successUrl,
          failure: this.config.failureUrl,
          pending: this.config.pendingUrl
        },
        auto_return: 'approved',
        statement_descriptor: 'VENEZIA HELADOS',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          order_id: orderId,
          customer_id: customerId,
          store_id: this.config.storeId,
          pos_id: this.config.externalPosId,
          integration_type: 'pos'
        }
      };

      // Add payer information if available
      if (customerEmail) {
        preferenceData.payer = {
          email: customerEmail
        };
      }

      // Create the preference
      const response = await this.preference.create({ body: preferenceData });
      
      if (!response || !response.id) {
        throw new Error('Failed to create payment preference');
      }

      // Generate QR code for in-store payments
      const qrData = {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
      };

      const qrCodeDataUrl = await this.generateQRCode(response.init_point);

      return {
        success: true,
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
        qrCode: qrCodeDataUrl,
        expiresAt: preferenceData.expiration_date_to,
        metadata: preferenceData.metadata
      };

    } catch (error) {
      console.error('Error creating POS preference:', error);
      throw {
        success: false,
        error: error.message || 'Failed to create payment preference',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Process a direct card payment
   * @param {Object} paymentData - Payment information
   * @returns {Object} Payment result
   */
  async processCardPayment(paymentData) {
    try {
      const {
        token,
        installments = 1,
        paymentMethodId,
        payerEmail,
        amount,
        description,
        orderId,
        customerId
      } = paymentData;

      const payment = {
        transaction_amount: parseFloat(amount),
        token: token,
        description: description || `Order #${orderId}`,
        installments: parseInt(installments),
        payment_method_id: paymentMethodId,
        payer: {
          email: payerEmail
        },
        external_reference: `order_${orderId}`,
        statement_descriptor: 'VENEZIA HELADOS',
        metadata: {
          order_id: orderId,
          customer_id: customerId,
          store_id: this.config.storeId,
          pos_id: this.config.externalPosId,
          integration_type: 'card'
        },
        capture: true, // Capture payment immediately
        binary_mode: false // Allow pending status
      };

      // Create the payment
      const response = await this.payment.create({ body: payment });

      if (!response || !response.id) {
        throw new Error('Failed to process payment');
      }

      // Determine payment status
      const status = this.mapPaymentStatus(response.status);

      return {
        success: status === 'approved',
        paymentId: response.id,
        status: status,
        statusDetail: response.status_detail,
        transactionAmount: response.transaction_amount,
        lastFourDigits: response.card?.last_four_digits,
        paymentMethodId: response.payment_method_id,
        installments: response.installments,
        metadata: response.metadata,
        dateApproved: response.date_approved,
        authorizationCode: response.authorization_code
      };

    } catch (error) {
      console.error('Error processing card payment:', error);
      throw {
        success: false,
        error: error.message || 'Failed to process payment',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Get payment information by ID
   * @param {string} paymentId - Payment ID
   * @returns {Object} Payment information
   */
  async getPayment(paymentId) {
    try {
      const response = await this.payment.get({ id: paymentId });

      if (!response) {
        throw new Error('Payment not found');
      }

      return {
        success: true,
        payment: {
          id: response.id,
          status: this.mapPaymentStatus(response.status),
          statusDetail: response.status_detail,
          amount: response.transaction_amount,
          dateApproved: response.date_approved,
          lastFourDigits: response.card?.last_four_digits,
          paymentMethodId: response.payment_method_id,
          metadata: response.metadata
        }
      };

    } catch (error) {
      console.error('Error getting payment:', error);
      throw {
        success: false,
        error: error.message || 'Failed to get payment information',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Process webhook notification from MercadoPago
   * @param {Object} notification - Webhook notification data
   * @param {string} signature - Webhook signature
   * @returns {Object} Processing result
   */
  async processWebhook(notification, signature) {
    try {
      // Verify webhook signature if secret is configured
      if (this.config.webhookSecret && signature) {
        const isValid = this.verifyWebhookSignature(notification, signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      const { type, data } = notification;

      switch (type) {
        case 'payment':
          return await this.handlePaymentNotification(data.id);
        
        case 'merchant_order':
          return await this.handleMerchantOrderNotification(data.id);
        
        default:
          console.log(`Unhandled webhook type: ${type}`);
          return { success: true, message: 'Notification received' };
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
      throw {
        success: false,
        error: error.message || 'Failed to process webhook',
        details: error
      };
    }
  }

  /**
   * Handle payment notification
   * @param {string} paymentId - Payment ID
   * @returns {Object} Processing result
   */
  async handlePaymentNotification(paymentId) {
    try {
      const paymentInfo = await this.getPayment(paymentId);
      const payment = paymentInfo.payment;
      
      console.log(`Payment ${paymentId} status: ${payment.status}`);
      
      // Send notifications based on payment status
      const notificationService = getNotificationService();
      if (notificationService && payment.metadata) {
        const orderData = {
          order_number: payment.metadata.order_id || payment.external_reference,
          customer_id: payment.metadata.customer_id,
          store_id: payment.metadata.store_id || 1
        };
        
        if (payment.status === 'approved') {
          await notificationService.notifyPaymentSuccess(
            {
              id: paymentId,
              amount: payment.transaction_amount,
              payment_method: payment.payment_method_id,
              status: payment.status
            },
            orderData
          ).catch(err => console.error('Error sending payment success notification:', err));
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          await notificationService.createNotification('payment_failed', {
            payment_id: paymentId,
            order_number: orderData.order_number,
            amount: payment.transaction_amount,
            reason: payment.status_detail || 'Payment failed',
            payment_method: payment.payment_method_id
          }, {
            userId: orderData.customer_id,
            storeId: orderData.store_id,
            priority: 'high'
          }).catch(err => console.error('Error sending payment failed notification:', err));
        }
      }

      return {
        success: true,
        paymentId,
        status: payment.status,
        metadata: payment.metadata
      };

    } catch (error) {
      console.error('Error handling payment notification:', error);
      throw error;
    }
  }

  /**
   * Handle merchant order notification
   * @param {string} orderId - Merchant order ID
   * @returns {Object} Processing result
   */
  async handleMerchantOrderNotification(orderId) {
    try {
      const response = await this.merchantOrder.get({ id: orderId });

      if (!response) {
        throw new Error('Merchant order not found');
      }

      // Process the merchant order update
      console.log(`Merchant order ${orderId} updated`);

      return {
        success: true,
        orderId,
        status: response.status,
        payments: response.payments
      };

    } catch (error) {
      console.error('Error handling merchant order notification:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for payment
   * @param {string} data - Data to encode in QR
   * @returns {string} QR code data URL
   */
  async generateQRCode(data) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {Object} data - Webhook data
   * @param {string} signature - Provided signature
   * @returns {boolean} Is valid
   */
  verifyWebhookSignature(data, signature) {
    const dataString = JSON.stringify(data);
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    hmac.update(dataString);
    const calculatedSignature = hmac.digest('hex');
    return calculatedSignature === signature;
  }

  /**
   * Map MercadoPago status to internal status
   * @param {string} mpStatus - MercadoPago status
   * @returns {string} Internal status
   */
  mapPaymentStatus(mpStatus) {
    const statusMap = {
      'approved': 'approved',
      'pending': 'pending',
      'authorized': 'authorized',
      'in_process': 'processing',
      'in_mediation': 'in_mediation',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'charged_back'
    };

    return statusMap[mpStatus] || 'unknown';
  }

  /**
   * Create a refund for a payment
   * @param {string} paymentId - Payment ID to refund
   * @param {number} amount - Optional partial refund amount
   * @returns {Object} Refund result
   */
  async refundPayment(paymentId, amount = null) {
    try {
      const refundData = {};
      
      if (amount) {
        refundData.amount = parseFloat(amount);
      }

      const response = await this.payment.refund({ 
        id: paymentId,
        body: refundData 
      });

      return {
        success: true,
        refundId: response.id,
        status: response.status,
        amount: response.amount,
        dateCreated: response.date_created
      };

    } catch (error) {
      console.error('Error creating refund:', error);
      throw {
        success: false,
        error: error.message || 'Failed to create refund',
        details: error.response?.data || error
      };
    }
  }

  /**
   * Search payments by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} List of payments
   */
  async searchPayments(criteria) {
    try {
      const { orderId, customerId, status, dateFrom, dateTo } = criteria;
      const filters = {};

      if (orderId) {
        filters.external_reference = `order_${orderId}`;
      }

      if (status) {
        filters.status = status;
      }

      if (dateFrom || dateTo) {
        filters.date_created = {};
        if (dateFrom) filters.date_created.gte = dateFrom;
        if (dateTo) filters.date_created.lte = dateTo;
      }

      const response = await this.payment.search({ 
        options: { 
          criteria: 'desc',
          sort: 'date_created',
          limit: 100,
          filters 
        } 
      });

      return {
        success: true,
        payments: response.results || [],
        total: response.paging?.total || 0
      };

    } catch (error) {
      console.error('Error searching payments:', error);
      throw {
        success: false,
        error: error.message || 'Failed to search payments',
        details: error.response?.data || error
      };
    }
  }
}

module.exports = MercadoPagoService;