document.addEventListener('DOMContentLoaded', function() {
    // Handle edit product button click
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const productName = this.dataset.productName;
            const productCategory = this.dataset.productCategory;
            const productPrice = this.dataset.productPrice;
            const productWeight = this.dataset.productWeight;
            const productFlavors = this.dataset.productFlavors;
            const productStock = this.dataset.productStock === '1';
            const productActive = this.dataset.productActive === '1';
            const productFormat = this.dataset.productFormat;

            // Populate the edit form
            document.getElementById('edit_id').value = productId;
            document.getElementById('edit_name').value = productName;
            document.getElementById('edit_category_id').value = productCategory;
            document.getElementById('edit_price').value = productPrice;
            document.getElementById('edit_weight_kg').value = productWeight || '';
            document.getElementById('edit_max_flavors').value = productFlavors || '';
            document.getElementById('edit_track_stock').checked = productStock;
            document.getElementById('edit_active').checked = productActive;

            updateEditSalesFormat();
        });
    });

    // Handle category change for add form
    document.getElementById('category_id')?.addEventListener('change', updateSalesFormat);
    
    // Handle category change for edit form
    document.getElementById('edit_category_id')?.addEventListener('change', updateEditSalesFormat);

    // Handle edit form submission
    document.getElementById('editProductForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            id: document.getElementById('edit_id').value,
            name: document.getElementById('edit_name').value,
            category_id: document.getElementById('edit_category_id').value,
            price: document.getElementById('edit_price').value,
            weight_kg: document.getElementById('edit_weight_kg').value || null,
            max_flavors: document.getElementById('edit_max_flavors').value || null,
            track_stock: document.getElementById('edit_track_stock').checked,
            active: document.getElementById('edit_active').checked
        };

        fetch(`/edit_product/${formData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                $('#editProductModal').modal('hide');
                Swal.fire('¡Actualizado!', 'El producto ha sido actualizado.', 'success')
                .then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire('Error', data.error || 'Error al actualizar el producto', 'error');
            }
        })
        .catch(error => {
            console.error('Edit error:', error);
            Swal.fire('Error', 'Error al actualizar el producto', 'error');
        });
    });

    // Function to update sales format based on category for add form
    function updateSalesFormat() {
        const categorySelect = document.getElementById('category_id');
        const weightInput = document.getElementById('weight_kg')?.closest('.form-group');
        const maxFlavorsInput = document.getElementById('max_flavors')?.closest('.form-group');
        
        if (!categorySelect || !weightInput || !maxFlavorsInput) return;
        
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        const categoryName = selectedOption.text.trim();
        
        if (categoryName === 'Sabores') {
            weightInput.style.display = 'none';
            maxFlavorsInput.style.display = 'none';
        } else if (categoryName === 'Helado') {
            weightInput.style.display = 'block';
            maxFlavorsInput.style.display = 'block';
        } else {
            weightInput.style.display = 'block';
            maxFlavorsInput.style.display = 'none';
        }
    }

    // Function to update sales format based on category for edit form
    function updateEditSalesFormat() {
        const categorySelect = document.getElementById('edit_category_id');
        const weightInput = document.getElementById('edit_weight_kg')?.closest('.form-group');
        const maxFlavorsInput = document.getElementById('edit_max_flavors')?.closest('.form-group');
        
        if (!categorySelect || !weightInput || !maxFlavorsInput) return;
        
        const categoryName = categorySelect.options[categorySelect.selectedIndex].textContent.trim();
        
        if (categoryName === 'Sabores') {
            weightInput.style.display = 'none';
            maxFlavorsInput.style.display = 'none';
        } else if (categoryName === 'Helado') {
            weightInput.style.display = 'block';
            maxFlavorsInput.style.display = 'block';
        } else {
            weightInput.style.display = 'block';
            maxFlavorsInput.style.display = 'none';
        }
    }
});

// Make functions available globally
window.updateSalesFormat = function() {
    const categorySelect = document.getElementById('category_id');
    const weightInput = document.getElementById('weight_kg')?.closest('.form-group');
    const maxFlavorsInput = document.getElementById('max_flavors')?.closest('.form-group');
    
    if (!categorySelect || !weightInput || !maxFlavorsInput) return;
    
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    const categoryName = selectedOption.text.trim();
    
    if (categoryName === 'Sabores') {
        weightInput.style.display = 'none';
        maxFlavorsInput.style.display = 'none';
    } else if (categoryName === 'Helado') {
        weightInput.style.display = 'block';
        maxFlavorsInput.style.display = 'block';
    } else {
        weightInput.style.display = 'block';
        maxFlavorsInput.style.display = 'none';
    }
};

window.updateEditSalesFormat = updateEditSalesFormat;
