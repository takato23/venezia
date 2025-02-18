// Initialize date range picker
$(function() {
    $('#sales-daterange').daterangepicker({
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        ranges: {
           'Hoy': [moment(), moment()],
           'Ayer': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Últimos 7 días': [moment().subtract(6, 'days'), moment()],
           'Últimos 30 días': [moment().subtract(29, 'days'), moment()],
           'Este Mes': [moment().startOf('month'), moment().endOf('month')],
           'Mes Anterior': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        locale: {
            format: 'DD/MM/YYYY',
            applyLabel: 'Aplicar',
            cancelLabel: 'Cancelar',
            customRangeLabel: 'Rango Personalizado'
        }
    }, updateSalesData);
    
    // Initial update
    updateSalesData();
});

// Stock Report Functions
function updateStockTable() {
    const storeId = $('#store-filter').val();
    const flavor = $('#flavor-filter').val();
    const status = $('#status-filter').val();
    
    let url = '/api/stock_data?';
    if (storeId) url += `store_id=${storeId}&`;
    if (flavor) url += `flavor=${encodeURIComponent(flavor)}&`;
    
    $.get(url)
        .done(function(data) {
            if (status === 'low') {
                data = data.filter(item => item.status === 'Bajo stock');
            } else if (status === 'ok') {
                data = data.filter(item => item.status === 'OK');
            }
            
            const tbody = $('#stock-table tbody');
            tbody.empty();
            
            data.forEach(item => {
                tbody.append(`
                    <tr>
                        <td>${item.store}</td>
                        <td>${item.flavor}</td>
                        <td>${item.quantity} kg</td>
                        <td>${item.minimum} kg</td>
                        <td>
                            <span class="badge bg-${item.status === 'Bajo stock' ? 'danger' : 'success'}">
                                ${item.status}
                            </span>
                        </td>
                    </tr>
                `);
            });
        })
        .fail(function(error) {
            console.error('Error updating stock table:', error);
        });
}

// Sales Report Functions
function updateSalesData() {
    const dateRange = $('#sales-daterange').val().split(' - ');
    const startDate = moment(dateRange[0], 'DD/MM/YYYY').format('YYYY-MM-DD');
    const endDate = moment(dateRange[1], 'DD/MM/YYYY').format('YYYY-MM-DD');
    const storeId = $('#sales-store-filter').val();
    const paymentMethod = $('#payment-method-filter').val();
    const paymentStatus = $('#payment-status-filter').val();

    // Build query string
    const params = new URLSearchParams();
    params.append('start_date', startDate);
    params.append('end_date', endDate);
    if (storeId) params.append('store_id', storeId);
    if (paymentMethod) params.append('payment_method', paymentMethod);
    if (paymentStatus) params.append('payment_status', paymentStatus);

    $.get(`/api/sales_data?${params.toString()}`)
        .done(function(data) {
            if (data.error) {
                console.error('Error in sales data:', data.error);
                return;
            }
            
            // Update summary cards
            $('#total-sales').text(data.summary.total_sales);
            $('#total-amount').text(`$${data.summary.total_amount.toFixed(2)}`);
            $('#average-sale').text(`$${data.summary.average_sale.toFixed(2)}`);
            $('#delivery-sales').text(data.summary.delivery_count);

            // Update charts
            updateSalesCharts(data.charts);

            // Update table
            const tbody = $('#sales-table tbody');
            tbody.empty();
            
            data.sales.forEach(sale => {
                tbody.append(`
                    <tr>
                        <td>${sale.id}</td>
                        <td>${moment(sale.date).format('DD/MM/YYYY HH:mm')}</td>
                        <td>${sale.store}</td>
                        <td>${sale.customer || 'N/A'}</td>
                        <td>${getPaymentMethodBadge(sale.payment_method)}</td>
                        <td>${getStatusBadge(sale.status)}</td>
                        <td>$${sale.total.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="showSaleDetails(${sale.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `);
            });
        })
        .fail(function(error) {
            console.error('Error updating sales data:', error);
        });
}

// Stock Analytics Functions
function updateStockAnalytics() {
    console.log('Updating stock analytics');
    const storeId = $('#stock-analytics-store').val();
    const productId = $('#stock-analytics-product').val();
    const days = $('#stock-analytics-period').val();

    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);
    if (productId) params.append('product_id', productId);
    params.append('days', days);

    $.get(`/get_stock_analytics_data?${params.toString()}`)
        .done(function(data) {
            console.log('Received stock analytics data:', data);
            
            // Format data for stock trends chart
            const trendsData = {
                labels: data.daily_changes.map(d => d.date),
                values: data.daily_changes.map(d => d.change)
            };
            updateStockTrendsChart(trendsData);
            
            // Update predictions table
            updateStockPredictionsTable(data.stock_predictions);
            
            // Format data for depletion rates chart
            const depletionData = {
                labels: data.depletion_rates.map(d => d.product),
                values: data.depletion_rates.map(d => d.abs_change)
            };
            updateDepletionRatesChart(depletionData);
        })
        .fail(function(error) {
            console.error('Error updating stock analytics:', error);
            alert('Error al cargar los datos. Por favor, intente nuevamente.');
        });
}

