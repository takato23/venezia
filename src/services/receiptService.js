import jsPDF from 'jspdf';
import 'jspdf-autotable';

class ReceiptService {
  constructor() {
    this.companyInfo = {
      name: 'Heladería Venezia',
      address: 'Av. Principal 123, Buenos Aires',
      phone: '+54 11 1234-5678',
      email: 'info@heladeriavenezia.com',
      cuit: '30-12345678-9'
    };
  }

  generateReceipt(saleData) {
    const doc = new jsPDF({
      format: [80, 297], // 80mm wide thermal paper
      unit: 'mm'
    });

    // Set default font
    doc.setFont('helvetica');
    
    let yPos = 10;
    const lineHeight = 4;
    const pageWidth = 80;
    
    // Company Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight + 2;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
    doc.text(`Tel: ${this.companyInfo.phone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
    doc.text(`CUIT: ${this.companyInfo.cuit}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight + 2;
    
    // Line separator
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += lineHeight;
    
    // Receipt info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`RECIBO ${saleData.receipt_number}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const date = new Date(saleData.created_at || Date.now());
    doc.text(`Fecha: ${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR')}`, 5, yPos);
    yPos += lineHeight;
    
    if (saleData.customer_name || saleData.customer?.name) {
      doc.text(`Cliente: ${saleData.customer_name || saleData.customer?.name}`, 5, yPos);
      yPos += lineHeight;
    }
    
    if (saleData.customer_phone || saleData.customer?.phone) {
      doc.text(`Tel: ${saleData.customer_phone || saleData.customer?.phone}`, 5, yPos);
      yPos += lineHeight;
    }
    
    // Line separator
    yPos += 2;
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += lineHeight;
    
    // Items header
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 5, yPos);
    doc.text('Cant', 35, yPos);
    doc.text('Precio', 45, yPos);
    doc.text('Total', 65, yPos);
    yPos += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += lineHeight;
    
    // Items
    let subtotal = 0;
    saleData.items.forEach(item => {
      // Product name (truncate if too long)
      const productName = item.product_name || item.name || 'Producto';
      const truncatedName = productName.length > 20 ? productName.substring(0, 17) + '...' : productName;
      doc.text(truncatedName, 5, yPos);
      
      // Quantity
      doc.text(item.quantity.toString(), 37, yPos);
      
      // Unit price
      const unitPrice = parseFloat(item.unit_price || item.price || 0);
      doc.text(`$${unitPrice.toFixed(2)}`, 45, yPos);
      
      // Line total
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      doc.text(`$${lineTotal.toFixed(2)}`, 60, yPos);
      
      yPos += lineHeight;
      
      // Check if we need a new page
      if (yPos > 280) {
        doc.addPage();
        yPos = 10;
      }
    });
    
    // Line separator
    yPos += 2;
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += lineHeight;
    
    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 45, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 60, yPos);
    yPos += lineHeight;
    
    if (saleData.discount && saleData.discount > 0) {
      doc.text('Descuento:', 45, yPos);
      const discountAmount = saleData.discount_type === 'percent' 
        ? subtotal * (saleData.discount / 100)
        : saleData.discount;
      doc.text(`-$${discountAmount.toFixed(2)}`, 60, yPos);
      yPos += lineHeight;
    }
    
    doc.setFontSize(10);
    doc.text('TOTAL:', 45, yPos);
    doc.text(`$${parseFloat(saleData.total).toFixed(2)}`, 60, yPos);
    yPos += lineHeight + 2;
    
    // Payment method
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const paymentMethod = this.getPaymentMethodName(saleData.payment_method);
    doc.text(`Forma de pago: ${paymentMethod}`, 5, yPos);
    yPos += lineHeight;
    
    // Delivery info if applicable
    if (saleData.sale_type === 'delivery' && saleData.delivery_address) {
      yPos += 2;
      doc.line(5, yPos, pageWidth - 5, yPos);
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DE ENTREGA', pageWidth / 2, yPos, { align: 'center' });
      yPos += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Dirección: ${saleData.delivery_address}`, 5, yPos);
      yPos += lineHeight;
      
      if (saleData.estimated_time) {
        doc.text(`Tiempo estimado: ${saleData.estimated_time}`, 5, yPos);
        yPos += lineHeight;
      }
    }
    
    // Footer
    yPos += 4;
    doc.line(5, yPos, pageWidth - 5, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(7);
    doc.text('¡Gracias por su compra!', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight;
    doc.text('Conserve este recibo para cualquier reclamo', pageWidth / 2, yPos, { align: 'center' });
    
    return doc;
  }

  generateInvoice(saleData) {
    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm'
    });

    // Set default font
    doc.setFont('helvetica');
    
    // Company Logo/Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, 20, 20);
    
    // Company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.address, 20, 28);
    doc.text(`Tel: ${this.companyInfo.phone}`, 20, 33);
    doc.text(`Email: ${this.companyInfo.email}`, 20, 38);
    doc.text(`CUIT: ${this.companyInfo.cuit}`, 20, 43);
    
    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 160, 20);
    
    // Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº: ${saleData.invoice_number || saleData.receipt_number}`, 160, 28);
    const date = new Date(saleData.created_at || Date.now());
    doc.text(`Fecha: ${date.toLocaleDateString('es-AR')}`, 160, 33);
    
