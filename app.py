from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import text, inspect
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from routes.webshop import webshop
from routes.products import products_bp
from routes.web_users import web_users_bp
import os
import json
import random
from dotenv import load_dotenv
from functools import wraps
import qrcode
from io import BytesIO
import re
from sqlalchemy import or_, select, cast, String

print("Current working directory:", os.getcwd())
print("Loading environment variables...")
load_dotenv(verbose=True)
print("MERCADOPAGO_ACCESS_TOKEN present:", bool(os.getenv('MERCADOPAGO_ACCESS_TOKEN')))

# Import after loading environment variables
from mercadopago_integration import MercadoPagoIntegration
from extensions import db, migrate
from models import (
    Provider, ProviderCategory, Store, Production, ProductionCost,
    Stock, StockHistory, GeneralMinimum, ProductCategory, Product,
    Sale, SaleItem, Ingredient, Recipe, RecipeIngredient,
    IngredientTransaction, DeliveryAddress, DeliveryOrder, DeliveryStatus, DeliveryStatusHistory,
    ProductionOrder, ProductionOrderStatus, ProductionOrderHistory
)
from payment_routes import payment

app = Flask(__name__, static_url_path='/static', static_folder='static')
app.secret_key = os.urandom(24)  # Add this line to enable sessions
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///venezia.db?timeout=30'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=5)
app.config['GOOGLE_MAPS_API_KEY'] = os.environ.get('GOOGLE_MAPS_API_KEY', '')  # Add Google Maps API key

# Enable detailed error logging
app.config['PROPAGATE_EXCEPTIONS'] = True

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)

# Register blueprints
app.register_blueprint(payment, url_prefix='/payment')
app.register_blueprint(webshop)
app.register_blueprint(web_users_bp)
app.register_blueprint(products_bp)

FLAVORS = {
    'Dulce de Leche Clásico': 'DULCE',
    'Dulce de Leche Granizado': 'DDLGR',
    'Chocolate Amargo': 'CHOCM',
    'Chocolate Suizo': 'CHOCS',
    'Vainilla': 'VAINI',
    'Crema Americana': 'CREMA',
    'Frutilla a la Crema': 'FRUTI',
    'Banana Split': 'BANAN',
    'Limón': 'LIMON',
    'Frambuesa': 'FRAMB',
    'Durazno': 'DURAZ',
    'Naranja': 'NARAN',
    'Mango': 'MANGO',
    'Ananá (Piña)': 'ANANA',
    'Cereza': 'CEREZ',
    'Marroc': 'MARRO',
    'Sambayón': 'SAMBA',
    'Crema de Almendras': 'ALMEN',
    'Tramontana': 'TRAMO',
    'Coco': 'COCOC'
}

class ProductWithStock:
    def __init__(self, product, quantity=0, minimum=0):
        self.id = product.id
        self.name = product.name
        self.sales_format = product.sales_format
        self.category = product.category
        self.quantity = quantity
        self.minimum = minimum

def init_db():
    with app.app_context():
        inspector = inspect(db.engine)
        
        # Check if products table exists and has required columns
        if 'products' in inspector.get_table_names():
            product_columns = [col['name'] for col in inspector.get_columns('products')]
            
            # Add missing columns if they don't exist
            with db.engine.connect() as connection:
                if 'weight_kg' not in product_columns:
                    connection.execute(text("ALTER TABLE products ADD COLUMN weight_kg FLOAT"))
                if 'active' not in product_columns:
                    connection.execute(text("ALTER TABLE products ADD COLUMN active BOOLEAN DEFAULT 1"))
                if 'track_stock' not in product_columns:
                    connection.execute(text("ALTER TABLE products ADD COLUMN track_stock BOOLEAN DEFAULT 1"))
                if 'sales_format' not in product_columns:
                    connection.execute(text("ALTER TABLE products ADD COLUMN sales_format VARCHAR(50)"))
                connection.commit()
        
        db.create_all()
        
        # Initialize production order statuses if they don't exist
        production_statuses = [
            ('Pedido', 'Orden de producción creada', '#6c757d', 1),  # Gray
            ('En Proceso', 'Orden en proceso de producción', '#ffc107', 2),  # Yellow
            ('Completado', 'Orden completada', '#28a745', 3),  # Green
            ('Cancelado', 'Orden cancelada', '#dc3545', 4)  # Red
        ]
        
        for name, description, color_code, order in production_statuses:
            if not ProductionOrderStatus.query.filter_by(name=name).first():
                status = ProductionOrderStatus(
                    name=name,
                    description=description,
                    color_code=color_code,
                    order=order
                )
                db.session.add(status)
        db.session.commit()
        
        # Create stores if they don't exist
        if not Store.query.first():
            stores = [
                Store(name='Tienda Principal', address='Dirección Principal', phone='555-0001', email='principal@venezia.com'),
                Store(name='Sucursal Centro', address='Dirección Centro', phone='555-0002', email='centro@venezia.com'),
                Store(name='Sucursal Norte', address='Dirección Norte', phone='555-0003', email='norte@venezia.com'),
                Store(name='Sucursal Sur', address='Dirección Sur', phone='555-0004', email='sur@venezia.com')
            ]
            db.session.add_all(stores)
            db.session.commit()
        
        # Clean up duplicate categories first
        ProductCategory.query.filter(ProductCategory.name.in_(['Postres helados', 'Productos envasados'])).delete()
        db.session.commit()
        
        # Define categories
        categories = [
            ('Sabores', 'Sabores de helado disponibles para producción y venta'),
            ('Postres Helados', 'Postres helados especiales'),
            ('Productos Envasados', 'Productos envasados para llevar'),
            ('Presentaciones', 'Formatos de venta (pote 1/4 kg, etc.)')
        ]
        
        # Create or update categories
        category_dict = {}
        for name, description in categories:
            category = ProductCategory.query.filter_by(name=name).first()
            if not category:
                category = ProductCategory(name=name, description=description)
                db.session.add(category)
            category_dict[name] = category
        db.session.commit()
        
        # Add all flavors as products with stock tracking
        for flavor_name in FLAVORS:
            product = Product.query.filter_by(name=flavor_name).first()
            if not product:
                product = Product(
                    name=flavor_name,
                    category_id=category_dict['Sabores'].id,
                    price=0,  # Price will be set in sales presentations
                    description=f'Helado sabor {flavor_name}',
                    sales_format='KG'
                )
                db.session.add(product)
            else:
                # Update existing products
                product.category_id = category_dict['Sabores'].id
        
        # Update other products' track_stock status
        products_to_track = Product.query.filter(
            Product.category_id.in_([
                category_dict['Postres Helados'].id,
                category_dict['Productos Envasados'].id
            ])
        ).all()
        
        db.session.commit()
        
        # Initialize stock for tracked products
        stores = Store.query.all()
        tracked_products = Product.query.all()  # Track all products
        
        for store in stores:
            for product in tracked_products:
                stock = Stock.query.filter_by(store_id=store.id, product_id=product.id).first()
                if not stock:
                    # Set higher initial stock and minimum for main store
                    if store.name == 'Tienda Principal':
                        initial_stock = 10.0
                    else:
                        initial_stock = 5.0
                    
                    stock = Stock(
                        store_id=store.id,
                        product_id=product.id,
                        quantity=initial_stock
                    )
                    db.session.add(stock)
                    
                    # Add stock history entry
                    history = StockHistory(
                        store_id=store.id,
                        product_id=product.id,
                        quantity_change=initial_stock,
                        reason='Inicialización de stock'
                    )
                    db.session.add(history)
        
        db.session.commit()
        
        # Initialize delivery statuses if they don't exist
        if not DeliveryStatus.query.first():
            statuses = [
                DeliveryStatus(name='Pendiente', color_code='#FFA500', order=1),  # Orange
                DeliveryStatus(name='En Preparación', color_code='#4169E1', order=2),  # Royal Blue
                DeliveryStatus(name='En Camino', color_code='#32CD32', order=3),  # Lime Green
                DeliveryStatus(name='Entregado', color_code='#228B22', order=4),  # Forest Green
                DeliveryStatus(name='Cancelado', color_code='#DC143C', order=5)   # Crimson
            ]
            db.session.add_all(statuses)
            db.session.commit()

@app.route('/')
def index():
    total_production = db.session.query(db.func.sum(Production.quantity)).scalar() or 0
    total_stores = Store.query.count()
    total_flavors = len(FLAVORS)
    low_stock_count = Stock.query.join(GeneralMinimum, Stock.product_id == GeneralMinimum.product_id).filter(Stock.quantity <= GeneralMinimum.quantity).count()
    
    recent_productions = Production.query.order_by(Production.production_date.desc()).limit(5).all()
    
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_production = db.session.query(
        db.func.date(Production.production_date).label('date'),
        db.func.sum(Production.quantity).label('total')
    ).filter(Production.production_date >= seven_days_ago)\
     .group_by(db.func.date(Production.production_date))\
     .order_by(db.func.date(Production.production_date))\
     .all()
    
    stock_overview = db.session.query(
        Stock.product_id,
        db.func.sum(Stock.quantity).label('total_quantity'),
        db.func.sum(GeneralMinimum.quantity).label('total_minimum')
    ).join(GeneralMinimum, Stock.product_id == GeneralMinimum.product_id)\
     .group_by(Stock.product_id).all()
    
    store_stats = db.session.query(
        Store.name,
        db.func.count(Stock.id).label('flavors_count'),
        db.func.sum(Stock.quantity).label('total_stock')
    ).join(Stock).group_by(Store.id).all()
    
    low_stock_alerts = db.session.query(
        Store.name.label('name'),
        Product.name.label('flavor'),
        Stock.quantity.label('current_quantity'),
        GeneralMinimum.quantity.label('minimum_quantity')
    ).join(Store)\
     .join(Product, Stock.product_id == Product.id)\
     .join(GeneralMinimum, Stock.product_id == GeneralMinimum.product_id)\
     .filter(Stock.quantity <= GeneralMinimum.quantity)\
     .order_by(Store.name)\
     .all()

    return render_template('index.html',
                         total_production=total_production,
                         total_stores=total_stores,
                         total_flavors=total_flavors,
                         low_stock_count=low_stock_count,
                         recent_productions=recent_productions,
                         daily_production=daily_production,
                         stock_overview=stock_overview,
                         store_stats=store_stats,
                         low_stock_alerts=low_stock_alerts)

@app.route('/production')
def production():
    productions = Production.query.order_by(Production.production_date.desc()).all()
    return render_template('production.html', productions=productions)

