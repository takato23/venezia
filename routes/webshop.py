from flask import Blueprint, render_template, jsonify, request, session, abort, redirect, url_for, make_response
from flask_login import current_user
from functools import wraps
import json
from models import Product, ProductCategory, Stock, WebUser, DeliveryAddress, Sale, SaleItem, DeliveryOrder
from extensions import db
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

webshop = Blueprint('webshop', __name__, url_prefix='/webshop')

# Ice cream pote configurations
POTE_CONFIGS = {
    '1/4 KG': {'min_flavors': 1, 'max_flavors': 3},
    '1/2 KG': {'min_flavors': 1, 'max_flavors': 4},
    '1 KG': {'min_flavors': 1, 'max_flavors': 5}
}

# Counter for order numbers, should be replaced with database sequence
_order_counter = 0

def generate_order_number():
    """Generate a user-friendly order number"""
    global _order_counter
    _order_counter += 1
    year = datetime.now().year
    return f'VEN-{year}-{_order_counter:03d}'

def init_webshop_session():
    """Initialize webshop session variables if they don't exist"""
    if 'webshop_cart' not in session:
        session['webshop_cart'] = []
    if 'webshop_cart_total' not in session:
        session['webshop_cart_total'] = 0.0

@webshop.before_request
def before_request():
    """Initialize session before each request"""
    init_webshop_session()

@webshop.route('/')
def index():
    """Main webshop page"""
    # Get all categories except 'Sabores' and organize products by category
    categories = ProductCategory.query.filter(
        ProductCategory.name != 'Sabores'
    ).all()
    
    category_products = {}
    
    for category in categories:
        # For Helado category (potes), show all active products
        products = Product.query.filter_by(
            category_id=category.id,
            active=True
        ).all()
        
        # Get stock information for each product
        for product in products:
            if product.track_stock:
                stock = Stock.query.filter_by(product_id=product.id).first()
                product.stock = stock.quantity if stock else 0
            else:
                product.stock = None  # No stock tracking needed
        
        category_products[category.name] = products
    
    return render_template('webshop/index.html', category_products=category_products)

@webshop.route('/api/products')
def get_products():
    """Get products for the webshop, only showing potes and excluding flavors"""
    try:
        # Get the helado category
        helado_category = ProductCategory.query.filter_by(name='Helado').first()
        print(f"Helado category: {helado_category}")
        
        if not helado_category:
            return jsonify({
                'status': 'error',
                'message': 'Helado category not found'
            }), 404

        # Query only pote products from the Helado category that are active
        products = Product.query.filter(
            Product.active == True,
            Product.category_id == helado_category.id,
            Product.sales_format.in_(['1/4 KG', '1/2 KG', '1 KG'])
        ).all()
        print(f"Found {len(products)} products")
        for product in products:
            print(f"Product: {product.name}, active: {product.active}, category: {product.category.name}, format: {product.sales_format}")

        # Format products for response
        products_data = []
        for product in products:
            # Get stock information
            stock = Stock.query.filter_by(product_id=product.id).first()
            stock_qty = stock.quantity if stock else 0

            product_data = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'category': product.category.name,
                'sales_format': product.sales_format,
                'stock': stock_qty,
                'is_pote': True,  # All products here are potes
                'max_flavors': POTE_CONFIGS.get(product.sales_format, {}).get('max_flavors')
            }
            products_data.append(product_data)

        print(f"Returning {len(products_data)} products")
        return jsonify({
            'status': 'success',
            'products': products_data
        })
    except Exception as e:
        print(f"Error in get_products: {str(e)}")  # Add debug print
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@webshop.route('/api/flavors', methods=['GET'])
def get_flavors():
    try:
        # Get all products in the Sabores category that are active
        flavors = Product.query.join(ProductCategory).filter(
            ProductCategory.name == 'Sabores',
            Product.active == True
        ).all()
        
        return jsonify([{
            'id': flavor.id,
            'name': flavor.name,
            'description': flavor.description
        } for flavor in flavors])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@webshop.route('/api/cart', methods=['GET'])
