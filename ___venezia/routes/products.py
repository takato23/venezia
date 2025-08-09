from flask import Blueprint, render_template, jsonify, request
from models import db, Product, ProductCategory, Store, Stock
from sqlalchemy import desc

products_bp = Blueprint('products', __name__)

@products_bp.route('/products')
def products():
    # Get all categories and their products
    categories = ProductCategory.query.all()
    category_products = {}
    
    for category in categories:
        # Get all products for this category
        products = Product.query.filter_by(category_id=category.id).all()
        category_products[category.name] = {
            'id': category.id,
            'category': category,
            'products': products
        }
    
    return render_template('products.html', category_products=category_products)

@products_bp.route('/delete_product/<int:product_id>', methods=['POST'])
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        
        # First delete all stock records for this product
        Stock.query.filter_by(product_id=product_id).delete()
        
        # Then delete the product
        db.session.delete(product)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()  # Rollback on error
        return jsonify({'success': False, 'error': str(e)})

@products_bp.route('/add_product', methods=['POST'])
def add_product():
    try:
        data = request.json
        new_product = Product(
            name=data['name'],
            price=float(data['price']),
            category_id=int(data['category_id']),
            weight_kg=float(data['weight_kg']) if data['weight_kg'] else None,
            max_flavors=int(data['max_flavors']) if data['max_flavors'] else None,
            track_stock=data.get('track_stock', False),
            active=data.get('active', True)
        )
        db.session.add(new_product)
        db.session.commit()

        # If track_stock is True, create initial stock entry
        if new_product.track_stock:
            store = Store.query.first()  # Get the first store
            if store:
                stock = Stock(
                    store_id=store.id,
                    product_id=new_product.id,
                    current_stock=0,
                    minimum_stock=0
                )
                db.session.add(stock)
                db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@products_bp.route('/edit_product/<int:product_id>', methods=['PUT'])
def edit_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.json
        
        # Update basic fields
        product.name = data['name']
        product.price = float(data['price'])
        product.category_id = int(data['category_id'])
        
        # Handle optional numeric fields
        weight_kg = data.get('weight_kg')
        product.weight_kg = float(weight_kg) if weight_kg and weight_kg.strip() else None
        
        max_flavors = data.get('max_flavors')
        product.max_flavors = int(max_flavors) if max_flavors and max_flavors.strip() else None
        
        product.track_stock = data.get('track_stock', False)
        product.active = data.get('active', True)
        
        # If track_stock is enabled but no stock records exist, create them
        if product.track_stock:
            store = Store.query.first()
            if store:
                stock = Stock.query.filter_by(store_id=store.id, product_id=product.id).first()
                if not stock:
                    stock = Stock(
                        store_id=store.id,
                        product_id=product.id,
                        quantity=0,
                        minimum_quantity=0
                    )
                    db.session.add(stock)
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@products_bp.route('/add_category', methods=['POST'])
def add_category():
    try:
        data = request.json
        new_category = ProductCategory(name=data['name'])
        db.session.add(new_category)
        db.session.commit()
        return jsonify({'success': True, 'id': new_category.id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@products_bp.route('/edit_category/<int:category_id>', methods=['PUT'])
def edit_category(category_id):
    try:
        category = ProductCategory.query.get_or_404(category_id)
        data = request.json
        category.name = data['name']
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@products_bp.route('/delete_category/<int:category_id>', methods=['POST'])
def delete_category(category_id):
    try:
        category = ProductCategory.query.get_or_404(category_id)
        # Check if category has products
        if category.products:
            return jsonify({'success': False, 'error': 'Cannot delete category with products'})
        db.session.delete(category)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
