// Function to refresh recent sales table
function refreshRecentSales() {
    console.log('Refreshing recent sales...');
    return fetch('/api/get_recent_sales')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const tableContainer = document.getElementById('recentSalesTableContainer');
                if (tableContainer) {
                    console.log('Updating recent sales table...');
                    tableContainer.innerHTML = data.html;
                    console.log('Recent sales updated successfully');
                    // Re-attach event handlers
                    attachQRButtonHandlers();
                    return true;
                } else {
                    console.error('recentSalesTableContainer element not found');
                    return false;
                }
            } else {
                console.error('Failed to refresh recent sales:', data);
                return false;
            }
        })
        .catch(error => {
            console.error('Error refreshing recent sales:', error);
            return Promise.reject(error);
        });
}

// Function to attach event handlers to QR buttons
function attachQRButtonHandlers() {
    console.log('Attaching QR button handlers...');
    const qrButtons = document.querySelectorAll('.qr-button');
    qrButtons.forEach(button => {
        button.addEventListener('click', function() {
            const qrLink = this.getAttribute('data-qr');
            const paymentLink = this.getAttribute('data-payment-link');
            console.log('QR button clicked:', { qrLink, paymentLink });
            showQRInModal(qrLink, paymentLink);
        });
    });
}

// Function to send payment link
function sendPayment(deliveryId) {
    fetch(`/payment/send_payment/${deliveryId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            Swal.fire({
                title: 'Error',
                text: result.error,
                icon: 'error'
            });
        } else {
            Swal.fire({
                title: 'Éxito',
                text: 'Link de pago enviado exitosamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            const btn = $(`.send-payment-btn[data-delivery-id="${deliveryId}"]`);
            btn.prop('disabled', true);
            btn.html('<i class="fas fa-check"></i>');
            refreshRecentSales();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al enviar el link de pago',
            icon: 'error'
        });
    });
}

// Function to show QR code in modal
function showQRInModal(qrLink, paymentLink) {
    const qrContainer = document.getElementById('qrContainer');
    qrContainer.innerHTML = '';
    
    console.log('Showing QR code:', { qrLink, paymentLink });
    // Etiqueta de venta
    try {
        const label = document.getElementById('qrSaleLabel');
        if (label && window.__lastReceiptData) {
            label.textContent = `Venta #${window.__lastReceiptData.sale_id}`;
        }
    } catch {}
    
    if (qrLink) {
        console.log('Using pre-generated QR image');
        const qrImage = document.createElement('img');
        qrImage.src = qrLink;
        qrImage.style.width = '256px';
        qrImage.style.height = '256px';
        qrContainer.appendChild(qrImage);
    } else if (paymentLink) {
        console.log('Generating QR from payment link');
        try {
            // Create a wrapper div for the QR code
            const qrWrapper = document.createElement('div');
            qrWrapper.style.display = 'flex';
            qrWrapper.style.justifyContent = 'center';
            qrWrapper.style.alignItems = 'center';
            qrWrapper.style.padding = '20px';
            qrContainer.appendChild(qrWrapper);
            
            // Generate QR code in the wrapper
            new QRCode(qrWrapper, {
                text: paymentLink,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Add payment link below QR code
            const linkElement = document.createElement('div');
            linkElement.style.marginTop = '10px';
            linkElement.style.textAlign = 'center';
            const anchor = document.createElement('a');
            anchor.href = paymentLink;
            anchor.target = '_blank';
            anchor.textContent = 'Abrir link de pago';
            linkElement.appendChild(anchor);
            qrContainer.appendChild(linkElement);
        } catch (error) {
            console.error('Error generating QR code:', error);
            qrContainer.innerHTML = '<p class="text-danger">Error al generar código QR: ' + error.message + '</p>';
        }
    } else {
        qrContainer.innerHTML = '<p class="text-warning">No hay link de pago disponible</p>';
    }
    
    $('#qrModal').modal('show');
    // Iniciar polling de estado si tenemos última venta
    if (window.__lastReceiptData && window.__lastReceiptData.sale_id) {
        startPaymentPolling(window.__lastReceiptData.sale_id);
    }
}
let __paymentPollInterval = null;
function startPaymentPolling(saleId) {
    clearInterval(__paymentPollInterval);
    __paymentPollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/payment_status/${saleId}`);
            const data = await res.json();
            if ((data.status || '').toLowerCase() === 'approved') {
                clearInterval(__paymentPollInterval);
                try { playSuccessSound(); } catch(e) {}
                try {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Pago aprobado',
                        showConfirmButton: false,
                        timer: 1600
                    });
                } catch(e) {}
                if (window.__lastReceiptData) {
                    printReceipt(window.__lastReceiptData);
                }
                // Cerrar modal y resetear ticket UI
                $('#qrModal').modal('hide');
                resetTicketUI();
            }
        } catch (error) {
            console.error('[POS] polling pago', error);
        }
    }, 2500);
}

function resetTicketUI() {
    try {
        // Limpiar carrito y refrescar DOM
        fetch('/api/clear_cart', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(() => updateCart())
            .then(() => {
                const search = document.getElementById('productSearch');
                if (search) search.value = '';
                const firstButton = document.querySelector('.product-card button, .product-button');
                if (firstButton) firstButton.focus();
            });
    } catch (e) {
        console.error('[POS] resetTicketUI', e);
    }
}

// Function to process the sale
function processSale() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const isDelivery = document.getElementById('deliveryToggle').checked;
    
    if (!paymentMethod) {
        Swal.fire({
            title: 'Atención',
            text: 'Por favor seleccione un método de pago',
            icon: 'warning'
        });
        return;
    }

    let formData = {
        payment_method: paymentMethod,
        is_delivery: isDelivery
    };

    if (isDelivery) {
        const deliveryData = {
            customer_name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value,
            landmark: document.getElementById('customerLandmark').value,
            notes: document.getElementById('deliveryNotes').value,
            latitude: document.getElementById('latitude').value,
            longitude: document.getElementById('longitude').value
        };
        
        if (!deliveryData.customer_name || !deliveryData.phone || !deliveryData.address) {
            Swal.fire({
                title: 'Error',
                text: 'Por favor complete los datos de entrega',
                icon: 'error'
            });
            return;
        }

        formData.delivery_data = deliveryData;
    }

    Swal.fire({
        title: 'Procesando Venta',
        text: 'Por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Process the sale
    fetch('/api/process_sale', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
            if (data.status === 'success') {
            console.log('Sale processed successfully, refreshing recent sales...');
            // Guardar recibo en memoria para impresión
            if (data.receipt) {
                window.__lastReceiptData = data.receipt;
                // Si es efectivo, imprimir de inmediato
                if ((data.receipt.payment_method || '').toLowerCase() === 'cash') {
                    printReceipt(data.receipt);
                        try { playSuccessSound(); } catch(e) {}
                        try {
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Pago registrado',
                                showConfirmButton: false,
                                timer: 1400
                            });
                        } catch(e) {}
                }
            }
            
            // First refresh recent sales
            return refreshRecentSales()
                .then(refreshSuccess => {
                    if (!refreshSuccess) {
                        console.error('Failed to refresh recent sales table');
                    }
                    
                    // Then clear the cart
                    console.log('Clearing cart...');
                    return fetch('/api/clear_cart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                })
                .then(() => {
                    console.log('Cart cleared, updating display...');
                    // Update cart display
                    updateCart();
                    
                    // Reset delivery form if needed
                    if (isDelivery) {
                        document.getElementById('deliveryToggle').checked = false;
                        document.getElementById('deliveryInfo').style.display = 'none';
                        document.getElementById('map').style.display = 'none';
                        document.getElementById('customerName').value = '';
                        document.getElementById('customerPhone').value = '';
                        document.getElementById('customerAddress').value = '';
                        document.getElementById('customerLandmark').value = '';
                        document.getElementById('deliveryNotes').value = '';
                        document.getElementById('latitude').value = '';
                        document.getElementById('longitude').value = '';
                        selectedCustomerId = null;
                    }
                    
                    // Show success message
                    Swal.fire({
                        title: 'Venta Procesada',
                        text: 'La venta se ha procesado correctamente',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    // Si hay link de pago, mostrar modal con QR y opción de imprimir
                    if (data.payment_link || data.qr_link) {
                        showQRInModal(data.qr_link, data.payment_link);
                    }
                });
        } else {
            throw new Error(data.message || 'Error desconocido al procesar la venta');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Error al procesar la venta',
            icon: 'error'
        });
    });
}
// Ticket/Receipt
function printReceipt(receipt) {
    try {
        const win = window.open('', 'PRINT', 'height=600,width=400');
        const lines = [];
        lines.push(`VENEZIA`);
        lines.push(`${receipt.store}`);
        lines.push(`ORDEN #${receipt.sale_id}`);
        lines.push(`Fecha: ${receipt.created_at}`);
        lines.push(`Pago: ${receipt.payment_method}`);
        lines.push('');
        receipt.items.forEach(it => {
            lines.push(`${it.name} x${it.quantity}  $${it.total_price.toFixed(2)}`);
            if (it.flavors && it.flavors.length) {
                lines.push(`  Sabores: ${it.flavors.join(', ')}`);
            }
        });
        lines.push('');
        lines.push(`TOTAL: $${receipt.total.toFixed(2)}`);
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket</title>
            <style>
              body{font-family:monospace;margin:10px;font-size:12px;}
              .big{font-size:16px;font-weight:bold;}
              .center{text-align:center}
              hr{border:0;border-top:1px dashed #999;margin:8px 0;}
            </style>
            </head><body>
            <div class="center big">VENEZIA</div>
            <div class="center">${receipt.store}</div>
            <div class="center">ORDEN #${receipt.sale_id}</div>
            <hr/>
            <pre>${lines.join('\n')}</pre>
            </body></html>`;
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    } catch (e) {
        console.error('Error printing', e);
        Swal.fire('Error', 'No se pudo imprimir el ticket', 'error');
    }
}

// Botón imprimir del modal
$(document).on('click', '#printReceiptBtn', function(){
    if (window.__lastReceiptData) printReceipt(window.__lastReceiptData);
});

$(document).on('click', '#closeTicketBtn', function(){
    $('#qrModal').modal('hide');
    resetTicketUI();
});


function fillCustomerData(data) {
    document.getElementById('customer_id').value = data.id;
    document.getElementById('customer_name').value = data.name;
    document.getElementById('customer_phone').value = data.phone;
    document.getElementById('customer_email').value = data.email;
    
    // Fill address data if available
    if (data.addresses && data.addresses.length > 0) {
        const address = data.addresses[0];
        document.getElementById('delivery_street').value = address.street;
        document.getElementById('delivery_number').value = address.number;
        document.getElementById('delivery_complement').value = address.complement || '';
        document.getElementById('delivery_neighborhood').value = address.neighborhood;
        document.getElementById('delivery_city').value = address.city;
        document.getElementById('delivery_state').value = address.state;
        document.getElementById('delivery_postal_code').value = address.postal_code;
        
        // Set coordinates if available
        if (address.latitude && address.longitude) {
            document.getElementById('delivery_latitude').value = address.latitude;
            document.getElementById('delivery_longitude').value = address.longitude;
            
            // Automatically show and update the map
            showMap();
            const location = { lat: parseFloat(address.latitude), lng: parseFloat(address.longitude) };
            updateMap(location);
            document.getElementById('map').style.display = 'block';
        }
    }
    
    // Close the modal
    $('#searchCustomerModal').modal('hide');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up recent sales refresh...');
    
    // Initial refresh
    refreshRecentSales();
    
    // Refresh every 3 seconds
    setInterval(refreshRecentSales, 3000);

    // Add to cart with flavor selection if needed
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const productName = this.dataset.productName || '';
            const maxFlavors = parseInt(this.dataset.maxFlavors || '0');
            const salesFormat = (this.dataset.salesFormat || '').toUpperCase();
            if (maxFlavors > 0 || salesFormat.includes('KG')) {
                openFlavorModalPOS(productId, productName, maxFlavors || 0);
            } else {
                addToCartDirect(productId);
            }
        });
    });

    // Quick pote button (q)
    const quickBtn = document.getElementById('posQuickPoteBtn');
    if (quickBtn) {
        quickBtn.addEventListener('click', openDefaultPoteModal);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e){
        if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
        if (e.key.toLowerCase() === 'n') { // nuevo ticket = limpiar carrito
            e.preventDefault();
            fetch('/api/clear_cart', { method:'POST', headers:{'Content-Type':'application/json'} })
                .then(()=>updateCart());
        }
        if (e.key.toLowerCase() === 'c') { // cobrar
            e.preventDefault();
            // forzar método MP si no está seleccionado
            const pm = document.getElementById('paymentMethod');
            if (pm && !pm.value) pm.value = 'mercadopago';
            processSale();
        }
        if (e.key.toLowerCase() === 'p') { // imprimir
            e.preventDefault();
            if (window.__lastReceiptData) {
                printReceipt(window.__lastReceiptData);
            }
        }
        if (e.key.toLowerCase() === 'q') { // pote rápido
            e.preventDefault();
            openDefaultPoteModal();
        }
        if (e.key === 'Enter' && $('#posFlavorModal').hasClass('show')) {
            e.preventDefault();
            const btn = document.getElementById('posAddFlavorsBtn');
            if (btn && !btn.disabled) btn.click();
        }
    });

    // Render favoritos al cargar
    renderFavoritesPanel();

    // Delegación de eventos para ítems del carrito
    document.addEventListener('click', function(e){
        const dec = e.target.closest('.cart-dec');
        const inc = e.target.closest('.cart-inc');
        const del = e.target.closest('.cart-del');
        if (dec) {
            const idx = dec.getAttribute('data-index');
            updateCartItem(idx, -1);
        } else if (inc) {
            const idx = inc.getAttribute('data-index');
            updateCartItem(idx, 1);
        } else if (del) {
            const idx = del.getAttribute('data-index');
            removeCartItem(idx);
        }
    });

    // Atajos de teclado sobre cart-item enfocado
    document.addEventListener('keydown', function(e){
        const focused = document.activeElement;
        if (focused && focused.classList && focused.classList.contains('cart-item')) {
            const idx = focused.getAttribute('data-index');
            if (e.key === 'Delete') { e.preventDefault(); removeCartItem(idx); }
            if (e.key === '+') { e.preventDefault(); updateCartItem(idx, 1); }
            if (e.key === '-') { e.preventDefault(); updateCartItem(idx, -1); }
        }
    });
});

// POS Flavor selection modal logic
let posCurrentProductId = null;
let posSelected = [];

async function openFlavorModalPOS(productId, productName, maxFlavors) {
    posCurrentProductId = productId;
    posSelected = [];
    const nameEl = document.getElementById('posSelectedProductName');
    const maxEl = document.getElementById('posMaxFlavors');
    const alertEl = document.getElementById('posFlavorAlert');
    const list = document.getElementById('posFlavorList');
    const sugg = document.getElementById('posSuggested');
    const addBtn = document.getElementById('posAddFlavorsBtn');
    if (!nameEl || !maxEl || !alertEl || !list || !sugg || !addBtn) return;
    nameEl.textContent = productName;
    maxEl.textContent = maxFlavors || '';
    alertEl.style.display = 'none';
    list.innerHTML = '';
    sugg.innerHTML = '';
    addBtn.disabled = true;

    const res = await fetch('/api/get_flavors');
    const flavors = await res.json();
    const suggested = flavors
        .filter(f => (f.quantity || 0) > 0.5)
        .sort((a,b) => (b.quantity||0) - (a.quantity||0))
        .slice(0,5);
    if (suggested.length) {
        const title = document.createElement('h6');
        title.textContent = 'Sugeridos (mayor disponibilidad)';
        sugg.appendChild(title);
        const btns = document.createElement('div');
        suggested.forEach((s, idx) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn btn-sm btn-outline-secondary mr-2 mb-2';
            b.textContent = `${idx+1}. ${s.name} (${(s.quantity||0).toFixed(2)} kg)`;
            b.addEventListener('click', () => togglePosFlavor(s.id, s.name, maxFlavors));
            btns.appendChild(b);
        });
        const auto = document.createElement('button');
        auto.type = 'button';
        auto.className = 'btn btn-sm btn-primary mb-2';
        auto.textContent = 'Completar automáticamente';
        auto.onclick = () => {
            for (const s of suggested) {
                if (posSelected.find(f=>f.id===String(s.id))) continue;
                if (maxFlavors && posSelected.length >= maxFlavors) break;
                togglePosFlavor(s.id, s.name, maxFlavors);
            }
        };
        btns.appendChild(auto);
        sugg.appendChild(btns);
        sugg.appendChild(document.createElement('hr'));
    }

    flavors.forEach(f => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input pos-flavor-cb" type="checkbox" value="${f.id}" id="posflavor${f.id}">
            <label class="form-check-label" for="posflavor${f.id}">
                ${f.name}
                <span class="badge badge-${(f.quantity||0) <= 0.5 ? 'danger' : ((f.quantity||0) <= 1 ? 'warning' : 'secondary')} ml-2">${(f.quantity||0).toFixed(2)} kg</span>
            </label>
        `;
        list.appendChild(div);
    });

    const search = document.getElementById('posFlavorSearch');
    if (search) {
        search.value = '';
        search.addEventListener('input', function(){
            const q = this.value.toLowerCase();
            Array.from(list.querySelectorAll('.form-check')).forEach(row => {
                const name = row.querySelector('label').textContent.toLowerCase();
                row.style.display = !q || name.includes(q) ? '' : 'none';
            });
        });
    }

    list.querySelectorAll('.pos-flavor-cb').forEach(cb => {
        cb.addEventListener('change', function(){
            const id = this.value;
            const name = this.nextElementSibling.childNodes[0].textContent.trim();
            togglePosFlavor(id, name, maxFlavors, this);
        });
    });

    $('#posFlavorModal').modal('show');
}

