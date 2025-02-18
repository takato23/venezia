document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadOrders();
    
    // Set up event listeners for filters
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', loadOrders);
    }
    
    if (priorityFilter) {
        priorityFilter.addEventListener('change', loadOrders);
    }
    
    // Add click handler for save button
    document.getElementById('saveOrder')?.addEventListener('click', saveOrder);
    
    // Load products when modal opens
    $('#orderModal').on('show.bs.modal', async function() {
        const productSelect = document.getElementById('product');
        if (!productSelect) return;
        
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const products = await response.json();
            
            // Clear existing options
            productSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
            
            // Add products grouped by category
            const productsByCategory = {};
            products.forEach(product => {
                const category = product.category || 'Sin Categoría';  
                if (!productsByCategory[category]) {
                    productsByCategory[category] = [];
                }
                productsByCategory[category].push(product);
            });
            
            // Create option groups for each category
            Object.keys(productsByCategory).sort().forEach(category => {
                const group = document.createElement('optgroup');
                group.label = category;
                
                productsByCategory[category].sort((a, b) => a.name.localeCompare(b.name)).forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = product.name;
                    group.appendChild(option);
                });
                
                productSelect.appendChild(group);
            });
            
            // Initialize Select2 for searchable dropdown
            $(productSelect).select2({
                theme: 'bootstrap4',
                width: '100%',
                placeholder: 'Buscar producto...',
                dropdownParent: $('#orderModal')
            });
            
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Error al cargar los productos');
        }
    });
    
    // Filter event handlers
    document.querySelectorAll('#statusDropdown + .dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.dataset.value;
            document.querySelector('#currentStatus').textContent = this.textContent;
            filterOrders();
        });
    });

    document.querySelectorAll('#priorityDropdown + .dropdown-menu .dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const value = this.dataset.value;
            document.querySelector('#currentPriority').textContent = this.textContent;
            filterOrders();
        });
    });

    // Add modal close handlers
    const modal = $('#orderModal');
    
    // Reset form when modal is closed
    modal.on('hidden.bs.modal', function() {
        const form = document.getElementById('orderForm');
        if (form) {
            form.reset();
            form.querySelector('#orderId').value = '';
        }
    });
});

async function loadOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    
    const status = statusFilter ? statusFilter.value : '';
    const priority = priorityFilter ? priorityFilter.value : '';
    
    try {
        let url = '/api/production_orders';
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        let orders = await response.json();
        
        // Apply filters
        if (status) {
            orders = orders.filter(order => order.current_status === status);
        }
        if (priority) {
            orders = orders.filter(order => order.priority === parseInt(priority));
        }
        
        // Clear container
        ordersContainer.innerHTML = '';
        
        // Add orders
        orders.forEach(order => {
            const orderElement = createOrderElement(order);
            ordersContainer.appendChild(orderElement);
        });
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function filterOrders() {
    const status = document.querySelector('#statusDropdown + .dropdown-menu .dropdown-item.active')?.dataset.value || '';
    const priority = document.querySelector('#priorityDropdown + .dropdown-menu .dropdown-item.active')?.dataset.value || '';
    
    document.querySelectorAll('.order-card').forEach(card => {
        const orderData = JSON.parse(card.dataset.orderData);
        const statusMatch = !status || orderData.current_status === status;
        const priorityMatch = !priority || orderData.priority.toString() === priority;
        
        card.style.display = statusMatch && priorityMatch ? '' : 'none';
    });
}

// Add active class handling
document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from siblings
        this.closest('.dropdown-menu').querySelectorAll('.dropdown-item').forEach(sibling => {
            sibling.classList.remove('active');
        });
        // Add active class to clicked item
        this.classList.add('active');
    });
});

