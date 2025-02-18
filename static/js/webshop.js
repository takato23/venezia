// Webshop Frontend JavaScript
let availableFlavors = [];
let selectedFlavors = [];
let currentProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the webshop
    loadCart();
    loadFlavors();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add to cart button click handler
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            const productId = this.dataset.productId;
            const maxFlavors = parseInt(this.dataset.maxFlavors);
            const productName = this.dataset.productName;

            if (maxFlavors) {
                // This is a pote, show flavor selection modal
                showFlavorSelectionModal(productId, maxFlavors, productName);
            } else {
                // Regular product, add directly to cart
                addToCart(productId);
            }
        });
    });

    // Add to cart with flavors button click handler
    document.getElementById('addToCartWithFlavors').addEventListener('click', function() {
        if (currentProductId && selectedFlavors.length > 0) {
            addToCartWithFlavors(currentProductId, selectedFlavors);
            $('#flavorSelectionModal').modal('hide');
        }
    });
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchProducts');
    const searchButton = document.getElementById('searchButton');
    
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchProducts(this.value);
        }
    });
    
    searchButton.addEventListener('click', function() {
        searchProducts(searchInput.value);
    });
    
    // Cart buttons
    document.getElementById('clearCartButton').addEventListener('click', clearCart);
    document.getElementById('checkoutButton').addEventListener('click', startCheckout);
}

function loadFlavors() {
    fetch('/webshop/api/flavors')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                availableFlavors = data.flavors;
            }
        })
        .catch(error => {
            console.error('Error loading flavors:', error);
            showError('Error al cargar sabores');
        });
}

function showFlavorSelector(product) {
    // Create modal for flavor selection
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'flavorSelectorModal';
    modal.setAttribute('tabindex', '-1');
    
    const modalContent = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Seleccionar Sabores - ${product.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Seleccione entre ${product.max_flavors} sabores:</p>
                    <div class="row" id="flavorsList">
                        ${availableFlavors.map(flavor => `
                            <div class="col-md-4 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input flavor-checkbox" type="checkbox" 
                                           value="${flavor.id}" id="flavor${flavor.id}"
                                           onchange="updateFlavorSelection(${product.max_flavors})">
                                    <label class="form-check-label" for="flavor${flavor.id}">
                                        ${flavor.name}
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="addPoteToCart(${product.id})">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Show the modal
    $(modal).modal('show');
    
    // Clean up when the modal is hidden
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}

function updateFlavorSelection(maxFlavors) {
    const checkboxes = document.querySelectorAll('.flavor-checkbox:checked');
    if (checkboxes.length > maxFlavors) {
        event.target.checked = false;
        showError(`Máximo ${maxFlavors} sabores permitidos`);
    }
}

function addPoteToCart(productId) {
    const selectedFlavors = Array.from(document.querySelectorAll('.flavor-checkbox:checked'))
        .map(checkbox => parseInt(checkbox.value));
    
    if (selectedFlavors.length === 0) {
        showError('Por favor seleccione al menos un sabor');
        return;
    }
    
    fetch('/webshop/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1,
            flavors: selectedFlavors
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const modal = $(document.getElementById('flavorSelectorModal'));
            modal.modal('hide');
            loadCart();
            showSuccess('Producto agregado al carrito');
        } else {
            showError(data.message || 'Error al agregar al carrito');
        }
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        showError('Error al agregar al carrito');
    });
}

async function showFlavorSelectionModal(productId, maxFlavors, productName) {
    currentProductId = productId;
    selectedFlavors = [];
    
    // Update modal text
    document.getElementById('selectedProductName').textContent = productName;
    document.getElementById('maxFlavors').textContent = maxFlavors;
    
    // Clear previous selections
    document.getElementById('flavorsList').innerHTML = '';
    document.getElementById('selectedFlavorsList').innerHTML = '';
    document.getElementById('addToCartWithFlavors').disabled = true;
    document.getElementById('flavorSelectionAlert').style.display = 'none';
    
    try {
        // Fetch available flavors
        const response = await fetch('/webshop/api/flavors');
        const flavors = await response.json();
        
        // Create flavor selection UI
        const flavorsListDiv = document.getElementById('flavorsList');
        flavors.forEach(flavor => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input class="form-check-input flavor-checkbox" type="checkbox" 
                       value="${flavor.id}" id="flavor${flavor.id}">
                <label class="form-check-label" for="flavor${flavor.id}">
                    ${flavor.name}
                </label>
            `;
            flavorsListDiv.appendChild(div);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.flavor-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Hide any previous error message
                document.getElementById('flavorSelectionAlert').style.display = 'none';
                
                if (this.checked) {
                    if (selectedFlavors.length >= maxFlavors) {
                        this.checked = false;
                        const alertDiv = document.getElementById('flavorSelectionAlert');
                        alertDiv.textContent = `No puede seleccionar más de ${maxFlavors} sabores`;
                        alertDiv.style.display = 'block';
                        return;
                    }
                    const flavorId = this.value;
                    const flavorName = this.nextElementSibling.textContent.trim();
                    selectedFlavors.push({
                        id: flavorId,
                        name: flavorName
                    });
                } else {
                    const flavorId = this.value;
                    selectedFlavors = selectedFlavors.filter(f => f.id !== flavorId);
                }
                
                // Update selected flavors list
                updateSelectedFlavorsList();
                
                // Enable/disable add to cart button
                document.getElementById('addToCartWithFlavors').disabled = 
                    selectedFlavors.length === 0 || selectedFlavors.length > maxFlavors;
            });
        });
        
        $('#flavorSelectionModal').modal('show');
    } catch (error) {
        console.error('Error fetching flavors:', error);
        const alertDiv = document.getElementById('flavorSelectionAlert');
        alertDiv.textContent = 'Error al cargar los sabores';
        alertDiv.style.display = 'block';
    }
}