    // Customer info box
    doc.rect(20, 55, 170, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 25, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${saleData.customer_name || saleData.customer?.name || 'Cliente General'}`, 25, 70);
    doc.text(`Teléfono: ${saleData.customer_phone || saleData.customer?.phone || '-'}`, 25, 75);
    doc.text(`Email: ${saleData.customer_email || saleData.customer?.email || '-'}`, 25, 80);
    
    // Items table
    const tableData = saleData.items.map(item => [
      item.product_name || item.name || 'Producto',
      item.quantity,
      `$${parseFloat(item.unit_price || item.price || 0).toFixed(2)}`,
      `$${(parseFloat(item.unit_price || item.price || 0) * item.quantity).toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: [['Producto', 'Cantidad', 'Precio Unit.', 'Total']],
      body: tableData,
      startY: 95,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY;
    
    // Totals
    const subtotal = saleData.items.reduce((sum, item) => 
      sum + (parseFloat(item.unit_price || item.price || 0) * item.quantity), 0
    );
    
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 140, finalY + 10);
    doc.text(`$${subtotal.toFixed(2)}`, 175, finalY + 10, { align: 'right' });
    
    if (saleData.discount && saleData.discount > 0) {
      const discountAmount = saleData.discount_type === 'percent' 
        ? subtotal * (saleData.discount / 100)
        : saleData.discount;
      doc.text('Descuento:', 140, finalY + 15);
      doc.text(`-$${discountAmount.toFixed(2)}`, 175, finalY + 15, { align: 'right' });
    }
    
    // IVA (21% in Argentina)
    const iva = parseFloat(saleData.total) * 0.21 / 1.21; // Extract IVA from total
    doc.text('IVA (21%):', 140, finalY + 20);
    doc.text(`$${iva.toFixed(2)}`, 175, finalY + 20, { align: 'right' });
    
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, finalY + 30);
    doc.text(`$${parseFloat(saleData.total).toFixed(2)}`, 175, finalY + 30, { align: 'right' });
    
    // Payment method
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const paymentMethod = this.getPaymentMethodName(saleData.payment_method);
    doc.text(`Forma de pago: ${paymentMethod}`, 20, finalY + 40);
    
    // Footer
    doc.setFontSize(8);
    doc.text('Este documento es válido como factura', 105, 280, { align: 'center' });
    
    return doc;
  }

  getPaymentMethodName(method) {
    const methods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'mercadopago': 'MercadoPago',
      'debit': 'Débito',
      'credit': 'Crédito'
    };
    return methods[method] || method || 'Efectivo';
  }

  // Download receipt as PDF
  downloadReceipt(saleData, filename = null) {
    const doc = this.generateReceipt(saleData);
    const defaultFilename = `recibo-${saleData.receipt_number || 'venta'}.pdf`;
    doc.save(filename || defaultFilename);
  }

  // Download invoice as PDF
  downloadInvoice(saleData, filename = null) {
    const doc = this.generateInvoice(saleData);
    const defaultFilename = `factura-${saleData.invoice_number || saleData.receipt_number || 'venta'}.pdf`;
    doc.save(filename || defaultFilename);
  }

  // Print receipt directly (opens print dialog)
  printReceipt(saleData) {
    const doc = this.generateReceipt(saleData);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  // Print invoice directly (opens print dialog)
  printInvoice(saleData) {
    const doc = this.generateInvoice(saleData);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  // Get receipt as base64 string (for sending via email, etc.)
  getReceiptBase64(saleData) {
    const doc = this.generateReceipt(saleData);
    return doc.output('datauristring');
  }

  // Get invoice as base64 string
  getInvoiceBase64(saleData) {
    const doc = this.generateInvoice(saleData);
    return doc.output('datauristring');
  }

  // Get receipt as blob (for uploading, etc.)
  getReceiptBlob(saleData) {
    const doc = this.generateReceipt(saleData);
    return doc.output('blob');
  }

  // Get invoice as blob
  getInvoiceBlob(saleData) {
    const doc = this.generateInvoice(saleData);
    return doc.output('blob');
  }
}

export default new ReceiptService();