def get_cart():
    """Get current cart contents"""
    return jsonify({
        'status': 'success',
        'cart': session.get('webshop_cart', []),
        'total': session.get('webshop_cart_total', 0.0)
    })

@webshop.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        flavors = data.get('flavors', [])
        
        if not product_id:
            return jsonify({
                'status': 'error',
                'message': 'Product ID is required'
            }), 400
            
        product = Product.query.get(product_id)
        if not product:
            return jsonify({
                'status': 'error',
                'message': 'Product not found'
            }), 404
            
        # Initialize cart if it doesn't exist
        if 'webshop_cart' not in session:
            session['webshop_cart'] = []
            
        cart_item = {
            'id': str(uuid.uuid4()),
            'product_id': product_id,
            'name': product.name,
            'price': float(product.price),
            'quantity': quantity
        }
        
        # If flavors were selected, validate and add them
        if flavors:
            # Validate max_flavors
            if not product.max_flavors:
                return jsonify({
                    'status': 'error',
                    'message': 'This product does not support flavor selection'
                }), 400
                
            if len(flavors) > product.max_flavors:
                return jsonify({
                    'status': 'error',
                    'message': f'Maximum {product.max_flavors} flavors allowed'
                }), 400
                
            # Get flavor details
            flavor_products = Product.query.filter(Product.id.in_(flavors)).all()
            if len(flavor_products) != len(flavors):
                return jsonify({
                    'status': 'error',
                    'message': 'One or more flavors not found'
                }), 404
                
            cart_item['flavors'] = [{
                'id': str(f.id),
                'name': f.name
            } for f in flavor_products]
            
        session['webshop_cart'].append(cart_item)
        session['webshop_cart_total'] = sum(
            item['price'] * item['quantity'] 
            for item in session['webshop_cart']
        )
        session.modified = True
        
        return jsonify({
            'status': 'success',
            'message': 'Product added to cart'
        })
        
    except Exception as e:
        print(f"Error in add_to_cart: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@webshop.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    """Remove item from cart"""
    try:
        data = request.get_json()
        index = data.get('index')

        if index is None or index < 0 or index >= len(session['webshop_cart']):
            return jsonify({
                'status': 'error',
                'message': 'Invalid cart item index'
            }), 400

        session['webshop_cart'].pop(index)
        session['webshop_cart_total'] = sum(
            item['price'] * item['quantity'] 
            for item in session['webshop_cart']
        )
        session.modified = True

        return jsonify({
            'status': 'success',
            'cart': session['webshop_cart'],
            'total': session['webshop_cart_total']
        })

    except Exception as e:
        print(f"Error in remove_from_cart: {str(e)}")  # Add debug print
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@webshop.route('/api/cart/clear', methods=['POST'])
def clear_cart():
    """Clear the cart"""
    session['webshop_cart'] = []
    session['webshop_cart_total'] = 0.0
    session.modified = True
    return jsonify({'status': 'success'})

@webshop.route('/checkout', methods=['GET'])
def checkout():
    """Checkout page"""
    if not session.get('webshop_cart'):
        return redirect(url_for('webshop.index'))
    return render_template('webshop/checkout.html')

@webshop.route('/login', methods=['POST'])
def login():
    """Handle user login"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
    user = WebUser.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        # Create session data
        session['web_user_id'] = user.id
        session['web_user_email'] = user.email
        
        # Create response with user data
        response = jsonify({
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'address': user.address
        })
        
        # Set cookie that expires in 30 days
        response.set_cookie(
            'web_user_session',
            str(user.id),
            max_age=30*24*60*60,  # 30 days in seconds
            httponly=True,
            samesite='Strict'
        )
        
        return response
    
    return jsonify({'error': 'Email o contraseña incorrectos'}), 401

@webshop.route('/check-session', methods=['GET'])
def check_session():
    """Check if user has a valid session"""
    user_id = request.cookies.get('web_user_session')
    
    if user_id:
        user = WebUser.query.get(user_id)
        if user:
            return jsonify({
                'logged_in': True,
                'user': {
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'address': user.address,
                    'email': user.email
                }
            })
    
    return jsonify({'logged_in': False})

@webshop.route('/logout', methods=['POST'])
def logout():
    """Log out user"""
    session.pop('web_user_id', None)
    session.pop('web_user_email', None)
    
    response = jsonify({'status': 'success'})
    response.delete_cookie('web_user_session')
    
    return response

@webshop.route('/register', methods=['POST'])
def register():
    """Handle user registration"""
    data = request.get_json()
    
    try:
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Check if email already exists
        if WebUser.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Este email ya está registrado'}), 400
        
        # Create new user
        user = WebUser(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone']
        )
        
        user.set_password(data['password'])
        
        # Add optional fields if provided
        if data.get('address'):
            user.address = data['address']
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@webshop.route('/checkout', methods=['POST'])
def process_checkout():
    """Process checkout"""
    # Validate cart is not empty
    if not session.get('webshop_cart'):
        return jsonify({'error': 'El carrito está vacío'}), 400

    try:
        # Get form data
        checkout_type = request.form.get('checkoutType')
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        phone = request.form.get('phone')
        address = request.form.get('address')
        instructions = request.form.get('instructions', '')
        
        # Validate required fields
        if not all([first_name, last_name, phone, address]):
            return jsonify({'error': 'Por favor complete todos los campos requeridos'}), 400

        user_id = None
        # If user is registering, create account
        if checkout_type == 'register':
            email = request.form.get('email')
            password = request.form.get('password')
            
            # Validate registration fields
            if not all([email, password]):
                return jsonify({'error': 'Por favor complete todos los campos de registro'}), 400
            
            # Check if email already exists
            if WebUser.query.filter_by(email=email).first():
                return jsonify({'error': 'Este email ya está registrado'}), 400

            # Create new user
            user = WebUser(
                email=email,
                password_hash=generate_password_hash(password),
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                address=address
            )
            db.session.add(user)
            db.session.flush()  # Get the user ID without committing
            user_id = user.id

        # Create delivery address
        delivery_address = DeliveryAddress(
            customer_name=f"{first_name} {last_name}",
            phone=phone,
            address=address,
            notes=instructions
        )
        db.session.add(delivery_address)
        db.session.flush()  # Get the address ID without committing

        # Create sale
        sale = Sale(
            store_id=1,  # Set default store or get from configuration
            total_amount=session['webshop_cart_total'],
            created_at=datetime.utcnow(),
            payment_status='completed',
            payment_method='online',  # Default payment method
            is_delivery=True  # Since this is a webshop order
        )
        db.session.add(sale)
        db.session.flush()  # Get the sale ID without committing
        
        # Add sale items
        for item in session['webshop_cart']:
            sale_item = SaleItem(
                sale=sale,
                product_id=item['product_id'],
                quantity=item.get('quantity', 1),
                unit_price=item['price'],
                total_price=item['price'] * item.get('quantity', 1)
            )
            if 'flavors' in item:
                sale_item.set_flavors_list(item['flavors'])
            db.session.add(sale_item)

        # Create delivery order
        delivery = DeliveryOrder(
            sale=sale,
            address=delivery_address,
            current_status_id=1,  # Set initial status (e.g., "Pending")
            order_source='WEBSHOP',
            created_at=datetime.utcnow(),
            delivery_notes=f"Order #{generate_order_number()}"  # Store order number in notes
        )
        db.session.add(delivery)
        
        # Commit all changes
        db.session.commit()

        # Clear cart
        session['webshop_cart'] = []
        session['webshop_cart_total'] = 0
        
        return jsonify({
            'orderId': delivery.id,
            'orderNumber': delivery.delivery_notes.replace("Order #", "")  # Extract order number from notes
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@webshop.route('/order-confirmation/<int:order_id>')
def order_confirmation(order_id):
    """Order confirmation page"""
    # Get delivery order with related data
    delivery_order = DeliveryOrder.query.filter_by(id=order_id).first_or_404()
    
    # Get sale items
    sale_items = SaleItem.query.filter_by(sale_id=delivery_order.sale_id).all()
    
    return render_template('webshop/order-confirmation.html',
                         order=delivery_order,
                         sale_items=sale_items)