@app.route('/add_production', methods=['GET', 'POST'])
def add_production():
    if request.method == 'POST':
        flavor = request.form['flavor']
        quantity = float(request.form['quantity'])
        notes = request.form['notes']
        operator = request.form['operator']
        
        batch_number = Production.generate_batch_number(flavor)

        # Get recipe for the selected flavor by joining with Product
        recipe = db.session.scalar(
            db.select(Recipe)
            .join(Recipe.product)
            .filter(Product.name == flavor)
            .filter(Recipe.type == 'flavor')
        )
        
        production_cost = 0
        if recipe:
            # Calculate production cost based on quantity and recipe
            for ingredient in recipe.ingredients:
                ingredient_cost = ingredient.ingredient.cost_per_unit * ingredient.quantity * quantity
                production_cost += ingredient_cost

        production = Production(
            flavor=flavor,
            quantity=quantity,
            batch_number=batch_number,
            notes=notes,
            operator=operator,
            production_cost=production_cost
        )

        try:
            db.session.add(production)
            db.session.commit()
            flash('Producción registrada exitosamente', 'success')
            return redirect(url_for('production'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al registrar la producción: {str(e)}', 'danger')
            return redirect(url_for('add_production'))

    # For GET request, prepare recipe data
    recipes_data = {}
    recipes = db.session.scalars(
        db.select(Recipe)
        .join(Recipe.product)
        .filter(Recipe.type == 'flavor')
    ).all()
    
    for recipe in recipes:
        ingredients_data = []
        for ri in recipe.ingredients:
            ingredients_data.append({
                'name': ri.ingredient.name,
                'quantity': ri.quantity,
                'unit': ri.ingredient.unit,
                'cost': ri.ingredient.cost_per_unit
            })
        recipes_data[recipe.product.name] = {
            'ingredients': ingredients_data
        }

    return render_template('add_production.html', 
                         flavors=FLAVORS.keys(),
                         recipes=recipes_data)

@app.route('/finish_production/<int:production_id>', methods=['POST'])
def finish_production(production_id):
    try:
        production = Production.query.get_or_404(production_id)
        
        if production.end_time:
            return jsonify({'success': False, 'error': 'Esta producción ya está finalizada'})
            
        if production.assigned_store_id:
            return jsonify({'success': False, 'error': 'Esta producción ya está asignada'})

        # Get or create the product for this flavor
        product_category = ProductCategory.query.filter_by(name='Sabores').first()
        if not product_category:
            product_category = ProductCategory(name='Sabores', description='Sabores de helado')
            db.session.add(product_category)
            db.session.commit()
            
        product = Product.query.filter_by(
            name=production.flavor,
            category_id=product_category.id
        ).first()
        
        if not product:
            product = Product(
                name=production.flavor,
                category_id=product_category.id,
                price=0,
                description=f'Helado sabor {production.flavor}',
                sales_format='KG'
            )
            db.session.add(product)
            db.session.commit()
        
        # Add stock to main store
        main_store = Store.query.filter_by(name='Tienda Principal').first()
        if not main_store:
            return jsonify({'success': False, 'error': 'No se encontró la tienda principal'})
        
        # Get or create stock record
        stock = Stock.query.filter_by(
            store_id=main_store.id,
            product_id=product.id
        ).first()
        
        if stock:
            stock.quantity += production.quantity
        else:
            stock = Stock(
                store_id=main_store.id,
                product_id=product.id,
                quantity=production.quantity
            )
            db.session.add(stock)
        
        # Create stock history record
        stock_history = StockHistory(
            store_id=main_store.id,
            product_id=product.id,
            quantity_change=production.quantity,
            reason=f'Producción completada - Lote {production.batch_number}'
        )
        db.session.add(stock_history)

        # Update production record
        production.end_time = datetime.utcnow()
        production.success_status = 'success'
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/stores')
def stores():
    stores = Store.query.all()
    stores_data = []
    
    # For each store, prepare display data
    for store in stores:
        store_data = {
            'id': store.id,
            'name': store.name,
            'address': store.address,
            'latitude': store.latitude,
            'longitude': store.longitude,
            'stocks': []
        }
        
        # Sort stocks by quantity and get top 10
        sorted_stocks = sorted(store.stocks, key=lambda x: x.quantity)[:10]
        
        for stock in sorted_stocks:
            # Get minimum stock
            min_stock = GeneralMinimum.query.filter_by(product_id=stock.product_id).first()
            minimum = min_stock.quantity if min_stock else 0
            
            # Get product name
            product = Product.query.get(stock.product_id)
            flavor = product.name if product else "Desconocido"
            
            stock_data = {
                'id': stock.id,
                'flavor': flavor,
                'quantity': stock.quantity,
                'minimum': minimum,
                'product_id': stock.product_id
            }
            store_data['stocks'].append(stock_data)
        
        stores_data.append(store_data)
    
    return render_template('stores.html', stores=stores_data)

@app.route('/assign_batch', methods=['GET', 'POST'])
def assign_batch():
    if request.method == 'GET':
        stores = Store.query.all()
        # Get completed production orders (status_id = 3 for 'terminado')
        completed_orders = ProductionOrder.query.filter_by(status_id=3).order_by(ProductionOrder.updated_at.desc()).all()
        
        return render_template('assign_batch.html', stores=stores, completed_orders=completed_orders)
        
    try:
        batch_number = request.form.get('batch_number')
        target_store_id = request.form.get('store_id')
        quantity = float(request.form.get('quantity', 0))
        
        if not batch_number or not target_store_id or not quantity:
            return jsonify({'success': False, 'error': 'Faltan datos requeridos'})
        
        # Get the production record
        production = Production.query.filter_by(batch_number=batch_number).first()
        if not production:
            return jsonify({'success': False, 'error': 'Número de lote inválido'})
            
        if production.assigned_store_id is not None:
            return jsonify({'success': False, 'error': 'Este lote ya ha sido asignado'})

        # Get source and target stores
        main_store = Store.query.filter_by(name='Tienda Principal').first()
        target_store = Store.query.get(target_store_id)
        
        if not main_store or not target_store:
            return jsonify({'success': False, 'error': 'Tienda no encontrada'})
            
        # Find the product
        product_category = ProductCategory.query.filter_by(name='Sabores').first()
        if not product_category:
            return jsonify({'success': False, 'error': 'No se encontró la categoría de sabores'})
        
        product = Product.query.filter_by(
            name=production.flavor,
            category_id=product_category.id
        ).first()
        
        if not product:
            return jsonify({'success': False, 'error': f'No se encontró el producto para el sabor {production.flavor}'})
        
        # Get source and target stock records
        source_stock = Stock.query.filter_by(
            store_id=main_store.id,
            product_id=product.id
        ).first()
        
        target_stock = Stock.query.filter_by(
            store_id=target_store.id,
            product_id=product.id
        ).first()
        
        # If target store is the same as source store, we don't need to check stock
        if main_store.id != target_store.id and (not source_stock or source_stock.quantity < quantity):
            return jsonify({'success': False, 'error': 'Stock insuficiente en tienda principal'})
            
        # Update stock only if it's not a self-transfer
        if main_store.id != target_store.id:
            # Update source stock
            if not source_stock:
                source_stock = Stock(
                    store_id=main_store.id,
                    product_id=product.id,
                    quantity=0
                )
                db.session.add(source_stock)
            source_stock.quantity -= quantity
        
            # Update or create target stock
            if target_stock:
                target_stock.quantity += quantity
            else:
                target_stock = Stock(
                    store_id=target_store.id,
                    product_id=product.id,
                    quantity=quantity
                )
                db.session.add(target_stock)
        else:
            # For self-transfers, update or create the stock record
            if not source_stock:
                source_stock = Stock(
                    store_id=main_store.id,
                    product_id=product.id,
                    quantity=quantity
                )
                db.session.add(source_stock)
            else:
                source_stock.quantity += quantity
        
        # Create stock history records
        if main_store.id != target_store_id:
            source_history = StockHistory(
                store_id=main_store.id,
                product_id=product.id,
                quantity_change=-quantity,
                reason=f'Transferencia a {target_store.name} - Lote {production.batch_number}'
            )
            
            target_history = StockHistory(
                store_id=target_store_id,
                product_id=product.id,
                quantity_change=quantity,
                reason=f'Transferencia desde Tienda Principal - Lote {production.batch_number}'
            )
            
            db.session.add(source_history)
            db.session.add(target_history)
        else:
            # For self-transfers, just record it as a production assignment
            source_history = StockHistory(
                store_id=main_store.id,
                product_id=product.id,
                quantity_change=quantity,
                reason=f'Asignación de producción - Lote {production.batch_number}'
            )
            db.session.add(source_history)
        
        # Update production record with assignment details
        production.assigned_store_id = target_store.id
        production.assigned_at = datetime.utcnow()
        
        try:
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'Error al guardar los cambios'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/add_store', methods=['GET', 'POST'])
def add_store():
    if request.method == 'POST':
        name = request.form['name']
        address = request.form['address']
        latitude = request.form.get('latitude', type=float)
        longitude = request.form.get('longitude', type=float)
        
        store = Store(
            name=name, 
            address=address,
            latitude=latitude if latitude else -34.6037,  # Default to Buenos Aires
            longitude=longitude if longitude else -58.3816
        )
        db.session.add(store)
        db.session.commit()
        
        for flavor in FLAVORS:
            main_stock = Stock.query.filter_by(
                store_id=1,
                product_id=1
            ).first()
                
            stock = Stock(
                store_id=store.id,
                product_id=1,
                minimum_quantity=main_stock.minimum_quantity if main_stock else 10.0
            )
            db.session.add(stock)
        db.session.commit()
        flash('Tienda agregada exitosamente', 'success')
        return redirect(url_for('stores'))
    
    return render_template('add_store.html')

@app.route('/edit_store_stock', defaults={'store_id': None})
@app.route('/edit_store_stock/<int:store_id>', methods=['GET', 'POST'])
def edit_store_stock(store_id):
    if store_id is None:
        # Show store selection
        stores = Store.query.all()
        return render_template('edit_stock.html',
                            stores=stores,
                            show_store_selection=True)

    store = Store.query.get_or_404(store_id)
    
    if request.method == 'POST':
        product_id = request.form.get('product_id')
        new_quantity = request.form.get('quantity')
        new_minimum = request.form.get('minimum')
        notes = request.form.get('notes', '')
        
        if product_id and new_quantity:
            try:
                new_quantity = float(new_quantity)
                stock = Stock.query.filter_by(store_id=store_id, product_id=product_id).first()
                
                if stock:
                    old_quantity = stock.quantity
                    stock.quantity = new_quantity
                    
                    # Create stock history record
                    quantity_change = new_quantity - old_quantity
                    stock_history = StockHistory(
                        store_id=store_id,
                        product_id=product_id,
                        quantity_change=quantity_change,
                        reason=notes
                    )
                    db.session.add(stock_history)
                else:
                    stock = Stock(
                        store_id=store_id,
                        product_id=product_id,
                        quantity=new_quantity
                    )
                    db.session.add(stock)
                    
                    # Create stock history record for new stock
                    stock_history = StockHistory(
                        store_id=store_id,
                        product_id=product_id,
                        quantity_change=new_quantity,
                        reason=notes
                    )
                    db.session.add(stock_history)
                
                # Update minimum stock if provided
                if new_minimum:
                    try:
                        new_minimum = float(new_minimum)
                        min_stock = GeneralMinimum.query.filter_by(product_id=product_id).first()
                        if min_stock:
                            min_stock.quantity = new_minimum
                        else:
                            min_stock = GeneralMinimum(
                                product_id=product_id,
                                quantity=new_minimum
                            )
                            db.session.add(min_stock)
                    except ValueError:
                        flash('Por favor ingrese un stock mínimo válido', 'error')
                        return redirect(url_for('edit_store_stock', store_id=store_id))
                
                db.session.commit()
                flash('Stock actualizado exitosamente', 'success')
            except ValueError:
                flash('Por favor ingrese cantidades válidas', 'error')
        else:
            flash('Por favor complete todos los campos', 'error')
            
        return redirect(url_for('edit_store_stock', store_id=store_id))
    
    # Get all products except sales presentations
    products = Product.query.join(
        ProductCategory, Product.category_id == ProductCategory.id
    ).filter(
        ProductCategory.name.in_(['Sabores', 'Postres Helados', 'Productos Envasados']),
        Product.active == True
    ).all()

    # Organize products by category and add stock information
    category_products = {}
    products_with_stock = []
    for product in products:
        category_name = product.category.name
        if category_name not in category_products:
            category_products[category_name] = []
            
        # Get stock info for this product in this store
        stock = Stock.query.filter_by(store_id=store_id, product_id=product.id).first()
        min_stock = GeneralMinimum.query.filter_by(product_id=product.id).first()
        
        # Create ProductWithStock instance
        product_with_stock = ProductWithStock(
            product=product,
            quantity=stock.quantity if stock else 0,
            minimum=min_stock.quantity if min_stock else 0
        )
        
        category_products[category_name].append(product_with_stock)
        products_with_stock.append(product_with_stock)

    return render_template('edit_stock.html',
                         store=store,
                         stores=Store.query.all(),
                         category_products=category_products,
                         products=products_with_stock,
                         category_name=request.args.get('category', 'Sabores'),
                         show_store_selection=False)

@app.route('/edit_production/<int:production_id>', methods=['GET', 'POST'])
def edit_production(production_id):
    production = Production.query.get_or_404(production_id)
    
    if request.method == 'POST':
        production.flavor = request.form['flavor']
        production.quantity = float(request.form['quantity'])
        production.production_date = datetime.strptime(request.form['production_date'], '%Y-%m-%dT%H:%M')
        production.notes = request.form['notes']
        
        try:
            db.session.commit()
            flash('Registro de producción actualizado exitosamente', 'success')
            return redirect(url_for('production'))
        except Exception as e:
            flash('Error al actualizar el registro de producción', 'error')
            return redirect(url_for('edit_production', production_id=production_id))
    
    return render_template('edit_production.html', production=production, flavors=FLAVORS.keys())

@app.route('/production/<int:production_id>', methods=['DELETE'])
def delete_production(production_id):
    try:
        production = Production.query.get_or_404(production_id)
        db.session.delete(production)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/reports')
def reports():
    stores = Store.query.all()
    flavors = get_available_flavors()
    
    # Get content from stock analytics and production analytics pages
    with app.test_request_context():
        stock_analytics_content = render_template('_stock_analytics.html')
        production_analytics_content = render_template('_production_analytics.html')
    
    return render_template('reports.html', 
                         stores=stores, 
                         flavors=flavors,
                         stock_analytics_content=stock_analytics_content,
                         production_analytics_content=production_analytics_content)

@app.route('/api/sales_data', methods=['GET'])
def sales_data():
    try:
        print("Starting sales_data endpoint...")
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        store_id = request.args.get('store_id')
        payment_method = request.args.get('payment_method')
        payment_status = request.args.get('payment_status')

        print(f"Query params: start_date={start_date_str}, end_date={end_date_str}")

        # Parse dates
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)

        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)

        print(f"Parsed dates: start_date={start_date}, end_date={end_date}")
        
        # Build summary query with joins
        summary_query = db.session.query(
            db.func.count(Sale.id).label('total_sales'),
            db.func.sum(Sale.total_amount).label('total_amount')
        ).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        )

        # Build delivery count query
        delivery_query = db.session.query(
            db.func.count(Sale.id).label('delivery_count')
        ).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.is_delivery == True
        )

        # Apply filters to summary query
        if store_id:
            summary_query = summary_query.filter(Sale.store_id == store_id)
            delivery_query = delivery_query.filter(Sale.store_id == store_id)
        if payment_method:
            summary_query = summary_query.filter(Sale.payment_method == payment_method)
            delivery_query = delivery_query.filter(Sale.payment_method == payment_method)
        if payment_status:
            summary_query = summary_query.filter(Sale.payment_status == payment_status)
            delivery_query = delivery_query.filter(Sale.payment_status == payment_status)

        # Execute summary query
        summary_result = summary_query.first()
        delivery_result = delivery_query.first()
        print(f"Query results: summary={summary_result}, delivery={delivery_result}")
        
        total_sales = summary_result.total_sales or 0
        total_amount = float(summary_result.total_amount or 0)
        delivery_count = delivery_result.delivery_count or 0
        avg_sale = round(total_amount / total_sales, 2) if total_sales > 0 else 0

        # Build sales by day query
        sales_by_day_query = db.session.query(
            cast(db.func.date(Sale.created_at), String).label('date'),
            db.func.count(Sale.id).label('count'),
            db.func.sum(Sale.total_amount).label('amount')
        ).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        ).group_by(
            cast(db.func.date(Sale.created_at), String)
        ).order_by(cast(db.func.date(Sale.created_at), String))

        # Apply filters to sales by day query
        if store_id:
            sales_by_day_query = sales_by_day_query.filter(Sale.store_id == store_id)
        if payment_method:
            sales_by_day_query = sales_by_day_query.filter(Sale.payment_method == payment_method)
        if payment_status:
            sales_by_day_query = sales_by_day_query.filter(Sale.payment_status == payment_status)

        # Execute sales by day query and format results
        sales_by_day = {}
        current_date = start_date.date()
        end_date_only = end_date.date()
        while current_date <= end_date_only:
            date_str = current_date.strftime('%Y-%m-%d')
            sales_by_day[date_str] = {
                'count': 0,
                'amount': 0
            }
            current_date += timedelta(days=1)

        for result in sales_by_day_query.all():
            sales_by_day[result.date] = {
                'count': result.count,
                'amount': float(result.amount or 0)
            }

        # Build payment methods query
        payment_methods_query = db.session.query(
            Sale.payment_method,
            db.func.count(Sale.id).label('count'),
            db.func.sum(Sale.total_amount).label('amount')
        ).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        ).group_by(
            Sale.payment_method
        )

        # Apply filters to payment methods query
        if store_id:
            payment_methods_query = payment_methods_query.filter(Sale.store_id == store_id)
        if payment_method:
            payment_methods_query = payment_methods_query.filter(Sale.payment_method == payment_method)
        if payment_status:
            payment_methods_query = payment_methods_query.filter(Sale.payment_status == payment_status)

        # Execute payment methods query and format results
        payment_methods = {
            'cash': {'count': 0, 'amount': 0},
            'card': {'count': 0, 'amount': 0},
            'transfer': {'count': 0, 'amount': 0},
            'mercadopago': {'count': 0, 'amount': 0}
        }

        for result in payment_methods_query.all():
            method = result.payment_method or 'unknown'
            if method in payment_methods:
                payment_methods[method] = {
                    'count': result.count,
                    'amount': float(result.amount or 0)
                }

        # Build detailed sales query with joins
        sales_query = db.session.query(Sale).options(
            joinedload(Sale.store),
            joinedload(Sale.sale_items).joinedload(SaleItem.product)
        ).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date
        ).order_by(Sale.created_at.desc())

        # Apply filters to sales query
        if store_id:
            sales_query = sales_query.filter(Sale.store_id == store_id)
        if payment_method:
            sales_query = sales_query.filter(Sale.payment_method == payment_method)
        if payment_status:
            sales_query = sales_query.filter(Sale.payment_status == payment_status)

        # Paginate sales query
        sales_paginated = sales_query.paginate(page=page, per_page=per_page, error_out=False)
        
        print(f"Paginated sales: {sales_paginated}")
        
        # Format sales data
        sales_data = []
        for sale in sales_paginated.items:
            items_data = [{
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price': float(item.unit_price),
                'subtotal': float(item.total_price),
                'flavors': item.get_flavors_list() if item.flavors else []
            } for item in sale.sale_items]
            
            sales_data.append({
                'id': sale.id,
                'date': sale.created_at.strftime('%Y-%m-%d %H:%M'),
                'store': sale.store.name if sale.store else 'Unknown',
                'total': sale.total_amount,
                'payment_method': sale.payment_method,
                'payment_status': sale.payment_status,
                'is_delivery': bool(sale.is_delivery),
                'items': items_data
            })

        # Prepare response data
        response = {
            'summary': {
                'total_sales': total_sales,
                'total_amount': round(total_amount, 2),
                'average_sale': round(avg_sale, 2),
                'delivery_count': delivery_count,
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d')
                }
            },
            'charts': {
                'sales_by_day': sales_by_day,
                'payment_methods': payment_methods
            },
            'sales': sales_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_pages': sales_paginated.pages,
                'total_items': sales_paginated.total
            }
        }

        print("Returning response")
        return jsonify(response)

    except Exception as e:
        print(f"Error in sales_data: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/stock_analytics')
def stock_analytics():
    selected_store_id = request.args.get('store_id', type=int)
    selected_product_id = request.args.get('product_id', type=int)
    days = request.args.get('days', 30, type=int)
    
    stores = Store.query.all()
    from_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query for daily changes
    query = db.session.query(
        StockHistory.timestamp,
        db.func.sum(StockHistory.quantity_change).label('quantity_change')
    )
    
    if selected_store_id:
        query = query.filter(StockHistory.store_id == selected_store_id)
    if selected_product_id:
        query = query.filter(StockHistory.product_id == selected_product_id)
    
    daily_changes = query.filter(
        StockHistory.timestamp >= from_date
    ).group_by(
        db.func.date(StockHistory.timestamp)
    ).order_by(StockHistory.timestamp).all()
    
    # Get depletion rates
    depletion_query = db.session.query(
        StockHistory.store_id,
        StockHistory.product_id,
        Store.name.label('store_name'),
        Product.name.label('product'),
        db.func.avg(StockHistory.quantity_change).label('avg_change')
    ).join(Store).join(Product).filter(
        StockHistory.reason == 'sale'
    )
    
    if selected_store_id:
        depletion_query = depletion_query.filter(StockHistory.store_id == selected_store_id)
    if selected_product_id:
        depletion_query = depletion_query.filter(StockHistory.product_id == selected_product_id)
    
    depletion_rates = depletion_query.group_by(
        StockHistory.store_id,
        StockHistory.product_id
    ).all()
    
    # Process depletion rates to include absolute values
    processed_depletion_rates = []
    for rate in depletion_rates:
        processed_depletion_rates.append({
            'store_id': rate.store_id,
            'product_id': rate.product_id,
            'store_name': rate.store_name,
            'product': rate.product,
            'avg_change': rate.avg_change,
            'abs_change': abs(rate.avg_change) if rate.avg_change else 0
        })
    
    # Get current stock and predictions
    current_stock = Stock.query.all()
    stock_predictions = []
    for stock in current_stock:
        depletion_rate = next(
            (r.avg_change for r in depletion_rates 
             if r.store_id == stock.store_id and r.product_id == stock.product_id),
            0
        )
        if depletion_rate < 0:
            days_until_empty = abs(stock.quantity / depletion_rate) if depletion_rate else float('inf')
            stock_predictions.append({
                'store_id': stock.store_id,
                'store_name': stock.store.name,
                'product': stock.product.name,
                'current_quantity': stock.quantity,
                'days_until_empty': days_until_empty,
                'predicted_date': datetime.utcnow() + timedelta(days=days_until_empty)
            })
    
    return render_template('stock_analytics.html',
                         stores=stores,
                         selected_store_id=selected_store_id,
                         selected_product_id=selected_product_id,
                         days=days,
                         daily_changes=daily_changes,
                         depletion_rates=processed_depletion_rates,
                         stock_predictions=sorted(stock_predictions, key=lambda x: x['days_until_empty'])[:10],
                         products=Product.query.filter_by(track_stock=True).all())

@app.route('/production_analytics')
def production_analytics():
    days = request.args.get('days', 30, type=int)
    from_date = datetime.utcnow() - timedelta(days=days)
    
    flavor_production = db.session.query(
        Production.flavor,
        db.func.sum(Production.quantity).label('total_quantity'),
        db.func.count(Production.id).label('batch_count')
    ).filter(
        Production.production_date >= from_date
    ).group_by(
        Production.flavor
    ).order_by(
        db.desc('total_quantity')
    ).all()
    
    seasonal_production = db.session.query(
        Production.flavor,
        db.func.strftime('%m', Production.production_date).label('month'),
        db.func.sum(Production.quantity).label('quantity')
    ).filter(
        Production.production_date >= datetime.utcnow() - timedelta(days=365)
    ).group_by(
        Production.flavor,
        db.func.strftime('%m', Production.production_date)
    ).all()
    
    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    seasonal_data = {}
    for prod in seasonal_production:
        if prod.flavor not in seasonal_data:
            seasonal_data[prod.flavor] = {m: 0 for m in months}
        seasonal_data[prod.flavor][prod.month] = float(prod.quantity)
    
    daily_production = db.session.query(
        db.func.date(Production.production_date).label('date'),
        db.func.sum(Production.quantity).label('quantity')
    ).filter(
        Production.production_date >= from_date
    ).group_by(
        db.func.date(Production.production_date)
    ).order_by(db.func.date(Production.production_date)).all()
    
    productions_by_date = db.session.query(
        db.func.date(Production.production_date).label('date'),
        Production.flavor
    ).filter(
        Production.production_date >= from_date
    ).order_by(db.func.date(Production.production_date)).all()
    
    date_flavors = {}
    for prod in productions_by_date:
        if prod.date not in date_flavors:
            date_flavors[prod.date] = []
        date_flavors[prod.date].append(prod.flavor)
    
    flavor_combinations = {}
    for date, flavors in date_flavors.items():
        for i in range(len(flavors)):
            for j in range(i + 1, len(flavors)):
                combo = tuple(sorted([flavors[i], flavors[j]]))
                flavor_combinations[combo] = flavor_combinations.get(combo, 0) + 1
    
    top_combinations = sorted(
        [{'flavors': list(k), 'count': v} for k, v in flavor_combinations.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:10]
    
    return render_template('production_analytics.html',
                         days=days,
                         flavor_production=flavor_production,
                         seasonal_data=seasonal_data,
                         daily_production=daily_production,
                         top_combinations=top_combinations)

@app.route('/efficiency_metrics')
def efficiency_metrics():
    days = request.args.get('days', 30, type=int)
    from_date = datetime.utcnow() - timedelta(days=days)
    
    production_times = db.session.query(
        Production.flavor,
        db.func.avg(db.func.strftime('%s', Production.end_time) - 
                   db.func.strftime('%s', Production.start_time)).label('avg_time'),
        db.func.count(Production.id).label('batch_count'),
        db.func.avg(Production.quantity).label('avg_quantity')
    ).filter(
        Production.start_time >= from_date,
        Production.end_time.isnot(None)
    ).group_by(
        Production.flavor
    ).all()
    
    quality_metrics = db.session.query(
        Production.flavor,
        db.func.avg(Production.quality_score).label('avg_quality'),
        db.func.sum(Production.waste_quantity).label('total_waste'),
        db.func.avg(Production.waste_quantity).label('avg_waste')
    ).filter(
        Production.production_date >= from_date
    ).group_by(
        Production.flavor
    ).all()
    
    cost_analysis = db.session.query(
        Production.flavor,
        db.func.avg(Production.cost).label('avg_cost'),
        db.func.sum(Production.cost).label('total_cost'),
        db.func.sum(Production.quantity).label('total_quantity')
    ).filter(
        Production.production_date >= from_date,
        Production.cost.isnot(None)
    ).group_by(
        Production.flavor
    ).all()
    
    cost_metrics = []
    for cost in cost_analysis:
        if cost.total_quantity and cost.total_quantity > 0:
            cost_per_kg = cost.total_cost / cost.total_quantity
            cost_metrics.append({
                'flavor': cost.flavor,
                'avg_cost': cost.avg_cost,
                'total_cost': cost.total_cost,
                'cost_per_kg': cost_per_kg
            })
    
    ingredient_costs = db.session.query(
        ProductionCost.ingredient,
        db.func.sum(ProductionCost.total_cost).label('total_cost'),
        db.func.avg(ProductionCost.unit_cost).label('avg_unit_cost')
    ).filter(
        ProductionCost.date >= from_date
    ).group_by(
        ProductionCost.ingredient
    ).order_by(
        db.desc('total_cost')
    ).all()
    
    daily_efficiency = db.session.query(
        db.func.date(Production.production_date).label('date'),
        db.func.avg(Production.quantity / (
            db.func.strftime('%s', Production.end_time) - 
            db.func.strftime('%s', Production.start_time) / 3600
        )).label('kg_per_hour')
    ).filter(
        Production.production_date >= from_date,
        Production.start_time.isnot(None),
        Production.end_time.isnot(None)
    ).group_by(
        db.func.date(Production.production_date)
    ).order_by(db.func.date(Production.production_date)).all()
    
    return render_template('efficiency_metrics.html',
                         days=days,
                         production_times=production_times,
                         quality_metrics=quality_metrics,
                         cost_metrics=cost_metrics,
                         ingredient_costs=ingredient_costs,
                         daily_efficiency=daily_production)

@app.route('/efficiency_dashboard')
def efficiency_dashboard():
    productions = Production.query.filter(
        Production.end_time.isnot(None)
    ).order_by(Production.end_time.desc()).all()
    
    total_productions = len(productions)
    success_rate = len([p for p in productions if p.success_status == 'success']) / total_productions if total_productions > 0 else 0
    avg_quality = sum(p.quality_score or 0 for p in productions) / total_productions if total_productions > 0 else 0
    total_cost = sum(p.production_cost or 0 for p in productions)
    total_resource = sum(p.resource_usage or 0 for p in productions)
    
    production_times = [
        {
            'batch': p.batch_number,
            'time': p.production_time,
            'efficiency': p.efficiency_score,
            'quality': p.quality_score
        }
        for p in productions if p.production_time
    ]
    
    return render_template(
        'efficiency_dashboard.html',
        productions=productions,
        success_rate=success_rate,
        avg_quality=avg_quality,
        total_cost=total_cost,
        total_resource=total_resource,
        production_times=production_times
    )

@app.route('/products')
def products():
    # Get all categories and organize products by category
    categories = ProductCategory.query.all()
    category_products = {}
    
    for category in categories:
        products = Product.query.filter_by(category_id=category.id).all()
        category_products[category.name] = {
            'products': products,
            'category': category
        }
    
    return render_template('products.html', category_products=category_products)

@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        name = request.form['name']
        category_id = request.form['category_id']
        price = float(request.form['price'])
        weight_kg = float(request.form['weight_kg']) if request.form['weight_kg'] else None
        max_flavors = int(request.form['max_flavors']) if request.form['max_flavors'] else None
        track_stock = 'track_stock' in request.form

        product = Product(
            name=name,
            category_id=category_id,
            price=price,
            weight_kg=weight_kg,
            max_flavors=max_flavors,
            track_stock=track_stock,
            active=True
        )
        db.session.add(product)
        db.session.commit()
        
        flash('Producto agregado exitosamente', 'success')
        return redirect(url_for('products'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error al agregar el producto: {str(e)}', 'error')
        return redirect(url_for('products'))

@app.route('/add_category', methods=['POST'])
def add_category():
    try:
        data = request.get_json()
        name = data['name']
        description = data.get('description', '')
        
        category = ProductCategory(name=name, description=description)
        db.session.add(category)
        db.session.commit()
        
        return jsonify({'status': 'success', 'message': 'Categoría agregada exitosamente'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/edit_product/<int:product_id>', methods=['POST'])
def edit_product(product_id):
    try:
        data = request.get_json()
        product = Product.query.get_or_404(product_id)
        
        product.name = data['name']
        product.category_id = data['category_id']
        product.price = float(data['price'])
        product.sales_format = data['sales_format']
        product.weight_kg = float(data['weight_kg']) if data['weight_kg'] else None
        product.max_flavors = int(data['max_flavors']) if data['max_flavors'] else None
        product.track_stock = data['track_stock']
        product.active = data['active']
        
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Producto actualizado exitosamente'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/delete_product/<int:product_id>', methods=['POST'])
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        
        # Check if product has any related records
        has_stock = Stock.query.filter_by(product_id=product_id).first() is not None
        has_history = StockHistory.query.filter_by(product_id=product_id).first() is not None
        
        if has_stock or has_history:
            # If product has related records, just mark it as inactive
            product.active = False
            db.session.commit()
            return jsonify({'success': True, 'message': 'Producto marcado como inactivo'})
        else:
            # If no related records, delete the product
            db.session.delete(product)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'})
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/pos')
def pos():
    if 'selected_store' not in session:
        return redirect(url_for('select_store', next_page='pos'))

    store_id = session['selected_store']
    store = Store.query.get_or_404(store_id)
    
    # Get all product categories and their products, excluding Sabores
    category_products = {}
    sabores_category = ProductCategory.query.filter_by(name='Sabores').first()
    categories = ProductCategory.query.filter(ProductCategory.name != 'Sabores').all()
    
    for category in categories:
        products = Product.query.filter_by(category_id=category.id, active=True).all()
        if products:
            category_products[category.name] = products
            
    # Get recent sales for this store with eager loading of delivery_order
    recent_sales = Sale.query.options(
        joinedload(Sale.delivery_order)
    ).filter_by(
        store_id=store_id
    ).order_by(
        Sale.created_at.desc()
    ).limit(10).all()

    return render_template('pos.html', 
                         store=store,
                         category_products=category_products,
                         recent_sales=recent_sales)

@app.route('/api/get_flavors')
def get_flavors():
    try:
        store_id = session.get('selected_store')
        if not store_id:
            return jsonify({'error': 'No hay tienda seleccionada'}), 400

        # Get all ice cream flavors (products in the 'Sabores' category)
        flavors_category = ProductCategory.query.filter_by(name='Sabores').first()
        if not flavors_category:
            return jsonify({'error': 'Categoría de sabores no encontrada'}), 404

        # Get all products in the flavors category with their stock
        products = db.session.query(Product, Stock)\
            .join(Stock, and_(Stock.product_id == Product.id, Stock.store_id == store_id))\
            .filter(Product.category_id == flavors_category.id)\
            .all()

        flavors_data = []
        for product, stock in products:
            flavor_data = {
                'id': product.id,
                'name': product.name,
                'quantity': stock.quantity if stock else 0,
                'status': 'Bajo stock' if stock and stock.quantity < 5 else 'OK'
            }
            flavors_data.append(flavor_data)

        return jsonify(flavors_data)

    except Exception as e:
        print(f"Error getting flavors: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/add_to_cart', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        flavors = data.get('flavors', [])  # New field for flavors
        
        product = Product.query.get_or_404(product_id)
        
        if not 'cart' in session:
            session['cart'] = []
        
        # Check if product requires flavors (potes)
        if product.sales_format and 'KG' in product.sales_format.upper() and not flavors:
            return jsonify({
                'error': 'Por favor seleccione los sabores para este producto'
            }), 400
            
        # Validate number of flavors
        if product.max_flavors and len(flavors) > product.max_flavors:
            return jsonify({
                'error': f'Este producto permite máximo {product.max_flavors} sabores'
            }), 400
        
        cart_item = {
            'product_id': product_id,
            'quantity': quantity,
            'unit_price': float(product.price),
            'total_price': float(product.price * quantity),
            'name': product.name,
            'flavors': flavors
        }
        
        session['cart'].append(cart_item)
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Producto agregado al carrito',
            'cart': session['cart']
        })
        
    except Exception as e:
        print(f"Error adding to cart: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/get_cart')
def get_cart():
    try:
        cart = session.get('cart', [])
        total = sum(float(item['total_price']) for item in cart)
        
        cart_html = ''
        for item in cart:
            product = Product.query.get(item['product_id'])
            if not product:
                continue
                
            cart_html += f'''
            <div class="cart-item mb-2">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>{product.name}</strong>
                        {f"<br><small>Sabores: {', '.join(item['flavors'])}</small>" if item.get('flavors') else ""}
                        <div><small>{item['quantity']} x ${item['unit_price']}</small></div>
                    </div>
                    <div class="text-end">
                        <div>${float(item['total_price']):.2f}</div>
                    </div>
                </div>
            </div>
            '''
        
        return jsonify({
            'status': 'success',
            'cart_html': cart_html,
            'total': f"${total:.2f}"
        })
        
    except Exception as e:
        print(f"Error getting cart: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/clear_cart', methods=['POST'])
def clear_cart():
    try:
        session.pop('cart', None)
        session.modified = True
        return jsonify({
            'status': 'success',
            'message': 'Carrito limpiado'
        })
    except Exception as e:
        print(f"Error clearing cart: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/process_sale', methods=['POST'])
def process_sale():
    try:
        data = request.get_json()
        print("Received data:", data)
        
        if not data:
            print("Error: No data provided")
            return jsonify({'error': 'No data provided'}), 400

        # Get cart from session
        cart = session.get('cart', [])
        print("Cart from session:", cart)
        
        if not cart:
            print("Error: Cart is empty")
            return jsonify({'error': 'Cart is empty'}), 400

        # Validate required fields
        if 'payment_method' not in data:
            print("Error: Payment method is required")
            return jsonify({'error': 'Payment method is required'}), 400

        payment_method = data.get('payment_method')
        is_delivery = data.get('is_delivery', False)
        delivery_data = data.get('delivery_data')
        store_id = session.get('selected_store')
        print(f"Payment method: {payment_method}, Is delivery: {is_delivery}, Store ID: {store_id}")
        
        # Validate store selection
        if not store_id:
            print("Error: No store selected")
            return jsonify({'error': 'No store selected'}), 400

        store = Store.query.get(store_id)
        if not store:
            print("Error: Selected store not found")
            return jsonify({'error': 'Selected store not found'}), 404

        # Validate payment method
        valid_payment_methods = ['cash', 'card', 'transfer', 'mercadopago']
        if payment_method not in valid_payment_methods:
            print("Error: Invalid payment method")
            return jsonify({'error': f'Invalid payment method. Must be one of: {", ".join(valid_payment_methods)}'}), 400

        # Calculate total with validation
        try:
            total_amount = sum(float(item['total_price']) for item in cart)
            if total_amount <= 0:
                print("Error: Invalid total amount")
                return jsonify({'error': 'Invalid total amount'}), 400
        except (ValueError, TypeError):
            print("Error: Invalid price values in cart")
            return jsonify({'error': 'Invalid price values in cart'}), 400

        # Validate delivery data if needed
        if is_delivery and delivery_data:
            if not delivery_data:
                print("Error: Delivery data is required for delivery orders")
                return jsonify({'error': 'Delivery data is required for delivery orders'}), 400
            required_fields = ['customer_name', 'phone', 'address']
            missing_fields = [field for field in required_fields if field not in delivery_data]
            if missing_fields:
                print("Error: Missing required delivery fields")
                return jsonify({'error': f'Missing required delivery fields: {", ".join(missing_fields)}'}), 400

        # Create sale with appropriate payment status
        sale = Sale(
            store_id=store_id,
            total_amount=total_amount,
            payment_method=payment_method,
            payment_status='completed' if payment_method == 'cash' else 'pending',
            is_delivery=is_delivery,
            created_at=datetime.now()
        )
        db.session.add(sale)
        db.session.flush()  # Get sale.id without committing

        # Process sale items with stock validation
        stock_errors = []
        for item in cart:
            try:
                print(f"Checking stock for product {item['product_id']}")
                # Validate stock availability
                stock = Stock.query.filter_by(store_id=store_id, product_id=item['product_id']).with_for_update().first()
                
                if not stock:
                    error_msg = f"Product {item['product_id']} not found in stock"
                    print(f"Error: {error_msg}")
                    stock_errors.append(error_msg)
                    continue
                
                print(f"Current stock quantity: {stock.quantity}, Requested quantity: {float(item['quantity'])}")
                if stock.quantity is None or stock.quantity < float(item['quantity']):
                    product = Product.query.get(item['product_id'])
                    error_msg = f"No hay stock suficiente de {product.name}"
                    print(f"Error: {error_msg}")
                    stock_errors.append(error_msg)
                    continue

                # Create sale item
                sale_item = SaleItem(
                    sale_id=sale.id,
                    product_id=item['product_id'],
                    quantity=float(item['quantity']),
                    unit_price=float(item['unit_price']),
                    total_price=float(item['total_price'])
                )
                
                # Set flavors if present
                if 'flavors' in item and item['flavors']:
                    sale_item.set_flavors_list(item['flavors'])
                
                db.session.add(sale_item)

                # Update stock
                stock.quantity = stock.quantity - float(item['quantity'])
                print(f"Updated stock quantity: {stock.quantity}")
                
                # Create stock history entry
                stock_history = StockHistory(
                    store_id=store_id,
                    product_id=item['product_id'],
                    quantity_change=-float(item['quantity']),
                    reason=f'Venta #{sale.id}'
                )
                db.session.add(stock_history)

            except Exception as e:
                error_msg = f"Error processing product {item['product_id']}: {str(e)}"
                print(f"Exception: {error_msg}")
                stock_errors.append(error_msg)

        # If there were any stock errors, rollback and return error
        if stock_errors:
            print(f"Stock validation failed: {stock_errors}")
            db.session.rollback()
            return jsonify({
                'error': 'Stock validation failed',
                'details': stock_errors
            }), 400
        
        # Handle delivery if needed
        if is_delivery and delivery_data:
            try:
                # Create or update delivery address
                address = DeliveryAddress.query.filter_by(
                    customer_name=delivery_data['customer_name'],
                    phone=delivery_data['phone'],
                    address=delivery_data['address']
                ).first()
                
                if not address:
                    address = DeliveryAddress(
                        customer_name=delivery_data['customer_name'],
                        phone=delivery_data['phone'],
                        address=delivery_data['address'],
                        landmark=delivery_data.get('landmark'),
                        latitude=delivery_data.get('latitude'),
                        longitude=delivery_data.get('longitude'),
                        notes=delivery_data.get('notes')
                    )
                    db.session.add(address)
                    db.session.flush()

                # Get initial delivery status
                initial_status = DeliveryStatus.query.order_by(DeliveryStatus.order).first()
                if not initial_status:
                    raise ValueError('No delivery statuses configured')

                # Create delivery order
                delivery = DeliveryOrder(
                    sale_id=sale.id,
                    address_id=address.id,
                    current_status_id=initial_status.id,
                    delivery_notes=delivery_data.get('notes')
                )
                
                # Set store coordinates
                if store.latitude and store.longitude:
                    delivery.store_latitude = store.latitude
                    delivery.store_longitude = store.longitude
                    
                    # Calculate distance if both coordinates are available
                    if address.latitude and address.longitude:
                        delivery.distance_km = calculate_distance_km(
                            store.latitude, store.longitude,
                            address.latitude, address.longitude
                        )
                
                db.session.add(delivery)
                db.session.flush()
                
                print(f"Created delivery order with ID: {delivery.id}")
                
                # Now create the status history with the valid delivery_order_id
                status_history = DeliveryStatusHistory(
                    delivery_order_id=delivery.id,
                    status_id=initial_status.id,
                    created_by='system',
                    created_at=datetime.now()
                )
                db.session.add(status_history)

            except Exception as e:
                db.session.rollback()
                return jsonify({'error': f'Error processing delivery: {str(e)}'}), 500
        
        # Create MercadoPago payment link
        mp = MercadoPagoIntegration()
        if mp.is_configured:
            try:
                success, response = mp.create_preference(sale)
                if success:
                    # Update sale with MercadoPago info
                    sale.mp_payment_link = response.get('payment_link')
                    sale.mp_qr_link = response.get('qr_code')
                    sale.mp_status = 'pending'
                    sale.mp_created_at = datetime.now()
                    sale.mp_payment_type = payment_method
                    sale.mp_payment_method = payment_method
                else:
                    print(f"Warning: MercadoPago preference creation failed: {response}")
            except Exception as e:
                print(f"Warning: Error creating MercadoPago preference: {str(e)}")

        # Commit all changes
        db.session.commit()

        # Clear the cart
        session.pop('cart', None)
        session.modified = True
        
        return jsonify({
            'status': 'success',
            'message': 'Venta procesada correctamente',
            'sale_id': sale.id,
            'qr_link': sale.mp_qr_link if hasattr(sale, 'mp_qr_link') else None,
            'payment_link': sale.mp_payment_link if hasattr(sale, 'mp_payment_link') else None
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error processing sale: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/select_store', methods=['GET', 'POST'])
def select_store():
    if request.method == 'POST':
        store_id = request.form.get('store_id')
        next_page = request.form.get('next_page', 'index')
        if store_id:
            store = Store.query.get(store_id)
            if store:
                session['selected_store'] = int(store_id)
                return redirect(url_for(next_page))
        return redirect(url_for('select_store'))
    
    stores = Store.query.all()
    next_page = request.args.get('next_page', 'index')
    return render_template('select_store.html', stores=stores, next_page=next_page)

@app.route('/providers')
def providers():
    try:
        provider_type = request.args.get('type', '')
        status = request.args.get('status', '')
        category_id = request.args.get('category', '')
        search = request.args.get('search', '').strip()
        
        query = Provider.query
        if provider_type and provider_type != 'all':
            query = query.filter_by(type=provider_type)
        if status and status != 'all':
            is_active = status == 'active'
            query = query.filter_by(is_active=is_active)
        if category_id and category_id != 'all':
            query = query.filter(Provider.categories.any(id=category_id))
        if search:
            query = query.filter(
                or_(
                    Provider.name.ilike(f'%{search}%'),
                    Provider.phone.ilike(f'%{search}%'),
                    Provider.cuit.ilike(f'%{search}%')
                )
            )
        
        providers_list = query.order_by(Provider.name).all()
        categories = ProviderCategory.query.order_by(ProviderCategory.name).all()
        return render_template('providers.html', providers=providers_list, categories=categories)
    except Exception as e:
        flash(f'Error al cargar proveedores: {str(e)}', 'danger')
        return render_template('providers.html', providers=[], categories=[])

@app.route('/providers/<int:provider_id>/view')
def view_provider(provider_id):
    provider = Provider.query.get_or_404(provider_id)
    return render_template('view_provider.html', provider=provider)

@app.route('/providers/<int:provider_id>/edit', methods=['GET', 'POST'])
def edit_provider(provider_id):
    provider = Provider.query.get_or_404(provider_id)
    categories = ProviderCategory.query.order_by(ProviderCategory.name).all()
    
    if request.method == 'POST':
        try:
            provider.name = request.form['name']
            provider.type = request.form['type']
            if provider.type == 'person':
                provider.lastname = request.form['lastname']
                provider.business_name = None
            else:
                provider.business_name = request.form['business_name']
                provider.lastname = None
            provider.cuit = request.form['cuit']
            provider.phone = request.form['phone']
            provider.address = request.form['address']
            provider.email = request.form['email']
            provider.payment_methods = request.form['payment_methods']
            provider.business_hours = request.form['business_hours']
            provider.notes = request.form['notes']
            
            provider.categories = []
            for category_id in request.form.getlist('categories[]'):
                category = ProviderCategory.query.get(category_id)
                if category:
                    provider.categories.append(category)
            
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)})
    
    return render_template('edit_provider.html', provider=provider, categories=categories)

@app.route('/providers/<int:provider_id>/delete', methods=['POST'])
def delete_provider(provider_id):
    try:
        provider = Provider.query.get_or_404(provider_id)
        db.session.delete(provider)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/providers/<int:provider_id>/status', methods=['POST'])
def toggle_provider_status(provider_id):
    try:
        provider = Provider.query.get_or_404(provider_id)
        provider.is_active = not provider.is_active
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/providers/add', methods=['GET', 'POST'])
def add_provider():
    if request.method == 'POST':
        try:
            if request.form['type'] == 'person':
                if not request.form.get('name') or not request.form.get('lastname'):
                    flash('Nombre y apellido son requeridos para personas', 'danger')
                    return redirect(url_for('add_provider'))
            else:  
                if not request.form.get('business_name'):
                    flash('Nombre de la empresa es requerido', 'danger')
                    return redirect(url_for('add_provider'))

            cuit = request.form['cuit']
            if not re.match(r'^\d{2}-\d{8}-\d{1}$', cuit):
                flash('Formato de CUIT inválido', 'danger')
                return redirect(url_for('add_provider'))

            phone = request.form['phone']
            if not (6 <= len(phone) <= 20 and phone.isdigit()):
                flash('Número de teléfono inválido', 'danger')
                return redirect(url_for('add_provider'))

            provider = Provider(
                type=request.form['type'],
                name=request.form.get('name'),
                lastname=request.form.get('lastname'),
                business_name=request.form.get('business_name'),
                cuit=cuit,
                phone=phone,
                address=request.form['address'],
                email=request.form['email'],
                payment_methods=','.join(request.form.getlist('payment_methods[]')),
                business_hours=request.form['business_hours'],
                notes=request.form['notes']
            )
            
            db.session.add(provider)
            db.session.commit()
            flash('Proveedor agregado exitosamente', 'success')
            return redirect(url_for('providers'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error al agregar proveedor: {str(e)}', 'danger')
            return redirect(url_for('add_provider'))
            
    return render_template('add_provider.html')

@app.route('/api/providers/<int:id>', methods=['GET'])
def get_provider(id):
    try:
        provider = Provider.query.get_or_404(id)
        if provider.type == 'person':
            first_name = provider.name.split(' ')[0] if provider.name else ''
            last_name = provider.lastname if provider.lastname else ''
        else:
            first_name = None
            last_name = None
            
        provider_data = {
            'id': provider.id,
            'type': provider.type,
            'first_name': first_name,
            'last_name': last_name,
            'company_name': provider.name if provider.type == 'company' else None,
            'cuit': provider.cuit,
            'email': provider.email,
            'phone': provider.phone,
            'address': provider.address,
            'categories': [c.id for c in provider.categories],
            'active': provider.is_active
        }
        return jsonify({'status': 'success', 'provider': provider_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/providers/add', methods=['POST'])
def api_add_provider():
    try:
        data = request.form
        
        provider = Provider(
            type=data['type'],
            name=data['first_name'] + ' ' + data['last_name'] if data['type'] == 'person' else data['company_name'],
            lastname=data['last_name'] if data['type'] == 'person' else None,
            cuit=data['cuit'],
            email=data['email'],
            phone=data['phone'],
            address=data['address']
        )
        
        categories = request.form.getlist('categories')
        for cat_id in categories:
            category = ProviderCategory.query.get(cat_id)
            if category:
                provider.categories.append(category)
        
        db.session.add(provider)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Proveedor agregado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/providers/edit', methods=['POST'])
def api_edit_provider():
    try:
        data = request.form
        provider = Provider.query.get_or_404(data['id'])
        
        provider.type = data['type']
        if data['type'] == 'person':
            provider.name = data['first_name'] + ' ' + data['last_name']
            provider.lastname = data['last_name']
        else:
            provider.name = data['company_name']
            provider.lastname = None
        
        provider.cuit = data['cuit']
        provider.email = data['email']
        provider.phone = data['phone']
        provider.address = data['address']
        
        provider.categories.clear()
        categories = request.form.getlist('categories')
        for cat_id in categories:
            category = ProviderCategory.query.get(cat_id)
            if category:
                provider.categories.append(category)
        
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Proveedor actualizado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/providers/delete/<int:id>', methods=['POST'])
def api_delete_provider(id):
    try:
        provider = Provider.query.get_or_404(id)
        db.session.delete(provider)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Proveedor eliminado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/providers/toggle_status/<int:id>', methods=['POST'])
def api_toggle_provider_status(id):
    try:
        provider = Provider.query.get_or_404(id)
        provider.is_active = not provider.is_active
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Estado actualizado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/add_recipe', methods=['GET', 'POST'])
def add_recipe():
    if request.method == 'POST':
        try:
            name = request.form.get('name')
            product_id = request.form.get('product_id')
            instructions = request.form.get('instructions')
            
            ingredient_ids = request.form.getlist('ingredients[]')
            quantities = request.form.getlist('quantities[]')
            
            recipe = Recipe(
                name=name,
                product_id=product_id if product_id else None,
                instructions=instructions,
                type='flavor'
            )
            
            db.session.add(recipe)
            db.session.flush()
            
            for ingredient_id, quantity in zip(ingredient_ids, quantities):
                if ingredient_id and quantity:
                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=int(ingredient_id),
                        quantity=float(quantity)
                    )
                    db.session.add(recipe_ingredient)
            
            db.session.commit()
            flash('Receta agregada exitosamente', 'success')
            return redirect(url_for('recipes'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error al crear la receta: {str(e)}', 'danger')
            return redirect(url_for('add_recipe'))
    
    products = Product.query.all()
    ingredients = Ingredient.query.all()
    return render_template('add_recipe.html', products=products, ingredients=ingredients)

@app.route('/recipe/<int:recipe_id>')
def view_recipe(recipe_id):
    recipe = Recipe.query.get_or_404(recipe_id)
    return render_template('view_recipe.html', recipe=recipe)

@app.route('/recipe/<int:recipe_id>/edit', methods=['GET', 'POST'])
def edit_recipe(recipe_id):
    recipe = Recipe.query.get_or_404(recipe_id)
    
    if request.method == 'POST':
        try:
            recipe.name = request.form.get('name')
            recipe.product_id = request.form.get('product_id')
            recipe.instructions = request.form.get('instructions')
            
            RecipeIngredient.query.filter_by(recipe_id=recipe.id).delete()
            
            ingredient_ids = request.form.getlist('ingredients[]')
            quantities = request.form.getlist('quantities[]')
            
            for ingredient_id, quantity in zip(ingredient_ids, quantities):
                if ingredient_id and quantity:
                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=int(ingredient_id),
                        quantity=float(quantity)
                    )
                    db.session.add(recipe_ingredient)
            
            db.session.commit()
            flash('Receta actualizada exitosamente', 'success')
            return redirect(url_for('recipes'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar la receta: {str(e)}', 'danger')
    
    products = Product.query.all()
    ingredients = Ingredient.query.all()
    return render_template('edit_recipe.html', recipe=recipe, products=products, ingredients=ingredients)

@app.route('/store/<int:store_id>/mass_edit_minimum_stock', methods=['POST'])
def mass_edit_minimum_stock(store_id):
    if not current_user.is_authenticated:
        return redirect(url_for('login'))

    try:
        source_product_id = request.form.get('source_product')
        target_product_ids = request.form.getlist('target_products[]')
        
        if not source_product_id or not target_product_ids:
            flash('Por favor seleccione un producto fuente y al menos un producto destino', 'error')
            return redirect(url_for('edit_store_stock', store_id=store_id))
        
        # Get source product's minimum stock
        source_product = Product.query.get(source_product_id)
        if not source_product:
            flash('No se encontró el producto fuente', 'error')
            return redirect(url_for('edit_store_stock', store_id=store_id))
            
        source_min_stock = GeneralMinimum.query.filter_by(product_id=source_product_id).first()
        if not source_min_stock:
            flash('No se encontró el stock mínimo del producto fuente', 'error')
            return redirect(url_for('edit_store_stock', store_id=store_id))
        
        # Update target products
        updated_count = 0
        for target_id in target_product_ids:
            target_product = Product.query.get(target_id)
            if not target_product:
                continue
                
            target_min_stock = GeneralMinimum.query.filter_by(product_id=target_id).first()
            
            if target_min_stock:
                target_min_stock.quantity = source_min_stock.quantity
            else:
                new_min_stock = GeneralMinimum(
                    product_id=target_id,
                    quantity=source_min_stock.quantity
                )
                db.session.add(new_min_stock)
            updated_count += 1
        
        db.session.commit()
        flash(f'Stock mínimo actualizado exitosamente para {updated_count} productos', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error al actualizar el stock mínimo: {str(e)}', 'error')
        print(f"Error: {str(e)}")

    return redirect(url_for('edit_store_stock', store_id=store_id))

@app.route('/dashboard')
def dashboard():
    # Get total production
    total_production = db.session.query(db.func.sum(Production.quantity)).scalar() or 0
    
    # Get total active stores
    total_stores = Store.query.count()
    
    # Get total active flavors (products in Sabores category)
    flavor_category = ProductCategory.query.filter_by(name='Sabores').first()
    total_flavors = Product.query.filter_by(
        category_id=flavor_category.id if flavor_category else None,
        active=True
    ).count() if flavor_category else 0
    
    # Get low stock count
    low_stock_count = Stock.query.join(GeneralMinimum, Stock.product_id == GeneralMinimum.product_id).filter(Stock.quantity <= GeneralMinimum.quantity).count()
    
    return render_template('dashboard.html',
                         total_production=total_production,
                         total_stores=total_stores,
                         total_flavors=total_flavors,
                         low_stock_count=low_stock_count)

@app.route('/api/production_data')
def production_data():
    # Get last 7 days of production data
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_production = db.session.query(
        db.func.date(Production.production_date).label('date'),
        db.func.sum(Production.quantity).label('total')
    ).filter(
        Production.production_date >= seven_days_ago
    ).group_by(
        db.func.date(Production.production_date)
    ).order_by(db.func.date(Production.production_date)).all()
    
    # Format data for Chart.js
    labels = []
    values = []
    current_date = seven_days_ago.date()
    end_date = datetime.utcnow().date()
    
    # Create a dict for quick lookup of production values
    production_dict = {str(p.date): float(p.total) for p in daily_production}
    
    # Fill in all dates, using 0 for days with no production
    while current_date <= end_date:
        date_str = str(current_date)
        labels.append(current_date.strftime('%Y-%m-%d'))
        values.append(production_dict.get(date_str, 0))
        current_date += timedelta(days=1)
    
    return jsonify({
        'labels': labels,
        'values': values
    })

@app.route('/debug')
def debug():
    return render_template('debug.html')

@app.route('/debug_db')
def debug_db():
    # Check categories
    categories = ProductCategory.query.all()
    print("\nCategories:")
    for cat in categories:
        print(f"- {cat.name} (ID: {cat.id})")
    
    # Check products
    products = Product.query.all()
    print("\nProducts:")
    for prod in products:
        print(f"- {prod.name} (Category: {prod.category.name}, Track Stock: {prod.track_stock})")
    
    return "Check console for debug output"

@app.route('/api/ingredients/update_stock', methods=['POST'])
def update_ingredient_stock():
    try:
        data = request.get_json()
        ingredient_id = data.get('ingredientId')
        new_stock = float(data.get('currentStock'))
        min_stock = float(data.get('minimumStock'))
        cost_per_unit = float(data.get('costPerUnit'))
        supplier_id = data.get('supplierId')
        notes = data.get('notes', '')
        
        ingredient = Ingredient.query.get_or_404(ingredient_id)
        
        old_stock = ingredient.current_stock
        
        # Create stock adjustment transaction if stock changed
        if old_stock != new_stock:
            transaction = IngredientTransaction(
                ingredient_id=ingredient_id,
                transaction_type='adjustment',
                quantity=new_stock - old_stock,
                notes=notes
            )
            db.session.add(transaction)
        
        # Update all ingredient fields
        ingredient.current_stock = new_stock
        ingredient.minimum_stock = min_stock
        ingredient.cost_per_unit = cost_per_unit
        ingredient.supplier_id = supplier_id
        ingredient.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/delivery/search_customer', methods=['GET'])
def search_customer():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    results = DeliveryAddress.search(query)
    customers = []
    
    for addr, score in results:
        customers.append({
            'id': addr.id,
            'customer_name': addr.customer_name,
            'phone': addr.phone,
            'address': addr.address,
            'landmark': addr.landmark,
            'score': score,
            'whatsapp_link': addr.whatsapp_link
        })
    
    return jsonify(customers)

@app.route('/delivery/status/<string:encoded_data>')
def delivery_status_page(encoded_data):
    try:
        # Decode the data
        import base64
        import json
        decoded_data = json.loads(base64.urlsafe_b64decode(encoded_data).decode())
        
        # Get the delivery order
        delivery_order = DeliveryOrder.query.get_or_404(decoded_data['order_id'])
        
        # Get all possible statuses
        statuses = DeliveryStatus.query.order_by(DeliveryStatus.order).all()
        
        return render_template('delivery_status.html', 
                             delivery_order=delivery_order,
                             statuses=statuses)
    except Exception as e:
        return render_template('error.html', 
                             message='Invalid or expired QR code',
                             details=str(e))

@app.route('/api/delivery/<int:delivery_id>/status', methods=['POST'])
def set_delivery_status(delivery_id):
    try:
        delivery = DeliveryOrder.query.get_or_404(delivery_id)
        
        data = request.get_json()
        status_id = data.get('status_id')
        notes = data.get('notes', '')
        
        if not status_id:
            return jsonify({'status': 'error', 'message': 'Status ID is required'}), 400
            
        # Update the status
        delivery.update_status(status_id, notes=notes)
        
        return jsonify({'status': 'success', 'message': 'Estado actualizado correctamente'})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/delivery/tracking/<int:order_id>')
def delivery_tracking(order_id):
    delivery_order = DeliveryOrder.query.get_or_404(order_id)
    return render_template('delivery_tracking.html', 
                         delivery_order=delivery_order)

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers using the Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return round(distance, 2)

@app.route('/edit_store/<int:store_id>', methods=['GET', 'POST'])
def edit_store(store_id):
    store = Store.query.get_or_404(store_id)
    
    if request.method == 'POST':
        store.name = request.form['name']
        store.address = request.form['address']
        store.latitude = request.form.get('latitude', type=float)
        store.longitude = request.form.get('longitude', type=float)
        
        db.session.commit()
        flash('Tienda actualizada exitosamente', 'success')
        return redirect(url_for('stores'))
    
    return render_template('edit_store.html', store=store)

@app.route('/deliveries')
def deliveries():
    # Get all delivery orders with their related data
    deliveries = (DeliveryOrder.query
                 .join(Sale)
                 .join(Store)
                 .join(DeliveryAddress)
                 .join(DeliveryStatus)
                 .order_by(DeliveryOrder.created_at.desc())
                 .all())
    
    # Get all stores and statuses for filters
    stores = Store.query.all()
    delivery_statuses = DeliveryStatus.query.order_by(DeliveryStatus.order).all()
    
    return render_template('deliveries.html',
                         deliveries=deliveries,
                         stores=stores,
                         delivery_statuses=delivery_statuses,
                         google_maps_api_key=app.config['GOOGLE_MAPS_API_KEY'])

@app.route('/api/delivery/<int:delivery_id>/details')
def get_delivery_details(delivery_id):
    try:
        delivery = DeliveryOrder.query.get_or_404(delivery_id)
        sale = delivery.sale
        address = delivery.address
        
        items = []
        for item in sale.sale_items:
            items.append({
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price': float(item.unit_price),
                'subtotal': float(item.total_price),
                'flavors': item.get_flavors_list() if item.flavors else []
            })
        
        return jsonify({
            'customer_name': address.customer_name,
            'phone': address.phone,
            'address': address.address,
            'total_amount': float(sale.total_amount),
            'payment_method': sale.payment_method,
            'distance_km': float(delivery.distance_km or 0),
            'items': items,
            'mp_payment_link': delivery.mp_payment_link,
            'mp_status': delivery.mp_status,
            'payment_status': sale.payment_status
        })
    except Exception as e:
        print(f"Error in get_delivery_details: {str(e)}")  # Add debug logging
        return jsonify({'error': str(e)}), 500

@app.route('/api/delivery/<int:delivery_id>/status', methods=['POST'])
def update_delivery_status(delivery_id):
    try:
        delivery = DeliveryOrder.query.get_or_404(delivery_id)
        data = request.get_json()
        
        if not data or 'status_id' not in data:
            return jsonify({'message': 'Status ID is required'}), 400
            
        new_status = DeliveryStatus.query.get_or_404(data['status_id'])
        notes = data.get('notes', '')
        
        # Add new status history entry
        history = DeliveryStatusHistory(
            delivery_order_id=delivery_id,
            status_id=new_status.id,
            notes=notes
        )
        db.session.add(history)

        # Update current status
        delivery.current_status_id = new_status.id
        
        db.session.commit()
        return jsonify({'message': 'Estado actualizado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/payment/create_payment/<int:delivery_id>', methods=['POST'])
def create_payment(delivery_id):
    try:
        delivery = Delivery.query.get_or_404(delivery_id)
        
        if not delivery.mp_payment_link:
            # Create MercadoPago preference
            preference_data = {
                "items": [
                    {
                        "title": f"Pedido #{delivery_id}",
                        "description": f"Pedido para {delivery.address.customer_name}",
                        "quantity": 1,
                        "currency_id": "ARS",
                        "unit_price": float(delivery.total_amount)
                    }
                ],
                "notification_url": os.getenv('MERCADOPAGO_WEBHOOK_URL'),
                "external_reference": str(delivery_id),
                "payment_methods": {
                    "excluded_payment_types": [{"id": "ticket"}],
                    "installments": 1
                },
                "statement_descriptor": "Venezia Helados",
                "expires": True,
                "expiration_date_to": (datetime.now() + timedelta(hours=24)).isoformat()
            }
            
            preference = mp_integration.mp.preference().create(preference_data)
            
            if preference["status"] == 201:
                # Save payment link to delivery
                delivery.mp_payment_link = preference["response"]["init_point"]
                delivery.mp_preference_id = preference["response"]["id"]
                delivery.mp_qr_link = preference["response"].get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code_base64")
                delivery.mp_status = "pending"
                delivery.mp_created_at = datetime.now()
                db.session.commit()
                
                return jsonify({
                    "payment_link": delivery.mp_payment_link,
                    "qr_code": delivery.mp_qr_link,
                    "status": "pending"
                })
            else:
                return jsonify({"error": "Error creating MercadoPago preference"}), 500
        
        return jsonify({
            "payment_link": delivery.mp_payment_link,
            "qr_code": delivery.mp_qr_link,
            "status": delivery.mp_status
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/payment/send_payment/<int:delivery_id>', methods=['POST'])
def send_payment(delivery_id):
    try:
        delivery = Delivery.query.get_or_404(delivery_id)
        
        if not delivery.mp_payment_link:
            return jsonify({"error": "No payment link available"}), 400
            
        # Send WhatsApp message with payment link
        message = f"Hola! Aquí está tu link de pago para el pedido #{delivery_id}: {delivery.mp_payment_link}"
        send_whatsapp_message(delivery.phone, message)
        
        # Update delivery record
        delivery.payment_sent_via_whatsapp = True
        delivery.payment_sent_at = datetime.now()
        db.session.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/webhook/mercadopago', methods=['POST'])
def mercadopago_webhook():
    try:
        data = request.json
        
        if data["type"] == "payment":
            payment_id = data["data"]["id"]
            payment = mp_integration.mp.payment().get(payment_id)
            
            delivery_id = int(payment["response"]["external_reference"])
            delivery = DeliveryOrder.query.get(delivery_id)
            
            if delivery:
                delivery.mp_status = payment["response"]["status"]
                db.session.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete_store/<int:store_id>', methods=['POST'])
def delete_store(store_id):
    try:
        data = request.get_json()
        password = data.get('password')

        if password != 'W0lv3r1n33!!':
            return jsonify({'success': False, 'error': 'Contraseña incorrecta'})

        store = Store.query.get_or_404(store_id)
        
        # Delete related stock records
        Stock.query.filter_by(store_id=store_id).delete()
        
        # Delete related stock history
        StockHistory.query.filter_by(store_id=store_id).delete()
        
        # Delete the store
        db.session.delete(store)
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/set_random_stock', methods=['POST'])
def set_random_stock():
    try:
        ingredients = Ingredient.query.all()
        for ingredient in ingredients:
            # Set random current stock between 0 and 100
            ingredient.current_stock = round(random.uniform(0, 100), 2)
            # Set random minimum stock between 10 and 30
            ingredient.minimum_stock = round(random.uniform(10, 30), 2)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Stock actualizado correctamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/search_providers')
def search_providers():
    term = request.args.get('term', '')
    if not term:
        return jsonify([])
    
    # Search across name, phone, and cuit fields
    providers = Provider.query.filter(
        db.or_(
            Provider.name.ilike(f'%{term}%'),
            Provider.phone.ilike(f'%{term}%'),
            Provider.cuit.ilike(f'%{term}%')
        ),
        Provider.is_active == True
    ).limit(10).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'phone': p.phone,
        'cuit': p.cuit
    } for p in providers])

@app.route('/edit_category/<int:category_id>', methods=['POST'])
def edit_category(category_id):
    try:
        category = ProductCategory.query.get_or_404(category_id)
        name = request.form.get('name')
        description = request.form.get('description')
        
        if not name:
            return jsonify({'success': False, 'error': 'El nombre de la categoría es requerido'})
            
        # Check if another category already has this name
        existing_category = ProductCategory.query.filter(
            ProductCategory.name == name,
            ProductCategory.id != category_id
        ).first()
        
        if existing_category:
            return jsonify({'success': False, 'error': 'Ya existe una categoría con este nombre'})
        
        category.name = name
        if description is not None:
            category.description = description
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get_recent_sales')
def get_recent_sales():
    """Get recent sales HTML for AJAX refresh"""
    try:
        # Get recent sales (last 10), excluding any with null created_at
        # and ensuring proper ordering
        recent_sales = Sale.query.options(
            joinedload(Sale.delivery_order)  # Eager load delivery_order relationship
        ).filter(
            Sale.created_at.isnot(None),  # Exclude sales with no timestamp
            ~Sale.id.in_([142, 143])  # Exclude stuck sales
        ).order_by(
            Sale.created_at.desc()
        ).limit(10).all()

        # Render just the sales table part
        sales_html = render_template('_recent_sales_table.html', recent_sales=recent_sales)
        
        return jsonify({
            'status': 'success',
            'html': sales_html
        })
        
    except Exception as e:
        print(f"Error in get_recent_sales: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/available_flavors', methods=['GET'])
def get_available_flavors():
    """Get list of available ice cream flavors"""
    try:
        # Get all flavors from general_minimum table
        flavors = db.session.query(GeneralMinimum.flavor).all()
        return jsonify({
            'flavors': [f[0] for f in flavors]  # Convert tuples to list of strings
        })
    except Exception as e:
        print(f"Error getting flavors: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock_data')
def stock_data():
    store_id = request.args.get('store_id', type=int)
    flavor = request.args.get('flavor')
    
    # Start with a base query joining Stock, Product, Store, and GeneralMinimum
    query = db.session.query(Stock, Product, Store, GeneralMinimum)\
        .join(Product, Stock.product_id == Product.id)\
        .join(Store, Stock.store_id == Store.id)\
        .outerjoin(GeneralMinimum, Stock.product_id == GeneralMinimum.product_id)
    
    # Apply filters
    if store_id:
        query = query.filter(Stock.store_id == store_id)
    if flavor:
        query = query.filter(Product.name == flavor)
    
    # Execute query and format results
    result = []
    for stock, product, store, min_stock in query.all():
        min_quantity = min_stock.quantity if min_stock else 0
        result.append({
            'store': store.name,
            'flavor': product.name,
            'quantity': float("%.2f" % stock.quantity),
            'minimum': float("%.2f" % min_quantity),
            'status': 'Bajo stock' if stock.quantity < min_quantity else 'OK'
        })
    
    return jsonify(result)

@app.route('/debug_sales')
def debug_sales():
    try:
        # Get all sales
        sales = Sale.query.all()
        print(f"Found {len(sales)} sales")
        sales_data = []
        
        for sale in sales:
            print(f"Processing sale {sale.id}")
            sale_data = {
                'id': sale.id,
                'store_id': sale.store_id,
                'total_amount': sale.total_amount,
                'payment_method': sale.payment_method,
                'payment_status': sale.payment_status,
                'created_at': sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'is_delivery': sale.is_delivery,
                'items': []
            }
            
            for item in sale.sale_items:
                item_data = {
                    'product_id': item.product_id,
                    'product_name': item.product.name if item.product else 'N/A',
                    'quantity': item.quantity,
                    'unit_price': item.unit_price,
                    'total_price': item.total_price
                }
                sale_data['items'].append(item_data)
            
            sales_data.append(sale_data)
        
        print("Returning sales data")
        return jsonify({
            'total_sales': len(sales_data),
            'sales': sales_data
        })
        
    except Exception as e:
        print(f"Error in debug_sales: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/ingredients')
def ingredients():
    ingredients = Ingredient.query.all()
    providers = Provider.query.filter_by(is_active=True).all()
    return render_template('ingredients.html', ingredients=ingredients, providers=providers)

@app.route('/api/ingredients/<int:id>')
def get_ingredient(id):
    try:
        ingredient = Ingredient.query.get_or_404(id)
        return jsonify({
            'id': ingredient.id,
            'name': ingredient.name,
            'unit': ingredient.unit,
            'current_stock': ingredient.current_stock,
            'minimum_stock': ingredient.minimum_stock,
            'cost_per_unit': ingredient.cost_per_unit,
            'supplier_id': ingredient.supplier_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/ingredients/add', methods=['GET', 'POST'])
def add_ingredient():
    if request.method == 'POST':
        ingredient = Ingredient(
            name=request.form['name'],
            unit=request.form['unit'],
            current_stock=float(request.form['current_stock']),
            minimum_stock=float(request.form['minimum_stock']),
            cost_per_unit=float(request.form['cost_per_unit']),
            supplier_id=request.form['supplier_id']
        )
        db.session.add(ingredient)
        db.session.commit()
        flash('Ingrediente agregado exitosamente', 'success')
        return redirect(url_for('ingredients'))
    providers = Provider.query.filter_by(is_active=True).all()
    return render_template('add_ingredient.html', providers=providers)

@app.route('/recipes')
def recipes():
    recipes_list = Recipe.query.all()
    for recipe in recipes_list:
        product = Product.query.get(recipe.product_id) if recipe.product_id else None
        recipe.product_name = product.name if product else 'Sin Producto'
        recipe.can_produce = all(
            ri.ingredient.current_stock >= ri.quantity 
            for ri in recipe.ingredients
        )
        recipe.total_cost = sum(
            ri.quantity * ri.ingredient.cost_per_unit 
            for ri in recipe.ingredients
        )
    return render_template('recipes.html', recipes=recipes_list)

@app.route('/ingredient_transactions')
def ingredient_transactions():
    ingredient_id = request.args.get('ingredient_id', type=int)
    transaction_type = request.args.get('transaction_type')
    
    query = IngredientTransaction.query
    if ingredient_id:
        query = query.filter_by(ingredient_id=ingredient_id)
    if transaction_type:
        query = query.filter_by(transaction_type=transaction_type)
    
    transactions = query.order_by(IngredientTransaction.timestamp.desc()).all()
    ingredients_list = Ingredient.query.all()
    
    return render_template('ingredient_transactions.html', 
                         transactions=transactions,
                         ingredients=ingredients_list)

@app.route('/ingredient_transactions/add', methods=['GET', 'POST'])
def add_ingredient_transaction():
    if request.method == 'POST':
        ingredient_id = request.form['ingredient_id']
        transaction_type = request.form['transaction_type']
        quantity = float(request.form['quantity'])
        cost = float(request.form['cost']) if request.form['cost'] else 0.0
        
        ingredient = Ingredient.query.get_or_404(ingredient_id)
        
        if transaction_type == 'entrada':
            ingredient.current_stock += quantity
        else:  
            if ingredient.current_stock < quantity:
                flash('No hay suficiente stock disponible', 'danger')
                return redirect(url_for('add_ingredient_transaction'))
            ingredient.current_stock -= quantity
        
        transaction = IngredientTransaction(
            ingredient_id=ingredient_id,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_cost=cost,
            notes=request.form['notes'],
            user_id=1  
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        flash('Transacción registrada exitosamente', 'success')
        return redirect(url_for('ingredient_transactions'))
    
    ingredient_id = request.args.get('ingredient_id', type=int)
    selected_ingredient = None
    if ingredient_id:
        selected_ingredient = Ingredient.query.get_or_404(ingredient_id)
    
    ingredients_list = Ingredient.query.all()
    return render_template('add_ingredient_transaction.html',
                         ingredients=ingredients_list,
                         selected_ingredient=selected_ingredient)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

@app.route('/sales_report')
def sales_report():
    return redirect(url_for('reports'))

@app.route('/get_stock_analytics_data')
def get_stock_analytics_data():
    selected_store_id = request.args.get('store_id', type=int)
    selected_product_id = request.args.get('product_id', type=int)
    days = request.args.get('days', 30, type=int)
    
    from_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query for daily changes
    query = db.session.query(
        StockHistory.timestamp,
        db.func.sum(StockHistory.quantity_change).label('quantity_change')
    )
    
    if selected_store_id:
        query = query.filter(StockHistory.store_id == selected_store_id)
    if selected_product_id:
        query = query.filter(StockHistory.product_id == selected_product_id)
    
    daily_changes = query.filter(
        StockHistory.timestamp >= from_date
    ).group_by(
        db.func.date(StockHistory.timestamp)
    ).order_by(StockHistory.timestamp).all()
    
    # Get depletion rates
    depletion_query = db.session.query(
        StockHistory.store_id,
        StockHistory.product_id,
        Store.name.label('store_name'),
        Product.name.label('product'),
        db.func.avg(StockHistory.quantity_change).label('avg_change')
    ).join(Store).join(Product).filter(
        StockHistory.reason == 'sale'
    )
    
    if selected_store_id:
        depletion_query = depletion_query.filter(StockHistory.store_id == selected_store_id)
    if selected_product_id:
        depletion_query = depletion_query.filter(StockHistory.product_id == selected_product_id)
    
    depletion_rates = depletion_query.group_by(
        StockHistory.store_id,
        StockHistory.product_id
    ).all()
    
    # Process depletion rates to include absolute values
    processed_depletion_rates = []
    for rate in depletion_rates:
        processed_depletion_rates.append({
            'store_id': rate.store_id,
            'product_id': rate.product_id,
            'store_name': rate.store_name,
            'product': rate.product,
            'avg_change': rate.avg_change,
            'abs_change': abs(rate.avg_change) if rate.avg_change else 0
        })
    
    # Get current stock and predictions
    current_stock = Stock.query.all()
    stock_predictions = []
    for stock in current_stock:
        depletion_rate = next(
            (r.avg_change for r in depletion_rates 
             if r.store_id == stock.store_id and r.product_id == stock.product_id),
            0
        )
        if depletion_rate < 0:
            days_until_empty = abs(stock.quantity / depletion_rate) if depletion_rate else float('inf')
            stock_predictions.append({
                'store_id': stock.store_id,
                'store_name': stock.store.name,
                'product': stock.product.name,
                'current_quantity': stock.quantity,
                'days_until_empty': days_until_empty,
                'predicted_date': datetime.utcnow() + timedelta(days=days_until_empty)
            })
    
    # Format daily changes for chart
    formatted_daily_changes = [
        {
            'date': change.timestamp.strftime('%Y-%m-%d'),
            'change': float(change.quantity_change)
        }
        for change in daily_changes
    ]
    
    return jsonify({
        'daily_changes': formatted_daily_changes,
        'depletion_rates': processed_depletion_rates,
        'stock_predictions': sorted(stock_predictions, key=lambda x: x['days_until_empty'])[:10]
    })

@app.route('/production-orders')
def production_orders():
    return render_template('production_orders.html')

# Production Orders API endpoints
@app.route('/api/production_orders/', methods=['GET'])
def list_production_orders():
    try:
        # Get query parameters for filtering
        status = request.args.get('status')
        product_id = request.args.get('product_id')
        
        # Base query
        query = ProductionOrder.query.join(Product).join(ProductionOrderStatus, isouter=True)
        
        # Apply filters if provided
        if status:
            query = query.filter(ProductionOrder.status_id == status)
        if product_id:
            query = query.filter(ProductionOrder.product_id == product_id)
            
        # Order by priority (high to low) and created date (newest first)
        orders = query.order_by(ProductionOrder.priority.desc(), 
                              ProductionOrder.created_at.desc()).all()
        
        order_list = []
        for order in orders:
            try:
                order_dict = {
                    'id': order.id,
                    'order_number': order.order_number,
                    'product_id': order.product_id,
                    'product_name': order.product.name if order.product else None,
                    'quantity': order.quantity,
                    'unit': order.unit,
                    'notes': order.notes,
                    'priority': order.priority,
                    'progress': order.progress if hasattr(order, 'progress') else 0,
                    'due_date': order.due_date.isoformat() if order.due_date else None,
                    'current_status': order.current_status.name if order.current_status else 'Pendiente',
                    'status': order.current_status.name if order.current_status else 'Pendiente',  # Keep for backwards compatibility
                    'created_at': order.created_at.isoformat(),
                    'updated_at': order.updated_at.isoformat() if order.updated_at else None
                }
                order_list.append(order_dict)
            except Exception as order_error:
                app.logger.error(f'Error processing order {order.id}: {str(order_error)}')
                continue
        
        return jsonify(order_list), 200
    except Exception as e:
        app.logger.error(f'Error in list_production_orders: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/production_orders/', methods=['POST'])
def create_production_order():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug print
        
        # Validate required fields
        required_fields = ['product_id', 'quantity', 'unit']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create new order
        order = ProductionOrder(
            product_id=data['product_id'],
            quantity=data['quantity'],
            unit=data['unit'],
            notes=data.get('notes'),
            priority=data.get('priority', 1),  # Default priority 1 (lowest)
            due_date=datetime.fromisoformat(data['due_date']) if 'due_date' in data and data['due_date'] else None
        )
        print("Created order object:", order)  # Debug print
        
        # Set initial status (Pedido)
        initial_status = ProductionOrderStatus.query.filter_by(name='Pedido').first()
        print("Initial status:", initial_status)  # Debug print
        if initial_status:
            order.status_id = initial_status.id
        
        db.session.add(order)
        print("Added order to session")  # Debug print
        
        # Create initial status history entry
        history = ProductionOrderHistory(
            order=order,
            status_id=initial_status.id if initial_status else None,
            notes="Orden creada"
        )
        print("Created history entry:", history)  # Debug print
        db.session.add(history)
        print("Added history to session")  # Debug print
        
        db.session.commit()
        print("Committed to database")  # Debug print
        
        return jsonify({
            'id': order.id,
            'message': 'Production order created successfully'
        }), 201
    except Exception as e:
        print("Error creating order:", str(e))  # Debug print
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/production_orders/<int:order_id>', methods=['GET'])
def get_production_order(order_id):
    try:
        order = ProductionOrder.query.get_or_404(order_id)
        
        return jsonify({
            'id': order.id,
            'order_number': order.order_number,
            'product_id': order.product_id,
            'product_name': order.product.name if order.product else None,
            'quantity': order.quantity,
            'unit': order.unit,
            'notes': order.notes,
            'priority': order.priority,
            'due_date': order.due_date.isoformat() if order.due_date else None,
            'current_status': order.current_status.name if order.current_status else 'Pendiente',
            'status_history': [{
                'status': h.status.name,
                'notes': h.notes,
                'created_at': h.created_at.isoformat()
            } for h in order.status_history],
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat() if order.updated_at else None,
            'progress': order.progress
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/production_orders/<int:order_id>', methods=['PUT'])
def update_production_order(order_id):
    try:
        order = ProductionOrder.query.get_or_404(order_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'product_id' in data:
            order.product_id = data['product_id']
        if 'quantity' in data:
            order.quantity = data['quantity']
        if 'unit' in data:
            order.unit = data['unit']
        if 'notes' in data:
            order.notes = data['notes']
        if 'priority' in data:
            order.priority = data['priority']
        if 'due_date' in data:
            order.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
        
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Production order updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/production_orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        status_id = data.get('status_id')
        
        if not status_id:
            return jsonify({'error': 'Status ID is required'}), 400
            
        order = ProductionOrder.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        status = ProductionOrderStatus.query.get(status_id)
        if not status:
            return jsonify({'error': 'Invalid status ID'}), 400
            
        # Update order status
        order.status_id = status_id
        order.updated_at = datetime.now()
        
        # Create status history entry
        history = ProductionOrderHistory(
            order=order,
            status_id=status_id,
            notes=f"Estado actualizado a {status.name}"
        )
        db.session.add(history)

        # Update progress if needed
        if status.name == 'Completado':
            order.progress = order.quantity
        elif status.name == 'Cancelado':
            order.progress = 0
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully',
            'status': status.name
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating order status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/production_orders/<int:order_id>', methods=['DELETE'])
def delete_production_order(order_id):
    try:
        order = ProductionOrder.query.get_or_404(order_id)
        
        # Delete associated history entries first
        ProductionOrderHistory.query.filter_by(order_id=order_id).delete()
        
        # Delete the order
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({
            'message': 'Production order deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/', methods=['GET'])
def list_products():
    try:
        # Get query parameters for filtering
        category_id = request.args.get('category_id')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        # Base query
        query = Product.query
        
        # Apply filters if provided
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if active_only:
            query = query.filter(Product.active == True)
            
        # Get products ordered by name
        products = query.order_by(Product.name).all()
        
        return jsonify([{
            'id': product.id,
            'name': product.name,
            'category_id': product.category_id,
            'category_name': product.category.name if product.category else None,
            'description': product.description,
            'price': product.price,
            'sales_format': product.sales_format,
            'active': product.active
        } for product in products]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/ingredients/<int:id>', methods=['DELETE'])
def delete_ingredient(id):
    try:
        ingredient = Ingredient.query.get_or_404(id)
        
        # Check if ingredient is used in any recipes
        recipe_ingredients = RecipeIngredient.query.filter_by(ingredient_id=id).first()
        if recipe_ingredients:
            return jsonify({'error': 'No se puede eliminar el ingrediente porque está siendo usado en recetas'}), 400
        
        # Delete related transactions
        IngredientTransaction.query.filter_by(ingredient_id=id).delete()
        
        # Delete the ingredient
        db.session.delete(ingredient)
        db.session.commit()
        
        return jsonify({'message': 'Ingrediente eliminado correctamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/production/<int:production_id>/assignment_details')
def get_assignment_details(production_id):
    try:
        production = Production.query.get_or_404(production_id)
        
        if not production.assigned_store_id:
            return jsonify({'success': False, 'error': 'Este lote no ha sido asignado'})
            
        return jsonify({
            'success': True,
            'store_name': production.assigned_store.name,
            'assigned_at': production.assigned_at.strftime('%d/%m/%Y %H:%M'),
            'quantity': float(production.quantity)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/production_orders_summary')
def production_orders_summary():
    try:
        # Get counts for each status
        status_counts = db.session.query(
            ProductionOrder.status_id,
            db.func.count(ProductionOrder.id).label('count'),
            ProductionOrderStatus.name.label('status_name')
        ).join(
            ProductionOrderStatus,
            ProductionOrder.status_id == ProductionOrderStatus.id
        ).group_by(
            ProductionOrder.status_id,
            ProductionOrderStatus.name
        ).all()
        
        # Convert to dictionary with correct status IDs
        status_counts_dict = {}
        for status_id, count, status_name in status_counts:
            status_counts_dict[status_id] = count
            print(f"Found status: {status_id} - {status_name} with count {count}")  # Debug print
        
        # Get recent orders with status
        recent_orders = db.session.query(ProductionOrder, ProductionOrderStatus)\
            .join(Product)\
            .join(ProductionOrderStatus)\
            .order_by(ProductionOrder.created_at.desc())\
            .limit(5)\
            .all()
        
        recent_orders_data = [{
            'id': order.id,
            'product': order.product.name,
            'quantity': float(order.quantity),
            'status': status.name,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M')
        } for order, status in recent_orders]
        
        print("Status counts:", status_counts_dict)  # Debug print
        print("Recent orders:", recent_orders_data)  # Debug print
        
        return jsonify({
            'status_counts': status_counts_dict,
            'recent_orders': recent_orders_data
        })
    except Exception as e:
        print(f"Error in production_orders_summary: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/all')
def get_all_products():
    """Get all products with their categories"""
    try:
        products = Product.query.filter_by(active=True).all()
        products_data = []
        
        for product in products:
            product_data = {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'category': product.category.name if product.category else None,
                'sales_format': product.sales_format,
                'active': product.active
            }
            products_data.append(product_data)
            
        return jsonify({
            'status': 'success',
            'products': products_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
@app.route('/api/production_orders/<int:order_id>/progress', methods=['PUT'])
def update_order_progress(order_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        progress = data.get('progress')
        if progress is None:
            return jsonify({'error': 'Progress value is required'}), 400
            
        order = ProductionOrder.query.get_or_404(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Update progress
        order.progress = float(progress)
        order.updated_at = datetime.now()
        
        # If progress equals or exceeds the order quantity, update status to "Terminado"
        if float(progress) >= float(order.quantity):
            terminado_status = ProductionOrderStatus.query.filter_by(name='Terminado').first()
            if terminado_status:
                order.current_status = terminado_status
                order.status_id = terminado_status.id
        
        # Create history entry for progress update
        history = ProductionOrderHistory(
            order=order,
            status_id=order.status_id,
            notes=f"Progreso actualizado a {progress} {order.unit}"
        )
        db.session.add(history)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Error saving to database: {str(e)}'
            }), 500
        
        return jsonify({
            'status': 'success',
            'message': 'Progress updated successfully',
            'progress': progress,
            'order_status': order.current_status.name if order.current_status else None
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error updating order progress: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    with app.app_context():
        try:
            # Initialize database and create tables
            init_db()
            app.run(debug=True)
        except Exception as e:
            print(f"Error initializing database: {e}")
            raise
