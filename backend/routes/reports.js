const express = require('express');
const router = express.Router();
const { authMiddleware: authenticateToken, requireRole } = require('../middleware/auth');
const reportsService = require('../services/reportsService');
const exportService = require('../services/exportService');

// Middleware to ensure user has access to reports
const requireReportsAccess = [authenticateToken, requireRole(['admin', 'manager', 'owner'])];

// Sales Report
router.get('/sales', requireReportsAccess, async (req, res) => {
  try {
    const { period, startDate, endDate, storeId } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or custom date range (startDate and endDate) is required' 
      });
    }

    const result = await reportsService.getSalesReport({
      period,
      startDate,
      endDate,
      storeId: storeId ? parseInt(storeId) : null
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inventory Report
router.get('/inventory', requireReportsAccess, async (req, res) => {
  try {
    const { storeId, lowStockOnly } = req.query;
    
    const result = await reportsService.getInventoryReport({
      storeId: storeId ? parseInt(storeId) : null,
      lowStockOnly: lowStockOnly === 'true'
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production Report
router.get('/production', requireReportsAccess, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or custom date range (startDate and endDate) is required' 
      });
    }

    const result = await reportsService.getProductionReport({
      period,
      startDate,
      endDate
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Financial Report
router.get('/financial', requireReportsAccess, async (req, res) => {
  try {
    const { period, startDate, endDate, storeId } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or custom date range (startDate and endDate) is required' 
      });
    }

    const result = await reportsService.getFinancialReport({
      period,
      startDate,
      endDate,
      storeId: storeId ? parseInt(storeId) : null
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delivery Report
router.get('/delivery', requireReportsAccess, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or custom date range (startDate and endDate) is required' 
      });
    }

    const result = await reportsService.getDeliveryReport({
      period,
      startDate,
      endDate
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Analytics
router.get('/customers', requireReportsAccess, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({ 
        error: 'Period or custom date range (startDate and endDate) is required' 
      });
    }

    const result = await reportsService.getCustomerAnalytics({
      period,
      startDate,
      endDate
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comparative Analysis
router.get('/comparative', requireReportsAccess, async (req, res) => {
  try {
    const { period, storeId } = req.query;
    
    if (!period) {
      return res.status(400).json({ error: 'Period is required' });
    }

    const result = await reportsService.getComparativeAnalysis({
      period,
      storeId: storeId ? parseInt(storeId) : null
    });

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export endpoint
router.post('/export', requireReportsAccess, async (req, res) => {
  try {
    const { reportType, format, reportData, title } = req.body;
    
    if (!reportType || !format || !reportData) {
      return res.status(400).json({ 
        error: 'reportType, format, and reportData are required' 
      });
    }

    if (!['pdf', 'csv', 'excel'].includes(format)) {
      return res.status(400).json({ 
        error: 'Invalid format. Supported formats: pdf, csv, excel' 
      });
    }

    let result;
    let contentType;
    let filename;

    switch (format) {
      case 'pdf':
        const pdf = exportService.generatePDF(reportData, reportType, title);
        result = pdf.output('arraybuffer');
        contentType = 'application/pdf';
        filename = `${reportType}_report_${Date.now()}.pdf`;
        break;
      
      case 'csv':
        result = exportService.generateCSV(reportData, reportType);
        contentType = 'text/csv';
        filename = `${reportType}_report_${Date.now()}.csv`;
        break;
      
      case 'excel':
        result = exportService.generateExcel(reportData, reportType);
        contentType = 'text/csv'; // Excel can open CSV files
        filename = `${reportType}_report_${Date.now()}.csv`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(result));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Summary - Quick stats for multiple report types
router.get('/dashboard', requireReportsAccess, async (req, res) => {
  try {
    const { period = 'today', storeId } = req.query;

    // Fetch multiple reports in parallel
    const [salesResult, inventoryResult, financialResult] = await Promise.all([
      reportsService.getSalesReport({ period, storeId: storeId ? parseInt(storeId) : null }),
      reportsService.getInventoryReport({ storeId: storeId ? parseInt(storeId) : null, lowStockOnly: true }),
      reportsService.getFinancialReport({ period, storeId: storeId ? parseInt(storeId) : null })
    ]);

    const dashboard = {
      period,
      sales: salesResult.success ? {
        totalRevenue: salesResult.data.summary.totalRevenue,
        totalOrders: salesResult.data.summary.totalSales,
        averageOrderValue: salesResult.data.summary.averageOrderValue
      } : null,
      inventory: inventoryResult.success ? {
        lowStockCount: inventoryResult.data.summary.lowStockCount,
        totalValue: inventoryResult.data.summary.totalValue
      } : null,
      financial: financialResult.success ? {
        netIncome: financialResult.data.summary.netIncome,
        profitMargin: financialResult.data.summary.profitMargin,
        expenses: financialResult.data.summary.expenses
      } : null
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available report periods
router.get('/periods', authenticateToken, (req, res) => {
  res.json({
    periods: [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last_7_days', label: 'Last 7 Days' },
      { value: 'last_30_days', label: 'Last 30 Days' },
      { value: 'this_month', label: 'This Month' },
      { value: 'last_month', label: 'Last Month' },
      { value: 'custom', label: 'Custom Range' }
    ]
  });
});

module.exports = router;