async function updateOrderStatus(orderId, statusId) {
    try {
        console.log('Updating order status:', { orderId, statusId });  
        const response = await fetch(`/api/production_orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status_id: statusId })
        });

        if (!response.ok) {
            throw new Error('Failed to update order status');
        }

        // Don't reload orders automatically - let the caller decide
        return response.json();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error al actualizar el estado de la orden');
    }
}

// Save progress button handler
$(document).on('click', '.save-progress', async function() {
    const orderCard = $(this).closest('.order-card');
    const orderId = orderCard.data('orderId');  
    const progressInput = orderCard.find('.progress-amount');
    const progress = progressInput.val();

    if (!progress || isNaN(parseFloat(progress)) || parseFloat(progress) < 0) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }

    try {
        // First update the progress
        const result = await updateProgress(orderId, progress);
        console.log('Update result:', result);
        
        // Then update the status to 'proceso'
        const procesoStatusId = getStatusId('proceso');
        await updateOrderStatus(orderId, procesoStatusId);
        
        // Now reload the orders
        await loadOrders();
        
        // Hide input and clear value
        progressInput.val('');
        orderCard.find('.progress-input-container').hide();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el progreso: ' + error.message);
    }
});

// Also handle Enter key in the progress input
$(document).on('keypress', '.progress-amount', function(e) {
    if (e.which === 13) {  // Enter key
        e.preventDefault();
        $(this).closest('.order-card').find('.save-progress').click();
    }
});

async function saveOrder(event) {
    event.preventDefault();
    
    try {
        const form = document.getElementById('orderForm');
        if (!form) {
            throw new Error('Form not found');
        }
        
        const orderId = form.querySelector('#orderId')?.value;
        const product = form.querySelector('#product')?.value;
        const quantity = form.querySelector('#quantity')?.value;
        const unit = form.querySelector('#unit')?.value;
        const dueDate = form.querySelector('#dueDate')?.value;
        const priority = form.querySelector('#priority')?.value;
        const notes = form.querySelector('#notes')?.value || '';
        
        // Validate required fields
        if (!product || !quantity || !unit || !dueDate || !priority) {
            throw new Error('Por favor complete todos los campos requeridos');
        }
        
        const orderData = {
            product_id: parseInt(product),
            quantity: parseFloat(quantity),
            unit: unit,
            due_date: dueDate,
            priority: parseInt(priority),
            notes: notes
        };
        
        const response = await fetch(`/api/production_orders${orderId ? `/${orderId}` : ''}`, {
            method: orderId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar la orden');
        }
        
        // Close modal and refresh orders
        $('#orderModal').modal('hide');
        
        // Clear form
        form.reset();
        form.querySelector('#orderId').value = '';
        
        // Reload orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al guardar la orden');
    }
}

async function updateProgress(orderId, progress) {
    try {
        const data = { progress: parseFloat(progress) };
        console.log('Sending progress update:', data);  // Debug log
        
        const response = await fetch(`/api/production_orders/${orderId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);  // Debug log
            throw new Error(errorData.message || 'Error updating progress');
        }
        
        const result = await response.json();
        console.log('Progress update result:', result);  // Debug log
        return result;
    } catch (error) {
        console.error('Error in updateProgress:', error);
        throw error;
    }
}

// Save progress button handler
$(document).on('click', '.save-progress', async function() {
    const orderCard = $(this).closest('.order-card');
    const orderId = orderCard.data('orderId');
    const progressInput = orderCard.find('.progress-amount');
    const progress = progressInput.val();
    
    console.log('Progress input value:', progress);  // Debug log
    console.log('Order ID:', orderId);  // Debug log
    
    if (!progress || isNaN(parseFloat(progress)) || parseFloat(progress) < 0) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }
    
    try {
        // First update the progress
        const result = await updateProgress(orderId, progress);
        console.log('Update result:', result);  // Debug log
        
        // Then update the status to 'proceso'
        const procesoStatusId = getStatusId('proceso');
        await updateOrderStatus(orderId, procesoStatusId);
        
        // Now reload the orders
        await loadOrders();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el progreso: ' + error.message);
    }
});

// Handle Enter key in the progress input
$(document).on('keypress', '.progress-amount', function(e) {
    if (e.which === 13) {
        e.preventDefault();
        $(this).closest('.progress-input-container').find('.save-progress').click();
    }
});