function togglePosFlavor(id, name, maxFlavors, checkboxEl) {
    const exists = posSelected.find(f => f.id === String(id));
    if (exists) {
        posSelected = posSelected.filter(f => f.id !== String(id));
        const cb = checkboxEl || document.getElementById(`posflavor${id}`);
        if (cb) cb.checked = false;
    } else {
        if (maxFlavors && posSelected.length >= maxFlavors) {
            const alert = document.getElementById('posFlavorAlert');
            if (alert) {
                alert.textContent = `Máximo ${maxFlavors} sabores permitidos`;
                alert.style.display = 'block';
            }
            return;
        }
        posSelected.push({ id: String(id), name });
        const cb = checkboxEl || document.getElementById(`posflavor${id}`);
        if (cb) cb.checked = true;
    }
    const addBtn = document.getElementById('posAddFlavorsBtn');
    if (addBtn) addBtn.disabled = posSelected.length === 0;
}

// Pote rápido: usa el primer producto con max_flavors > 0
function openDefaultPoteModal() {
    const firstPoteBtn = Array.from(document.querySelectorAll('.add-to-cart')).find(btn => {
        const maxFlavors = parseInt(btn.dataset.maxFlavors || '0');
        const salesFormat = (btn.dataset.salesFormat || '').toUpperCase();
        return maxFlavors > 0 || salesFormat.includes('KG');
    });
    if (firstPoteBtn) {
        const productId = firstPoteBtn.dataset.productId;
        const productName = firstPoteBtn.dataset.productName || '';
        const maxFlavors = parseInt(firstPoteBtn.dataset.maxFlavors || '0');
        openFlavorModalPOS(productId, productName, maxFlavors || 0);
    }
}