function updateStockTrendsChart(data) {
    console.log('Updating stock trends chart with data:', data);
    
    // Destroy existing chart if it exists
    if (window.stockTrendsChart) {
        window.stockTrendsChart.destroy();
    }
    
    const ctx = document.getElementById('stockTrendsChart');
    if (!ctx) {
        console.error('stockTrendsChart canvas element not found');
        return;
    }
    
    try {
        window.stockTrendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Cambios de Stock',
                    data: data.values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad (kg)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Tendencias de Stock'
                    }
                }
            }
        });
        console.log('Stock trends chart created successfully');
    } catch (error) {
        console.error('Error creating stock trends chart:', error);
    }
}

function updateStockPredictionsTable(data) {
    console.log('Updating stock predictions table with data:', data);
    
    const tbody = $('#stock-predictions-table tbody');
    tbody.empty();
    
    try {
        data.forEach(prediction => {
            tbody.append(`
                <tr>
                    <td>${prediction.store_name}</td>
                    <td>${prediction.product}</td>
                    <td>${prediction.current_quantity.toFixed(2)} kg</td>
                    <td>${prediction.days_until_empty.toFixed(1)} días</td>
                    <td>${prediction.predicted_date}</td>
                </tr>
            `);
        });
        console.log('Stock predictions table updated successfully');
    } catch (error) {
        console.error('Error updating stock predictions table:', error);
    }
}

function updateDepletionRatesChart(data) {
    console.log('Updating depletion rates chart with data:', data);
    
    // Destroy existing chart if it exists
    if (window.depletionRatesChart) {
        window.depletionRatesChart.destroy();
    }
    
    const ctx = document.getElementById('depletionRatesChart');
    if (!ctx) {
        console.error('depletionRatesChart canvas element not found');
        return;
    }
    
    try {
        window.depletionRatesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tasa de Agotamiento',
                    data: data.values,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tasa (kg/día)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Producto'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Tasas de Agotamiento por Producto'
                    }
                }
            }
        });
        console.log('Depletion rates chart created successfully');
    } catch (error) {
        console.error('Error creating depletion rates chart:', error);
    }
}

// Production Analytics Functions
function updateProductionAnalytics() {
    const days = $('#production-period').val();

    $.get(`/api/production_analytics?days=${days}`)
        .done(function(data) {
            updateTopFlavorsChart(data.top_flavors);
            updateProductionTrendChart(data.production_trend);
            updateSeasonalChart(data.seasonal);
            updatePopularCombinations(data.combinations);
        })
        .fail(function(error) {
            console.error('Error updating production analytics:', error);
        });
}