async function deleteOrder(orderId) {
    try {
        const response = await fetch(`/api/production_orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error deleting order');
        }
        
        loadOrders();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la orden');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pedido': '📋 Pedido',
        'proceso': '⚙️ En Proceso',
        'terminado': '✅ Terminado'
    };
    return statusMap[status.toLowerCase()] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        1: 'Baja',
        2: 'Media',
        3: 'Alta'
    };
    return priorityMap[priority] || 'Normal';
}

function getPriorityClass(priority) {
    const priorityMap = {
        1: 'priority-low',
        2: 'priority-medium',
        3: 'priority-high'
    };
    return priorityMap[priority];
}

function getPriorityIndicatorClass(priority) {
    const priorityMap = {
        1: 'low',
        2: 'medium',
        3: 'high'
    };
    return priorityMap[priority];
}

$(document).on('click', '.edit-button', function() {
    const orderId = $(this).data('id');
    
    // Fetch order data
    fetch(`/api/production_orders/${orderId}`)
        .then(response => response.json())
        .then(data => {
            $('#editOrderId').val(orderId);
            $('#editProduct').val(data.product_id);
            $('#editQuantity').val(data.quantity);
            $('#editPriority').val(data.priority);
            $('#editNotes').val(data.notes);
            $('#editModal').modal('show');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar los datos de la orden');
        });
});

$('#saveEdit').on('click', async function() {
    if (!orderToEdit) return;
    
    try {
        const formData = {
            product_id: $('#editProduct').val(),
            quantity: parseFloat($('#editQuantity').val()),
            priority: $('#editPriority').val(),
            notes: $('#editNotes').val()
        };
        
        const response = await fetch(`/api/production_orders/${orderToEdit}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error updating order');
        }
        
        // Hide modal
        $('#editModal').modal('hide');
        
        // Clear orderToEdit
        orderToEdit = null;
        
        // Reload orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar la orden: ' + error.message);
    }
});

let orderToDelete = null;

$(document).on('click', '.delete-order', function() {
    orderToDelete = $(this).data('id');
    $('#deleteModal').modal('show');
});

$('#confirmDelete').on('click', async function() {
    if (!orderToDelete) return;
    
    try {
        const response = await fetch(`/api/production_orders/${orderToDelete}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error deleting order');
        }
        
        // Hide the modal
        $('#deleteModal').modal('hide');
        
        // Clear the orderToDelete
        orderToDelete = null;
        
        // Reload the orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la orden');
    }
});

// Clear orderToDelete when modal is closed
$('#deleteModal').on('hidden.bs.modal', function() {
    orderToDelete = null;
});

$(document).on('click', '.update-progress', function() {
    const orderCard = $(this).closest('.order-card');
    const orderData = JSON.parse(orderCard.data('orderData'));
    const orderId = orderData.id;
    const progressInput = $(this).closest('.progress-container').find('.progress-input');
    const newProgress = progressInput.val();
    
    if (!newProgress) {
        alert('Por favor ingrese un valor de progreso');
        return;
    }
    
    fetch(`/api/production_orders/${orderId}/progress`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: newProgress })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const progressText = orderCard.find('.progress-text');
            const quantity = progressText.data('quantity');
            const unit = progressText.data('unit');
            
            progressText.text(`${newProgress} de ${quantity} ${unit}`);
            
            // Update the stored order data with new progress
            orderData.progress = newProgress;
            if (data.order_status) {
                orderData.current_status = data.order_status;
                orderData.status = data.order_status;
            }
            orderCard.data('orderData', JSON.stringify(orderData));
            
            if (data.order_status === 'Terminado') {
                // Update status badge
                orderCard.find('.status-badge')
                    .removeClass('status-pedido status-proceso')
                    .addClass('status-terminado')
                    .text('Terminado');
                
                // Update all status buttons - first reset them
                const statusButtons = orderCard.find('.status-btn');
                statusButtons
                    .removeClass('btn-secondary btn-warning btn-success btn-outline-secondary btn-outline-warning btn-outline-success active')
                    .addClass('btn-outline-secondary')
                    .prop('disabled', false);
                
                // Set Terminado button style
                orderCard.find('.status-btn[data-status="terminado"]')
                    .removeClass('btn-outline-secondary btn-outline-success')
                    .addClass('btn-success active')
                    .prop('disabled', true);
                
                // Disable other buttons and keep them outline style
                orderCard.find('.status-btn[data-status!="terminado"]')
                    .prop('disabled', true);
            }
            
            // Clear the input
            progressInput.val('');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error updating progress:', error);
        alert('Error al actualizar el progreso');
    });
});

$(document).ready(function() {
    $('.select2').select2({
        theme: 'bootstrap4',
        width: '100%'
    });
});

// Edit order handling
let orderToEdit = null;

$(document).on('click', '.edit-order', async function() {
    const orderId = $(this).data('id');
    orderToEdit = orderId;
    
    try {
        // Fetch order data
        const response = await fetch(`/api/production_orders/${orderId}`);
        if (!response.ok) {
            throw new Error('Error fetching order details');
        }
        
        const order = await response.json();
        
        // Populate form fields
        $('#editOrderId').val(order.id);
        $('#editProduct').val(order.product_id).trigger('change');
        $('#editQuantity').val(order.quantity);
        $('#editPriority').val(order.priority);
        $('#editNotes').val(order.notes);
        
        // Show modal
        $('#editModal').modal('show');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la orden');
    }
});

$('#saveEdit').on('click', async function() {
    if (!orderToEdit) return;
    
    try {
        const formData = {
            product_id: $('#editProduct').val(),
            quantity: parseFloat($('#editQuantity').val()),
            priority: $('#editPriority').val(),
            notes: $('#editNotes').val()
        };
        
        const response = await fetch(`/api/production_orders/${orderToEdit}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error updating order');
        }
        
        // Hide modal
        $('#editModal').modal('hide');
        
        // Clear orderToEdit
        orderToEdit = null;
        
        // Reload orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar la orden: ' + error.message);
    }
});