function updateSelectedFlavorsList() {
    const list = document.getElementById('selectedFlavorsList');
    list.innerHTML = selectedFlavors.map(flavor => `
        <li>
            ${flavor.name}
            <button type="button" class="btn btn-sm btn-link text-danger" 
                    onclick="removeFlavor('${flavor.id}')">
                <i class="fas fa-times"></i>
            </button>
        </li>
    `).join('');
}

function removeFlavor(flavorId) {
    selectedFlavors = selectedFlavors.filter(f => f.id !== flavorId);
    document.querySelector(`#flavor${flavorId}`).checked = false;
    updateSelectedFlavorsList();
    document.getElementById('addToCartWithFlavors').disabled = selectedFlavors.length === 0;
}

async function addToCartWithFlavors(productId, flavors) {
    try {
        const response = await fetch('/webshop/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1,
                flavors: flavors.map(f => f.id)
            })
        });
        
        if (response.ok) {
            showToast('Producto agregado al carrito', 'success');
            updateCartCount();
            loadCart(); // Reload the cart display
        } else {
            const data = await response.json();
            showToast(data.message || 'Error al agregar al carrito', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Error al agregar al carrito', 'error');
    }
}

function loadCart() {
    fetch('/webshop/api/cart')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateCartDisplay(data.cart, data.total);
            }
        })
        .catch(error => {
            console.error('Error loading cart:', error);
            showError('Error al cargar el carrito');
        });
}

function updateCartDisplay(cart, total) {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const clearCartButton = document.getElementById('clearCartButton');
    const checkoutButton = document.getElementById('checkoutButton');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-muted">El carrito está vacío</p>';
        clearCartButton.disabled = true;
        checkoutButton.disabled = true;
        return;
    }
    
    let html = '<ul class="list-group list-group-flush">';
    cart.forEach((item, index) => {
        html += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">$${item.price.toLocaleString()}</small>
                </div>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    
    cartItems.innerHTML = html;
    cartTotal.textContent = total.toLocaleString();
    clearCartButton.disabled = false;
    checkoutButton.disabled = false;
}

function addToCart(productId) {
    fetch('/webshop/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            loadCart();
            showSuccess('Producto agregado al carrito');
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error al agregar al carrito');
    });
}

function removeFromCart(index) {
    fetch('/webshop/api/cart/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index: index })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            loadCart();
            showSuccess('Producto eliminado del carrito');
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error al eliminar del carrito');
    });
}

function clearCart() {
    fetch('/webshop/api/cart/clear', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            loadCart();
            showSuccess('Carrito limpiado');
        } else {
            showError(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error al limpiar el carrito');
    });
}

function startCheckout() {
    window.location.href = '/webshop/checkout';
}

function searchProducts(query) {
    query = query.toLowerCase();
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const products = item.querySelectorAll('.card');
        let hasVisibleProducts = false;
        
        products.forEach(product => {
            const title = product.querySelector('.card-title').textContent.toLowerCase();
            if (title.includes(query)) {
                product.style.display = '';
                hasVisibleProducts = true;
            } else {
                product.style.display = 'none';
            }
        });
        
        // Show/hide the entire category based on whether it has matching products
        if (hasVisibleProducts) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function showSuccess(message) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "#28a745",
    }).showToast();
}

function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "#dc3545",
    }).showToast();
}

function showToast(message, type) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: type === 'success' ? "#28a745" : "#dc3545",
    }).showToast();
}

function updateCartCount() {
    fetch('/webshop/api/cart/count')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('cartCount').textContent = data.count;
            }
        })
        .catch(error => {
            console.error('Error updating cart count:', error);
        });
}