// Chart Update Functions
function updateSalesCharts(chartData) {
    // Clear existing charts
    if (window.salesByDayChart) window.salesByDayChart.destroy();
    if (window.paymentMethodsChart) window.paymentMethodsChart.destroy();

    // Prepare data for Sales by Day Chart
    const salesByDayData = {
        labels: Object.keys(chartData.sales_by_day),
        datasets: [{
            label: 'Ventas',
            data: Object.values(chartData.sales_by_day).map(day => day.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    // Create Sales by Day Chart
    window.salesByDayChart = new Chart($('#salesByDayChart'), {
        type: 'line',
        data: salesByDayData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Prepare data for Payment Methods Chart
    const paymentMethodsData = {
        labels: Object.keys(chartData.payment_methods),
        datasets: [{
            data: Object.values(chartData.payment_methods).map(method => method.count),
            backgroundColor: [
                'rgb(54, 162, 235)',  // cash
                'rgb(75, 192, 192)',  // card
                'rgb(255, 205, 86)',  // transfer
                'rgb(153, 102, 255)'  // mercadopago
            ]
        }]
    };

    // Create Payment Methods Chart
    window.paymentMethodsChart = new Chart($('#paymentMethodsChart'), {
        type: 'doughnut',
        data: paymentMethodsData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTopFlavorsChart(data) {
    new Chart($('#topFlavorsChart'), {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateProductionTrendChart(data) {
    new Chart($('#productionTrendChart'), {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Producción',
                data: data.values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateSeasonalChart(data) {
    new Chart($('#seasonalChart'), {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: data.datasets
        },
        options: {
            responsive: true
        }
    });
}

function updatePopularCombinations(data) {
    const tbody = $('#combinations-table tbody');
    tbody.empty();
    
    data.forEach(combo => {
        tbody.append(`
            <tr>
                <td>${combo.combination}</td>
                <td>${combo.count}</td>
            </tr>
        `);
    });
}

// Stock Analytics Tab Filtering
document.getElementById('apply-stock-analytics').addEventListener('click', function() {
    const storeId = document.getElementById('stock-analytics-store').value;
    const productId = document.getElementById('stock-analytics-product').value;
    const days = document.getElementById('stock-analytics-period').value;
    
    console.log('Fetching stock analytics with params:', { storeId, productId, days });
    
    // Build query string
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);
    if (productId) params.append('product_id', productId);
    if (days) params.append('days', days);
    
    // Update URL without page reload
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Reload the charts with new data
    fetch(`/get_stock_analytics_data?${params.toString()}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            // Update charts with new data
            updateStockAnalyticsCharts(data);
        })
        .catch(error => {
            console.error('Error fetching stock analytics data:', error);
            alert('Error al cargar los datos. Por favor, intente nuevamente.');
        });
});

function updateStockAnalyticsCharts(data) {
    console.log('Updating charts with data:', data);
    
    try {
        // Update daily changes chart
        if (window.stockTrendsChart) {
            console.log('Updating stock trends chart with:', data.daily_changes);
            window.stockTrendsChart.data = {
                labels: data.daily_changes.map(d => d.date),
                datasets: [{
                    label: 'Cambios Diarios',
                    data: data.daily_changes.map(d => d.change),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            };
            window.stockTrendsChart.update();
        } else {
            console.warn('stockTrendsChart not initialized');
        }
        
        // Update depletion rates chart
        if (window.depletionRatesChart) {
            console.log('Updating depletion rates chart with:', data.depletion_rates);
            window.depletionRatesChart.data = {
                labels: data.depletion_rates.map(d => `${d.store_name} - ${d.product}`),
                datasets: [{
                    label: 'Tasa de Agotamiento',
                    data: data.depletion_rates.map(d => d.abs_change),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }]
            };
            window.depletionRatesChart.update();
        } else {
            console.warn('depletionRatesChart not initialized');
        }
        
        // Update predictions table
        const tbody = document.querySelector('#stock-predictions-table tbody');
        if (tbody) {
            console.log('Updating predictions table with:', data.stock_predictions);
            tbody.innerHTML = data.stock_predictions.map(pred => `
                <tr>
                    <td>${pred.store_name}</td>
                    <td>${pred.product}</td>
                    <td>${pred.current_quantity.toFixed(2)}</td>
                    <td>${pred.days_until_empty.toFixed(1)}</td>
                    <td>${pred.predicted_date}</td>
                </tr>
            `).join('');
        } else {
            console.warn('Predictions table tbody not found');
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Initialize Stock Analytics Charts
function initializeStockAnalyticsCharts() {
    console.log('Initializing stock analytics charts');
    
    // Initialize Stock Trends Chart
    const stockTrendsCtx = document.getElementById('stockTrendsChart');
    if (stockTrendsCtx) {
        console.log('Found stockTrendsChart element');
        try {
            window.stockTrendsChart = new Chart(stockTrendsCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Cambios Diarios',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            console.log('Successfully created stockTrendsChart');
        } catch (error) {
            console.error('Error creating stockTrendsChart:', error);
        }
    } else {
        console.error('stockTrendsChart canvas element not found');
    }

    // Initialize Depletion Rates Chart
    const depletionRatesCtx = document.getElementById('depletionRatesChart');
    if (depletionRatesCtx) {
        console.log('Found depletionRatesChart element');
        try {
            window.depletionRatesChart = new Chart(depletionRatesCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Tasa de Agotamiento',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            console.log('Successfully created depletionRatesChart');
        } catch (error) {
            console.error('Error creating depletionRatesChart:', error);
        }
    } else {
        console.error('depletionRatesChart canvas element not found');
    }
}

// Event Listeners
$(document).ready(function() {
    console.log('Document ready');
    
    // Initialize charts when analytics tab is shown
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        console.log('Tab shown:', e.target.id);
        if (e.target.id === 'stock-analytics-tab') {
            console.log('Stock analytics tab shown');
            if (!window.stockTrendsChart || !window.depletionRatesChart) {
                initializeStockAnalyticsCharts();
            }
            // Load initial data
            document.getElementById('apply-stock-analytics').click();
        }
    });
    
    // Stock report listeners
    $('#store-filter, #flavor-filter, #status-filter').on('change', updateStockTable);
    $('#export-stock-excel').on('click', () => exportToExcel('stock-table', 'reporte_stock'));
    
    // Sales report listeners
    $('#sales-store-filter, #payment-method-filter, #payment-status-filter').on('change', updateSalesData);
    $('#export-sales-excel').on('click', () => exportToExcel('sales-table', 'reporte_ventas'));
    
    // Stock analytics listeners
    $('#stock-analytics-store, #stock-analytics-product, #stock-analytics-period').on('change', updateStockAnalytics);
    
    // Production analytics listeners
    $('#production-period').on('change', updateProductionAnalytics);
    
    // Initialize charts if we're starting on the analytics tab
    if (window.location.hash === '#stock-analytics') {
        console.log('Starting on stock analytics tab');
        initializeStockAnalyticsCharts();
        document.getElementById('apply-stock-analytics').click();
    }
    
    // Initial load
    if ($('#stock-table').length) updateStockTable();
    if ($('#sales-table').length) updateSalesData();
    if ($('#stockTrendsChart').length) updateStockAnalytics();
    if ($('#topFlavorsChart').length) updateProductionAnalytics();
});

// Utility Functions
function getPaymentMethodBadge(method) {
    const badges = {
        'cash': '<span class="badge bg-success">Efectivo</span>',
        'card': '<span class="badge bg-info">Tarjeta</span>',
        'transfer': '<span class="badge bg-primary">Transferencia</span>'
    };
    return badges[method] || `<span class="badge bg-secondary">${method}</span>`;
}

function getStatusBadge(status) {
    const badges = {
        'paid': '<span class="badge bg-success">Pagado</span>',
        'pending': '<span class="badge bg-warning">Pendiente</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function showSaleDetails(saleId) {
    $.get(`/api/get_sale_details/${saleId}`)
        .done(function(data) {
            const modal = $('#saleDetailsModal');
            modal.find('.modal-title').text(`Detalles de Venta #${saleId}`);
            
            let itemsHtml = '';
            data.items.forEach(item => {
                itemsHtml += `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.unit_price.toFixed(2)}</td>
                        <td>$${item.total_price.toFixed(2)}</td>
                        <td>${item.flavors ? item.flavors.join(', ') : '-'}</td>
                    </tr>
                `;
            });
            
            modal.find('.modal-body').html(`
                <div class="mb-3">
                    <strong>Cliente:</strong> ${data.customer || 'N/A'}<br>
                    <strong>Fecha:</strong> ${moment(data.date).format('DD/MM/YYYY HH:mm')}<br>
                    <strong>Tienda:</strong> ${data.store}<br>
                    <strong>Método de Pago:</strong> ${getPaymentMethodBadge(data.payment_method)}<br>
                    <strong>Estado:</strong> ${getStatusBadge(data.status)}
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Total</th>
                            <th>Sabores</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3" class="text-end">Total:</th>
                            <th>$${data.total.toFixed(2)}</th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            `);
            
            modal.modal('show');
        })
        .fail(function(error) {
            console.error('Error loading sale details:', error);
        });
}

// Export Functions
function exportToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `${filename}.xlsx`);
}
