// Global variables for map
let map = null;
let directionsRenderer = null;

// Initialize map when Google Maps API is loaded
function initMap() {
    console.log('Google Maps API loaded');
    // Do nothing here, map will be initialized when modal is shown
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Deliveries JS loaded');

    // Initialize filters
    const statusFilter = document.getElementById('statusFilter');
    const storeFilter = document.getElementById('storeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchInput');
    const sourceFilter = document.getElementById('sourceFilter');

    // Filter function
    function filterDeliveries() {
        const selectedStatus = statusFilter.value;
        const selectedStore = storeFilter.value;
        const selectedDate = dateFilter.value;
        const searchText = searchInput.value.toLowerCase().trim();
        const selectedSource = sourceFilter.value;

        document.querySelectorAll('.delivery-card').forEach(card => {
            let show = true;

            if (selectedStatus && card.dataset.status !== selectedStatus) {
                show = false;
            }

            if (selectedStore && card.dataset.store !== selectedStore) {
                show = false;
            }

            if (selectedDate && card.dataset.date !== selectedDate) {
                show = false;
            }

            if (selectedSource && card.dataset.source !== selectedSource) {
                show = false;
            }

            if (searchText) {
                const cardText = card.textContent.toLowerCase();
                if (!cardText.includes(searchText)) {
                    show = false;
                }
            }

            card.style.display = show ? '' : 'none';
        });
    }

    // Add event listeners to filters
    statusFilter.addEventListener('change', filterDeliveries);
    storeFilter.addEventListener('change', filterDeliveries);
    dateFilter.addEventListener('change', filterDeliveries);
    searchInput.addEventListener('input', filterDeliveries);
    sourceFilter.addEventListener('change', filterDeliveries);

    // Handle payment creation
    document.querySelectorAll('.create-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const deliveryId = this.dataset.deliveryId;
            
            // Disable button and show loading state
            this.disabled = true;
            const originalText = this.textContent;
            this.textContent = 'Creando...';

            fetch(`/payment/create_payment/${deliveryId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                } else {
                    // Reload the page to show updated payment status
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al crear el link de pago');
            })
            .finally(() => {
                // Reset button state
                this.disabled = false;
                this.textContent = originalText;
            });
        });
    });

    // Handle payment link sending
    document.querySelectorAll('.send-payment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const deliveryId = this.dataset.deliveryId;
            
            // Disable button and show loading state
            this.disabled = true;
            const originalText = this.textContent;
            this.textContent = 'Enviando...';

            fetch(`/payment/send_payment/${deliveryId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(`Error: ${data.error}`);
                } else {
                    // Reload the page to show updated payment status
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al enviar el link de pago');
            })
            .finally(() => {
                // Reset button state
                this.disabled = false;
                this.textContent = originalText;
            });
        });
    });

    // Handle delivery details view
    $('#deliveryDetailsModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const deliveryId = button.data('delivery-id');
        const modal = $(this);
        
        fetch(`/api/delivery/${deliveryId}/details`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                modal.find('.modal-body').html(`
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Información del Cliente</h6>
                            <p>
                                <strong>Nombre:</strong> ${data.customer_name}<br>
                                <strong>Teléfono:</strong> ${data.phone}<br>
                                <strong>Dirección:</strong> ${data.address}
                            </p>
                        </div>
                        <div class="col-md-6">
                            <h6>Detalles del Pedido</h6>
                            <p>
                                <strong>Total:</strong> $${data.total_amount.toFixed(2)}<br>
                                <strong>Método de Pago:</strong> ${data.payment_method}<br>
                                <strong>Distancia:</strong> ${data.distance_km.toFixed(2)} km
                            </p>
                            ${data.mp_payment_link ? `
                            <h6>Información de Pago</h6>
                            <p>
                                <strong>Estado:</strong> <span class="badge ${data.mp_status === 'approved' ? 'bg-success' : data.mp_status === 'pending' ? 'bg-warning' : 'bg-danger'}">${data.mp_status || 'Pendiente'}</span><br>
                                <strong>Link de Pago:</strong> <a href="${data.mp_payment_link}" target="_blank">Ver Link</a>
                            </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6>Productos</h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td>${item.quantity}</td>
                                        <td>$${item.price.toFixed(2)}</td>
                                        <td>$${item.subtotal.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar los detalles del pedido');
            });
    });

    // Handle status updates
    $('#updateStatusModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const deliveryId = button.data('delivery-id');
        const currentStatus = button.data('current-status');
        const modal = $(this);
        
        modal.find('#deliveryIdInput').val(deliveryId);
        modal.find('#newStatusSelect').val(currentStatus);
        modal.find('#statusNotesInput').val('');
    });

    $('#updateStatusForm').on('submit', function(e) {
        e.preventDefault();
        const form = $(this);
        const modal = $('#updateStatusModal');
        
        const formData = {
            status_id: form.find('#newStatusSelect').val(),
            notes: form.find('#statusNotesInput').val()
        };

        fetch(`/api/delivery/${form.find('#deliveryIdInput').val()}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(() => {
            modal.modal('hide');
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al actualizar el estado');
        });
    });

    // Handle QR code display
    $('#qrModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const paymentLink = button.data('payment-link');
        const qrContainer = document.getElementById('qrContainer');
        
        // Clear previous QR code
        qrContainer.innerHTML = '';
        
        // Generate new QR code
        new QRCode(qrContainer, {
            text: paymentLink,
            width: 256,
            height: 256
        });
    });

    // Handle payment link sending
    $('.send-payment-btn').on('click', function() {
        const button = $(this);
        const deliveryId = button.data('delivery-id');
        
        button.prop('disabled', true);
        button.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
        
        fetch(`/payment/send_payment/${deliveryId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                alert(result.error);
                button.prop('disabled', false);
                button.html('<i class="fas fa-paper-plane"></i> Enviar Link de Pago');
            } else {
                button.removeClass('btn-outline-info').addClass('btn-success');
                button.html('<i class="fas fa-check"></i> Link Enviado');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al enviar el link de pago');
            button.prop('disabled', false);
            button.html('<i class="fas fa-paper-plane"></i> Enviar Link de Pago');
        });
    });

    // Handle map view
    let map = null;
    let directionsRenderer = null;

    $('#mapModal').on('shown.bs.modal', function() {
        console.log('Modal shown');
        const button = $('.view-map-btn[data-target="#mapModal"]');
        const storeLat = parseFloat(button.data('store-lat'));
        const storeLng = parseFloat(button.data('store-lng'));
        const deliveryLat = parseFloat(button.data('delivery-lat'));
        const deliveryLng = parseFloat(button.data('delivery-lng'));

        console.log('Coordinates:', {
            store: { lat: storeLat, lng: storeLng },
            delivery: { lat: deliveryLat, lng: deliveryLng }
        });

        try {
            // Initialize map if not already initialized
            if (!map) {
                console.log('Initializing map');
                const mapElement = document.getElementById('delivery-map');
                console.log('Map element:', mapElement);
                
                map = new google.maps.Map(mapElement, {
                    zoom: 12,
                    center: { lat: storeLat, lng: storeLng }
                });
                console.log('Map initialized');
            }

            // Clear previous directions if any
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
            }

            // Add markers
            console.log('Adding markers');
            const storeMarker = new google.maps.Marker({
                position: { lat: storeLat, lng: storeLng },
                map: map,
                title: 'Tienda',
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }
            });

            const deliveryMarker = new google.maps.Marker({
                position: { lat: deliveryLat, lng: deliveryLng },
                map: map,
                title: 'Entrega',
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }
            });

            // Draw route
            console.log('Drawing route');
            const directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: true // Hide default markers
            });

            const request = {
                origin: { lat: storeLat, lng: storeLng },
                destination: { lat: deliveryLat, lng: deliveryLng },
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, function(result, status) {
                console.log('Route status:', status);
                if (status == 'OK') {
                    directionsRenderer.setDirections(result);
                }
            });

            // Trigger resize to ensure map displays correctly
            google.maps.event.trigger(map, 'resize');
            console.log('Map resize triggered');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    });

    // Clean up map when modal is hidden
    $('#mapModal').on('hidden.bs.modal', function() {
        console.log('Modal hidden, cleaning up map');
        if (directionsRenderer) {
            directionsRenderer.setMap(null);
        }
        if (map) {
            map.setMap(null);
            map = null;
        }
    });

    // Initialize Ekko Lightbox
    $(document).on('click', '[data-toggle="lightbox"]', function(event) {
        event.preventDefault();
        const $button = $(this);
        
        // Get coordinates
        const storeLat = parseFloat($button.data('store-lat'));
        const storeLng = parseFloat($button.data('store-lng'));
        const deliveryLat = parseFloat($button.data('delivery-lat'));
        const deliveryLng = parseFloat($button.data('delivery-lng'));
        
        // Create map container
        const mapContainer = $('<div>').attr('id', 'delivery-map').css({
            width: '100%',
            height: '400px'
        });
        
        // Initialize lightbox with map container
        $(this).ekkoLightbox({
            content: mapContainer,
            onShown: function() {
                // Initialize map after lightbox is shown
                const map = new google.maps.Map(document.getElementById('delivery-map'), {
                    zoom: 12,
                    center: { lat: storeLat, lng: storeLng }
                });
                
                // Add markers
                const storeMarker = new google.maps.Marker({
                    position: { lat: storeLat, lng: storeLng },
                    map: map,
                    title: 'Tienda',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }
                });
                
                const deliveryMarker = new google.maps.Marker({
                    position: { lat: deliveryLat, lng: deliveryLng },
                    map: map,
                    title: 'Entrega',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }
                });
                
                // Draw route
                const directionsService = new google.maps.DirectionsService();
                const directionsRenderer = new google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true // Hide default markers
                });
                
                const request = {
                    origin: { lat: storeLat, lng: storeLng },
                    destination: { lat: deliveryLat, lng: deliveryLng },
                    travelMode: google.maps.TravelMode.DRIVING
                };
                
                directionsService.route(request, function(result, status) {
                    if (status == 'OK') {
                        directionsRenderer.setDirections(result);
                    }
                });
            }
        });
    });
});
