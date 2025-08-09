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
            orders = orders.filter(order => order.status === status);
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
        const statusMatch = !status || orderData.status === status;
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

function createOrderElement(order) {
    const template = document.getElementById('orderTemplate');
    if (!template) return null;

    const clone = template.content.cloneNode(true);
    const orderCard = clone.querySelector('.order-card');
    
    // Store the order data for editing
    orderCard.dataset.orderData = JSON.stringify(order);
    orderCard.dataset.orderId = order.id;
    
    // Set status class
    orderCard.classList.add(`status-${order.status.toLowerCase()}`);
    
    // Set priority class
    const priorityClass = getPriorityClass(order.priority);
    if (priorityClass) {
        orderCard.classList.add(priorityClass);
    }
    
    // Set order details
    clone.querySelector('.card-title').textContent = order.order_number;
    clone.querySelector('.product-name').textContent = order.product_name;
    clone.querySelector('.quantity').textContent = `${order.quantity} ${order.unit}`;
    clone.querySelector('.due-date').textContent = formatDate(order.due_date);
    clone.querySelector('.notes').textContent = order.notes || 'Sin notas';
    
    // Set up edit and delete buttons
    const editBtn = clone.querySelector('.edit-order');
    const deleteBtn = clone.querySelector('.delete-order');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // Load order data into modal
            document.getElementById('orderId').value = order.id;
            document.getElementById('product').value = order.product_id;
            document.getElementById('quantity').value = order.quantity;
            document.getElementById('unit').value = order.unit;
            document.getElementById('priority').value = order.priority;
            document.getElementById('dueDate').value = order.due_date.split('T')[0];
            document.getElementById('notes').value = order.notes || '';
            
            // Show modal
            $('#orderModal').modal('show');
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
                deleteOrder(order.id);
            }
        });
    }
    
    // Set up status buttons
    const statusButtons = clone.querySelectorAll('.btn-status');
    statusButtons.forEach(button => {
        const status = button.dataset.status;
        if (order.status.toLowerCase() === status) {
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
                    break;
            }
        }
        
        button.addEventListener('click', () => {
            updateOrderStatus(order.id, status);
        });
    });
    
    // Set up progress tracking
    const progressContainer = clone.querySelector('.progress-container');
    if (progressContainer) {
        // Only show progress container for orders in process
        if (order.status.toLowerCase() === 'proceso') {
            progressContainer.style.display = 'block';
        }
        
        const progressInput = progressContainer.querySelector('.progress-input');
        const progressText = progressContainer.querySelector('.progress-text');
        
        if (progressInput && progressText) {
            progressInput.value = order.progress || 0;
            progressText.textContent = `${order.progress || 0} de ${order.quantity} ${order.unit}`;
            
            const updateBtn = progressContainer.querySelector('.update-progress');
            if (updateBtn) {
                updateBtn.addEventListener('click', () => {
                    const newProgress = parseFloat(progressInput.value);
                    if (!isNaN(newProgress) && newProgress >= 0 && newProgress <= order.quantity) {
                        updateProgress(order.id, newProgress);
                    } else {
                        alert('Por favor ingrese un valor válido entre 0 y ' + order.quantity);
                    }
                });
            }
        }
    }
    
    return orderCard;
}

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

async function updateOrderStatus(orderId, status) {
    let statusId;
    switch (status) {
        case 'pedido':
            statusId = 1;
            break;
        case 'proceso':
            statusId = 2;
            break;
        case 'terminado':
            statusId = 3;
            break;
        case 'cancelado':
            statusId = 4;
            break;
        default:
            console.error('Invalid status:', status);
            return;
    }

    try {
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

        // Reload orders to reflect the change
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error al actualizar el estado de la orden');
    }
}

async function updateProgress(orderId, progress) {
    try {
        const response = await fetch(`/api/production_orders/${orderId}/progress/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ progress: parseFloat(progress) })
        });
        
        if (!response.ok) {
            throw new Error('Error updating progress');
        }
        
        loadOrders();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el progreso');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/production_orders/${orderId}/`, {
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
