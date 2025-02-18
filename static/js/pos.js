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
});

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
