const { jsPDF } = require('jspdf');
// Note: jspdf-autotable extends jsPDF prototype when imported

class ExportService {
  // Generate PDF report
  generatePDF(reportData, reportType, title) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(title || `${reportType} Report`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date range
    if (reportData.period) {
      doc.setFontSize(12);
      const periodText = `Period: ${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}`;
      doc.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Summary section
    if (reportData.summary) {
      doc.setFontSize(14);
      doc.text('Summary', 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = typeof value === 'number' ? 
          (key.includes('Revenue') || key.includes('Value') || key.includes('Cost') ? 
            `$${value.toFixed(2)}` : 
            value.toFixed(2)) : 
          value;
        doc.text(`${label}: ${displayValue}`, 14, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Report-specific content
    switch (reportType) {
      case 'sales':
        this.addSalesContent(doc, reportData, yPosition);
        break;
      case 'inventory':
        this.addInventoryContent(doc, reportData, yPosition);
        break;
      case 'production':
        this.addProductionContent(doc, reportData, yPosition);
        break;
      case 'financial':
        this.addFinancialContent(doc, reportData, yPosition);
        break;
      case 'customer':
        this.addCustomerContent(doc, reportData, yPosition);
        break;
    }

    return doc;
  }

  // Add sales content to PDF
  addSalesContent(doc, data, startY) {
    let yPosition = startY;

    // Top Products Table
    if (data.topProducts && data.topProducts.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Products', 14, yPosition);
      yPosition += 10;

      const productHeaders = ['Product', 'Quantity Sold', 'Revenue'];
      const productRows = data.topProducts.map(p => [
        p.product?.name || p.product_name || 'Unknown',
        p.quantity.toString(),
        `$${p.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        head: [productHeaders],
        body: productRows,
        startY: yPosition,
        theme: 'striped'
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Payment Methods
    if (data.paymentMethods) {
      doc.setFontSize(14);
      doc.text('Payment Methods', 14, yPosition);
      yPosition += 10;

      const paymentHeaders = ['Method', 'Count', 'Percentage'];
      const total = Object.values(data.paymentMethods).reduce((a, b) => a + b, 0);
      const paymentRows = Object.entries(data.paymentMethods).map(([method, count]) => [
        method,
        count.toString(),
        `${((count / total) * 100).toFixed(1)}%`
      ]);

      doc.autoTable({
        head: [paymentHeaders],
        body: paymentRows,
        startY: yPosition,
        theme: 'striped'
      });
    }
  }

  // Add inventory content to PDF
  addInventoryContent(doc, data, startY) {
    let yPosition = startY;

    // Low stock items
    const lowStockItems = data.items.filter(item => item.status === 'low');
    if (lowStockItems.length > 0) {
      doc.setFontSize(14);
      doc.text('Low Stock Items', 14, yPosition);
      yPosition += 10;

      const headers = ['Item', 'Type', 'Current Stock', 'Minimum Stock', 'Status'];
      const rows = lowStockItems.map(item => [
        item.name,
        item.type,
        `${item.current_stock} ${item.unit}`,
        `${item.minimum_stock} ${item.unit}`,
        item.status.toUpperCase()
      ]);

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] }
      });
    }
  }

  // Add production content to PDF
  addProductionContent(doc, data, startY) {
    let yPosition = startY;

    // Production by product
    if (data.productionByProduct && data.productionByProduct.length > 0) {
      doc.setFontSize(14);
      doc.text('Production Summary', 14, yPosition);
      yPosition += 10;

      const headers = ['Product', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin'];
      const rows = data.productionByProduct.slice(0, 10).map(p => [
        p.product?.name || p.product_name || 'Unknown',
        p.quantityProduced.toString(),
        `$${p.revenue.toFixed(2)}`,
        `$${p.cost.toFixed(2)}`,
        `$${(p.revenue - p.cost).toFixed(2)}`,
        `${((p.revenue - p.cost) / p.revenue * 100).toFixed(1)}%`
      ]);

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'striped'
      });
    }
  }

  // Add financial content to PDF
  addFinancialContent(doc, data, startY) {
    let yPosition = startY;

    // Daily breakdown chart (simplified table)
    if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.text('Daily Financial Summary', 14, yPosition);
      yPosition += 10;

      const headers = ['Date', 'Revenue', 'Expenses', 'Net', 'Transactions'];
      const rows = data.dailyBreakdown.map(day => [
        new Date(day.date).toLocaleDateString(),
        `$${day.revenue.toFixed(2)}`,
        `$${day.expenses.toFixed(2)}`,
        `$${(day.revenue - day.expenses).toFixed(2)}`,
        day.transactions.toString()
      ]);

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'striped'
      });
    }
  }

  // Add customer content to PDF
  addCustomerContent(doc, data, startY) {
    let yPosition = startY;

    // Top customers
    if (data.topCustomers && data.topCustomers.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Customers', 14, yPosition);
      yPosition += 10;

      const headers = ['Customer', 'Orders', 'Revenue', 'Avg Order Value'];
      const rows = data.topCustomers.map(c => [
        c.name,
        c.periodOrders.toString(),
        `$${c.periodRevenue.toFixed(2)}`,
        `$${(c.periodRevenue / c.periodOrders).toFixed(2)}`
      ]);

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'striped'
      });
    }
  }

  // Generate CSV
  generateCSV(reportData, reportType) {
    let csv = '';
    
    // Add headers
    csv += `${reportType.toUpperCase()} REPORT\n`;
    if (reportData.period) {
      csv += `Period: ${new Date(reportData.period.start).toLocaleDateString()} - ${new Date(reportData.period.end).toLocaleDateString()}\n`;
    }
    csv += '\n';

    // Add summary
    if (reportData.summary) {
      csv += 'SUMMARY\n';
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        csv += `${label},${value}\n`;
      });
      csv += '\n';
    }

    // Add report-specific data
    switch (reportType) {
      case 'sales':
        csv += this.salesDataToCSV(reportData);
        break;
      case 'inventory':
        csv += this.inventoryDataToCSV(reportData);
        break;
      case 'production':
        csv += this.productionDataToCSV(reportData);
        break;
      case 'financial':
        csv += this.financialDataToCSV(reportData);
        break;
      case 'customer':
        csv += this.customerDataToCSV(reportData);
        break;
    }

    return csv;
  }

  // Convert sales data to CSV
  salesDataToCSV(data) {
    let csv = '';

    // Sales details
    if (data.sales && data.sales.length > 0) {
      csv += 'SALES DETAILS\n';
      csv += 'Date,Customer,Store,Total,Payment Method,Status\n';
      data.sales.forEach(sale => {
        csv += `${new Date(sale.created_at).toLocaleString()},`;
        csv += `${sale.customer?.name || sale.customer_name || 'Walk-in'},`;
        csv += `${sale.store?.name || sale.store_name || 'Main'},`;
        csv += `${sale.total},`;
        csv += `${sale.payment_method},`;
        csv += `${sale.status}\n`;
      });
      csv += '\n';
    }

    // Top products
    if (data.topProducts && data.topProducts.length > 0) {
      csv += 'TOP PRODUCTS\n';
      csv += 'Product,Quantity Sold,Revenue\n';
      data.topProducts.forEach(p => {
        csv += `${p.product?.name || p.product_name || 'Unknown'},`;
        csv += `${p.quantity},`;
        csv += `${p.revenue}\n`;
      });
    }

    return csv;
  }

  // Convert inventory data to CSV
  inventoryDataToCSV(data) {
    let csv = '';

    if (data.items && data.items.length > 0) {
      csv += 'INVENTORY ITEMS\n';
      csv += 'Name,Type,Category,Current Stock,Minimum Stock,Unit,Value,Status\n';
      data.items.forEach(item => {
        csv += `${item.name},`;
        csv += `${item.type},`;
        csv += `${item.category},`;
        csv += `${item.current_stock},`;
        csv += `${item.minimum_stock},`;
        csv += `${item.unit},`;
        csv += `${item.value},`;
        csv += `${item.status}\n`;
      });
    }

    return csv;
  }

  // Convert production data to CSV
  productionDataToCSV(data) {
    let csv = '';

    if (data.productionByProduct && data.productionByProduct.length > 0) {
      csv += 'PRODUCTION BY PRODUCT\n';
      csv += 'Product,Quantity Produced,Revenue,Cost,Profit,Margin %\n';
      data.productionByProduct.forEach(p => {
        csv += `${p.product?.name || p.product_name || 'Unknown'},`;
        csv += `${p.quantityProduced},`;
        csv += `${p.revenue},`;
        csv += `${p.cost},`;
        csv += `${p.revenue - p.cost},`;
        csv += `${((p.revenue - p.cost) / p.revenue * 100).toFixed(2)}\n`;
      });
    }

    return csv;
  }

  // Convert financial data to CSV
  financialDataToCSV(data) {
    let csv = '';

    if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
      csv += 'DAILY FINANCIAL BREAKDOWN\n';
      csv += 'Date,Revenue,Expenses,Net Income,Transactions\n';
      data.dailyBreakdown.forEach(day => {
        csv += `${day.date},`;
        csv += `${day.revenue},`;
        csv += `${day.expenses},`;
        csv += `${day.revenue - day.expenses},`;
        csv += `${day.transactions}\n`;
      });
    }

    return csv;
  }

  // Convert customer data to CSV
  customerDataToCSV(data) {
    let csv = '';

    if (data.topCustomers && data.topCustomers.length > 0) {
      csv += 'TOP CUSTOMERS\n';
      csv += 'Name,Email,Phone,Orders,Revenue,Average Order Value\n';
      data.topCustomers.forEach(c => {
        csv += `${c.name},`;
        csv += `${c.email || ''},`;
        csv += `${c.phone || ''},`;
        csv += `${c.periodOrders},`;
        csv += `${c.periodRevenue},`;
        csv += `${c.periodRevenue / c.periodOrders}\n`;
      });
    }

    return csv;
  }

  // Generate Excel-compatible format (CSV with proper formatting)
  generateExcel(reportData, reportType) {
    // For now, we'll use CSV format that Excel can open
    // In a production environment, you might want to use a library like exceljs
    return this.generateCSV(reportData, reportType);
  }
}

module.exports = new ExportService();