// Clear orderToEdit when modal is closed
$('#editModal').on('hidden.bs.modal', function() {
    orderToEdit = null;
});

// Initialize Select2 for product selection
$(document).ready(function() {
    $('#editProduct').select2({
        theme: 'bootstrap4',
        placeholder: 'Seleccionar producto',
        width: '100%'
    });
    
    // Load products for select
    fetch('/api/products/')
        .then(response => response.json())
        .then(products => {
            const select = $('#editProduct');
            select.empty();
            
            products.forEach(product => {
                select.append(new Option(product.name, product.id));
            });
        })
        .catch(error => {
            console.error('Error loading products:', error);
        });
});

function createOrderElement(order) {
    const template = document.getElementById('orderTemplate');
    const clone = template.content.cloneNode(true);
    
    const orderCard = clone.querySelector('.order-card');
    
    // Store the order data and ID
    orderCard.dataset.orderData = JSON.stringify(order);
    orderCard.dataset.orderId = order.id;
    
    // Set status class - convert spaces to hyphens and make lowercase
    const statusClass = `status-${(order.current_status || 'pendiente').toLowerCase().replace(/\s+/g, '-')}`;
    orderCard.classList.add(statusClass);
    
    // Set card content
    clone.querySelector('.card-title').textContent = order.order_number;
    clone.querySelector('.product-name').textContent = order.product_name;
    clone.querySelector('.quantity').textContent = `${order.quantity} ${order.unit}`;
    clone.querySelector('.due-date').textContent = formatDate(order.due_date);
    clone.querySelector('.notes').textContent = order.notes || 'Sin notas';
    
    // Update progress bar
    const progressBar = clone.querySelector('.progress-bar');
    const progressText = clone.querySelector('.progress-text');
    if (progressBar && progressText) {
        const progress = parseFloat(order.progress || 0);
        const quantity = parseFloat(order.quantity);
        const percentage = Math.min((progress / quantity) * 100, 100);
        
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${progress}/${quantity} ${order.unit}`;
        
        // Update button states based on progress
        const procesoBtn = clone.querySelector('.status-btn[data-status="proceso"]');
        const terminadoBtn = clone.querySelector('.status-btn[data-status="terminado"]');
        
        if (progress >= quantity) {
            // Order is complete - show Terminado button as active
            if (terminadoBtn) {
                terminadoBtn.classList.remove('btn-outline-success');
                terminadoBtn.classList.add('btn-success');
            }
            if (procesoBtn) {
                procesoBtn.classList.remove('btn-warning');
                procesoBtn.classList.add('btn-outline-warning');
            }
        } else if (progress > 0) {
            // Order is in progress - show Proceso button as active
            if (procesoBtn) {
                procesoBtn.classList.remove('btn-outline-warning');
                procesoBtn.classList.add('btn-warning');
            }
            if (terminadoBtn) {
                terminadoBtn.classList.remove('btn-success');
                terminadoBtn.classList.add('btn-outline-success');
            }
        }
    }
    
    // Set up buttons
    const editBtn = clone.querySelector('.edit-order');
    const deleteBtn = clone.querySelector('.delete-order');
    
    if (editBtn) {
        editBtn.dataset.id = order.id;
        editBtn.addEventListener('click', () => {
            // Handle edit click
        });
    }
    
    if (deleteBtn) {
        deleteBtn.dataset.id = order.id;
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
                deleteOrder(order.id);
            }
        });
    }
    
    // Set up status buttons
    const statusButtons = clone.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
        const status = button.dataset.status;
        
        // Add active class if this is the current status
        if (order.current_status && order.current_status.toLowerCase() === status) {
            button.classList.remove('btn-outline-secondary', 'btn-outline-warning', 'btn-outline-success');
            switch (status) {
                case 'pedido':
                    button.classList.add('btn-secondary');
                    break;
                case 'proceso':
                    button.classList.add('btn-warning');
                    break;
                case 'terminado':
                    button.classList.add('btn-success');
                    // Also update progress bar to full and green when status is Terminado
                    if (progressBar) {
                        progressBar.style.width = '100%';
                        progressBar.style.backgroundColor = '#34d399';
                    }
                    break;
            }
        }
        
        // Add click handler
        button.addEventListener('click', () => {
            const statusId = getStatusId(status);
            updateOrderStatus(order.id, statusId);
        });
    });
    
    return orderCard;
}

function getStatusId(status) {
    switch (status.toLowerCase()) {
        case 'pedido':
            return 1;
        case 'proceso':
        case 'en-proceso':  
            return 2;
        case 'terminado':
            return 3;
        case 'cancelado':
            return 4;
        default:
            throw new Error('Invalid status: ' + status);
    }
}

// Status button click handler
$(document).on('click', '.status-btn', async function() {
    const orderCard = $(this).closest('.order-card');
    const status = $(this).data('status');
    const orderId = orderCard.data('orderId');
    const progressContainer = orderCard.find('.progress-input-container');
    
    // Update button styles first
    const allStatusButtons = orderCard.find('.status-btn');
    allStatusButtons.removeClass('btn-secondary btn-warning btn-success').addClass('btn-outline-secondary btn-outline-warning btn-outline-success');
    
    switch (status) {
        case 'pedido':
            $(this).removeClass('btn-outline-secondary').addClass('btn-secondary');
            progressContainer.hide();
            // Update status immediately only for 'pedido'
            const pedidoStatusId = getStatusId(status);
            await updateOrderStatus(orderId, pedidoStatusId);
            await loadOrders();
            break;
        case 'proceso':
            $(this).removeClass('btn-outline-warning').addClass('btn-warning');
            progressContainer.show();
            progressContainer.find('.progress-amount').focus();
            // Don't update status yet - wait for progress input
            break;
        case 'terminado':
            $(this).removeClass('btn-outline-success').addClass('btn-success');
            progressContainer.hide();
            // Update status immediately only for 'terminado'
            const terminadoStatusId = getStatusId(status);
            await updateOrderStatus(orderId, terminadoStatusId);
            await loadOrders();
            break;
    }
});

// Save progress button handler
$(document).on('click', '.save-progress', async function() {
    const orderCard = $(this).closest('.order-card');
    const orderId = orderCard.data('orderId');
    const progressInput = orderCard.find('.progress-amount');
    const progress = parseFloat(progressInput.val());
    
    if (isNaN(progress) || progress < 0) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }
    
    try {
        // First update the progress
        await updateProgress(orderId, progress);
        
        // Then update the status to 'proceso'
        const procesoStatusId = getStatusId('proceso');
        await updateOrderStatus(orderId, procesoStatusId);
        
        // Now reload the orders
        await loadOrders();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el progreso: ' + error.message);
    }
});

// Handle Enter key in progress input
$(document).on('keypress', '.progress-amount', function(e) {
    if (e.which === 13) {
        e.preventDefault();
        $(this).closest('.progress-input-container').find('.save-progress').click();
    }
});

// Handle clicking outside progress input to hide it
$(document).on('click', function(e) {
    if (!$(e.target).closest('.progress-input-container, .status-btn[data-status="proceso"]').length) {
        $('.progress-input-container').hide();
    }
});