// Favoritos por sucursal (localStorage)
function getFavoritesKey() {
    const storeId = (window.POS_STORE_ID || 'global');
    return `venezia_pos_favorites_${storeId}`;
}

function loadFavorites() {
    try {
        const raw = localStorage.getItem(getFavoritesKey());
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveFavorites(favs) {
    try { localStorage.setItem(getFavoritesKey(), JSON.stringify(favs.slice(0,8))); } catch {}
}

function addFavoriteFlavor(flavorId, flavorName) {
    const favs = loadFavorites();
    const exists = favs.find(f => f.id === String(flavorId));
    if (!exists) {
        favs.unshift({ id: String(flavorId), name: flavorName });
        saveFavorites(favs);
        renderFavoritesPanel();
    }
}

function renderFavoritesPanel() {
    const container = document.getElementById('posFavoritesContainer');
    if (!container) return;
    container.innerHTML = '';
    const favs = loadFavorites();
    if (!favs.length) {
        const small = document.createElement('small');
        small.className = 'text-muted';
        small.textContent = 'Se mostrarán aquí los sabores que más vendas.';
        container.appendChild(small);
        return;
    }
    favs.forEach(f => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline-secondary mr-2 mb-2';
        btn.setAttribute('aria-label', `Agregar ${f.name} a un pote`);
        btn.textContent = f.name;
        btn.addEventListener('click', async () => {
            // abrir modal del pote por defecto y preseleccionar este sabor
            const firstPoteBtn = Array.from(document.querySelectorAll('.add-to-cart')).find(btn => {
                const maxFlavors = parseInt(btn.dataset.maxFlavors || '0');
                const salesFormat = (btn.dataset.salesFormat || '').toUpperCase();
                return maxFlavors > 0 || salesFormat.includes('KG');
            });
            if (!firstPoteBtn) return;
            const productId = firstPoteBtn.dataset.productId;
            const productName = firstPoteBtn.dataset.productName || '';
            const maxFlavors = parseInt(firstPoteBtn.dataset.maxFlavors || '0');
            await openFlavorModalPOS(productId, productName, maxFlavors || 0);
            // marcar el favorito si existe en la lista
            togglePosFlavor(f.id, f.name, maxFlavors);
        });
        container.appendChild(btn);
    });
}

async function updateCartItem(index, delta) {
    try {
        const resp = await fetch('/api/cart/update_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: Number(index), delta: Number(delta) })
        });
        const data = await resp.json();
        if (data.status === 'success') {
            document.getElementById('cart-items').innerHTML = data.cart_html;
            document.getElementById('cart-total').textContent = data.total;
        } else {
            Swal.fire('Error', data.message || 'No se pudo actualizar el ítem', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar el ítem', 'error');
    }
}

async function removeCartItem(index) {
    try {
        const resp = await fetch('/api/cart/remove_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: Number(index) })
        });
        const data = await resp.json();
        if (data.status === 'success') {
            document.getElementById('cart-items').innerHTML = data.cart_html;
            document.getElementById('cart-total').textContent = data.total;
        } else {
            Swal.fire('Error', data.message || 'No se pudo eliminar el ítem', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo eliminar el ítem', 'error');
    }
}


// Handle QR button clicks (using event delegation)
$(document).on('click', '.show-qr-btn', function(e) {
    e.preventDefault();
    const paymentLink = $(this).data('payment-link');
    const qrLink = $(this).data('qr-link');
    console.log('QR button clicked:', { paymentLink, qrLink });
    showQRInModal(qrLink, paymentLink);
});

// Handle send payment button clicks (using event delegation)
$(document).on('click', '.send-payment-btn', function(e) {
    e.preventDefault();
    const deliveryId = $(this).data('delivery-id');
    console.log('Send payment button clicked for delivery:', deliveryId);
    sendPayment(deliveryId);
});

// Handle delivery toggle
const deliveryToggle = document.getElementById('deliveryToggle');
const deliveryInfo = document.getElementById('deliveryInfo');
const map = document.getElementById('map');

if (deliveryToggle && deliveryInfo) {
    deliveryToggle.addEventListener('change', function() {
        deliveryInfo.style.display = this.checked ? 'block' : 'none';
        if (map) {
            map.style.display = this.checked ? 'block' : 'none';
        }
    });
}
