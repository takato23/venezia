from datetime import datetime
from extensions import db
from flask_login import UserMixin
from fuzzywuzzy import fuzz
from datetime import timedelta
import qrcode
import os
import base64
import json
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash

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

class Provider(db.Model):
    __tablename__ = 'providers'
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)  # 'person' or 'company'
    name = db.Column(db.String(100), nullable=False)
    lastname = db.Column(db.String(100))  # Only for type='person'
    business_name = db.Column(db.String(200))  # Only for type='company'
    cuit = db.Column(db.String(13), unique=True, nullable=False)  # Format: XX-XXXXXXXX-X
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200))
    email = db.Column(db.String(120))
    payment_methods = db.Column(db.String(200))  # Stored as comma-separated values
    business_hours = db.Column(db.String(200))
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def full_name(self):
        if self.type == 'person':
            return f"{self.name} {self.lastname}"
        return self.business_name

    @property
    def whatsapp_link(self):
        phone = f"+549{self.phone}"
        return f"https://wa.me/{phone}"

    @property
    def formatted_phone(self):
        return f"{self.phone}"

    def __repr__(self):
        return f'<Provider {self.full_name}>'

# Provider categories association table
provider_categories = db.Table('provider_categories',
    db.Column('provider_id', db.Integer, db.ForeignKey('providers.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('provider_category.id'), primary_key=True)
)

class ProviderCategory(db.Model):
    __tablename__ = 'provider_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    providers = db.relationship('Provider', secondary=provider_categories, lazy='dynamic',
                              backref=db.backref('categories', lazy=True))

class Store(db.Model):
    __tablename__ = 'stores'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    stocks = db.relationship('Stock', backref='store', lazy=True)
    sales = db.relationship('Sale', backref='store', lazy=True)

class Stock(db.Model):
    __tablename__ = 'stocks'
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Float, default=0)
    minimum_quantity = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StockHistory(db.Model):
    __tablename__ = 'stock_history'
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity_change = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Sale(db.Model):
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_delivery = db.Column(db.Boolean, default=False)
    
    # Relationships
    sale_items = db.relationship('SaleItem', backref='sale', lazy=True)
    delivery_order = db.relationship('DeliveryOrder', backref=db.backref('sale', lazy=True), lazy=True, uselist=False)
    
    # MercadoPago fields
    mp_preference_id = db.Column(db.String(100))
    mp_payment_id = db.Column(db.String(100))
    mp_payment_link = db.Column(db.String(500))
    mp_qr_link = db.Column(db.String(500))
    mp_status = db.Column(db.String(50))
    mp_payment_type = db.Column(db.String(50))
    mp_payment_method = db.Column(db.String(50))
    mp_card_last_four = db.Column(db.String(4))
    mp_rejection_reason = db.Column(db.String(200))
    mp_created_at = db.Column(db.DateTime)
    mp_approved_at = db.Column(db.DateTime)
    mp_last_updated = db.Column(db.DateTime)

class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    flavors = db.Column(db.Text)  # Stored as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Add relationship to Product
    product = db.relationship('Product', backref=db.backref('sale_items', lazy=True))
    
    # Return flavors as a list
    def get_flavors_list(self):
        if self.flavors:
            return json.loads(self.flavors)
        return []
    
    # Set flavors from a list
    def set_flavors_list(self, flavors_list):
        if flavors_list:
            self.flavors = json.dumps(flavors_list)
        else:
            self.flavors = None

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    sales_format = db.Column(db.String(50))  # e.g., "1/4 KG", "1/2 KG", "1 KG"
    weight_kg = db.Column(db.Float)
    max_flavors = db.Column(db.Integer)  # Add this line
    active = db.Column(db.Boolean, default=True)
    track_stock = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    stocks = db.relationship('Stock', backref='product', lazy=True)
    recipe = db.relationship('Recipe', backref='product', lazy=True, uselist=False)
    category = db.relationship('ProductCategory', backref=db.backref('products', lazy=True, overlaps="category,category_ref"), lazy=True)

class Recipe(db.Model):
    __tablename__ = 'recipes'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False, default='flavor')
    name = db.Column(db.String(100), nullable=False)
    instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ingredients = db.relationship('RecipeIngredient', backref='recipe', lazy=True)

class RecipeIngredient(db.Model):
    __tablename__ = 'recipe_ingredients'
    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)
    ingredient_id = db.Column(db.Integer, db.ForeignKey('ingredients.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    ingredient = db.relationship('Ingredient', backref=db.backref('recipe_ingredients', lazy=True))

class Ingredient(db.Model):
    __tablename__ = 'ingredients'
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('providers.id'))
    name = db.Column(db.String(100), nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    cost_per_unit = db.Column(db.Float, nullable=False)
    current_stock = db.Column(db.Float, default=0.0)
    minimum_stock = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IngredientTransaction(db.Model):
    __tablename__ = 'ingredient_transactions'
    id = db.Column(db.Integer, primary_key=True)
    ingredient_id = db.Column(db.Integer, db.ForeignKey('ingredients.id'), nullable=False)
    production_id = db.Column(db.Integer, db.ForeignKey('productions.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'purchase' or 'usage'
    unit_cost = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.String(255))
    ingredient = db.relationship('Ingredient', backref='transactions')

class Production(db.Model):
    __tablename__ = 'productions'
    id = db.Column(db.Integer, primary_key=True)
    batch_number = db.Column(db.String(50), unique=True, nullable=False)
    flavor = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    production_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    assigned_store_id = db.Column(db.Integer, db.ForeignKey('stores.id', name='fk_production_assigned_store'))
    assigned_at = db.Column(db.DateTime)
    assigned_store = db.relationship('Store', foreign_keys=[assigned_store_id], backref='assigned_productions')
    operator = db.Column(db.String(100))
    notes = db.Column(db.Text)
    production_cost = db.Column(db.Float)
    end_time = db.Column(db.DateTime)
    success_status = db.Column(db.String(10), default='success')  # success, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def generate_batch_number(flavor):
        flavor_code = FLAVORS[flavor]
        last_production = Production.query.filter(
            Production.batch_number.like(f'{flavor_code}%')
        ).order_by(Production.batch_number.desc()).first()
        
        if last_production:
            last_number = int(last_production.batch_number[5:])
            new_number = last_number + 1
        else:
            new_number = 1
        
        return f"{flavor_code}{new_number:04d}"

class ProductionCost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    production_id = db.Column(db.Integer, db.ForeignKey('productions.id'), nullable=False)
    ingredient = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_cost = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    production = db.relationship('Production', backref='costs')

class GeneralMinimum(db.Model):
    __tablename__ = 'general_minimums'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, unique=True)
    quantity = db.Column(db.Float, nullable=False)
    product = db.relationship('Product', backref=db.backref('minimum', uselist=False))

class ProductCategory(db.Model):
    __tablename__ = 'product_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

class DeliveryAddress(db.Model):
    __tablename__ = 'delivery_addresses'
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    landmark = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def whatsapp_link(self):
        phone = f"+549{self.phone}"
        return f"https://wa.me/{phone}"
    
    @property
    def search_text(self):
        """Concatenated text for searching"""
        return f"{self.customer_name} {self.phone} {self.address} {self.landmark or ''}"
    
    def match_score(self, query):
        """Calculate how well this address matches a search query"""
        # Clean phone numbers for comparison
        clean_query = ''.join(filter(str.isdigit, query))
        clean_phone = ''.join(filter(str.isdigit, self.phone))
        
        # Check for exact phone match first
        if clean_query and clean_phone.endswith(clean_query):
            return 100
            
        # Calculate fuzzy match scores for different fields
        name_score = fuzz.partial_ratio(query.lower(), self.customer_name.lower())
        address_score = fuzz.partial_ratio(query.lower(), self.address.lower())
        
        # Include landmark in search if it exists
        landmark_score = 0
        if self.landmark:
            landmark_score = fuzz.partial_ratio(query.lower(), self.landmark.lower())
        
        # Return the highest matching score
        return max(name_score, address_score, landmark_score)
    
    @classmethod
    def search(cls, query, min_score=60):
        """
        Search for delivery addresses that match the query.
        Returns a list of tuples (address, score) sorted by score.
        """
        addresses = cls.query.all()
        results = []
        
        for addr in addresses:
            score = addr.match_score(query)
            if score >= min_score:
                results.append((addr, score))
        
        # Sort by score descending
        return sorted(results, key=lambda x: x[1], reverse=True)

class DeliveryStatus(db.Model):
    __tablename__ = 'delivery_statuses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    color_code = db.Column(db.String(7))  # Hex color code
    order = db.Column(db.Integer, nullable=False)  # For ordering in UI
    
    def __repr__(self):
        return f'<DeliveryStatus {self.name}>'

class DeliveryStatusHistory(db.Model):
    __tablename__ = 'delivery_status_history'
    
    id = db.Column(db.Integer, primary_key=True)
    delivery_order_id = db.Column(db.Integer, db.ForeignKey('delivery_orders.id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('delivery_statuses.id'), nullable=False)
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    status = db.relationship('DeliveryStatus')
    order = db.relationship('DeliveryOrder', backref=db.backref('status_history', lazy=True))

class DeliveryOrder(db.Model):
    __tablename__ = 'delivery_orders'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    address_id = db.Column(db.Integer, db.ForeignKey('delivery_addresses.id'), nullable=False)
    current_status_id = db.Column(db.Integer, db.ForeignKey('delivery_statuses.id'), nullable=False)
    delivery_notes = db.Column(db.Text)
    store_latitude = db.Column(db.Float)
    store_longitude = db.Column(db.Float)
    distance_km = db.Column(db.Float)
    mp_preference_id = db.Column(db.String(100))
    mp_payment_id = db.Column(db.String(100))
    mp_payment_link = db.Column(db.String(500))
    mp_qr_link = db.Column(db.String(500))
    mp_status = db.Column(db.String(50))
    mp_payment_type = db.Column(db.String(50))
    mp_payment_method = db.Column(db.String(50))
    mp_card_last_four = db.Column(db.String(4))
    mp_rejection_reason = db.Column(db.String(200))
    mp_created_at = db.Column(db.DateTime)
    mp_approved_at = db.Column(db.DateTime)
    mp_last_updated = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    order_source = db.Column(db.String(20), default='POS')  # 'POS' or 'WEBSHOP'

    # Relationships
    address = db.relationship('DeliveryAddress', backref='delivery_orders')
    current_status = db.relationship('DeliveryStatus', backref='delivery_orders')

    def update_status(self, status_id, notes=None, created_by='system'):
        """Update the delivery order status and create a history entry"""
        self.current_status_id = status_id
        
        # Create history entry
        history = DeliveryStatusHistory(
            delivery_order_id=self.id,
            status_id=status_id,
            notes=notes,
            created_by=created_by
        )
        db.session.add(history)
        
        # If status is 'Delivered', set actual delivery time
        status = DeliveryStatus.query.get(status_id)
        if status and status.name == 'Delivered':
            self.actual_delivery_time = datetime.utcnow()
        
        db.session.commit()
    
    def calculate_estimated_time(self):
        """Calculate estimated delivery time based on distance and current orders"""
        # Base time: 15 minutes preparation + 3 minutes per kilometer
        base_minutes = 15 + (self.distance_km * 3)
        
        # Add some buffer for current order load
        # TODO: Implement more sophisticated calculation based on current orders
        buffer_minutes = 10
        
        self.estimated_delivery_time = datetime.utcnow() + timedelta(minutes=base_minutes + buffer_minutes)
    
    def generate_qr_code(self):
        """Generate a QR code for tracking the delivery"""
        import qrcode
        import base64
        from io import BytesIO
        
        # Create the data to encode
        data = {
            'order_id': self.id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Convert to base64 encoded string
        encoded_data = base64.urlsafe_b64encode(json.dumps(data).encode()).decode()
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # The URL that will be encoded in the QR code
        tracking_url = f'/delivery/status/{encoded_data}'
        qr.add_data(tracking_url)
        qr.make(fit=True)
        
        # Create the QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to BytesIO object
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        # Convert to base64 string
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Save the data URL to the database
        self.qr_code = f'data:image/png;base64,{qr_base64}'

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

class WebUser(db.Model):
    __tablename__ = 'web_users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)  # Made required
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(100), default='Argentina')
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    newsletter_subscription = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'country': self.country,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'gender': self.gender,
            'newsletter_subscription': self.newsletter_subscription,
            'last_login': self.last_login.strftime('%Y-%m-%d %H:%M:%S') if self.last_login else None,
            'registration_date': self.registration_date.strftime('%Y-%m-%d %H:%M:%S'),
            'active': self.active
        }

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f'<WebUser {self.email}>'

class ProductionOrderStatus(db.Model):
    __tablename__ = 'production_order_statuses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    color_code = db.Column(db.String(7))  # Hex color code
    order = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProductionOrder(db.Model):
    __tablename__ = 'production_orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(10), nullable=False)  # kg, l, u
    notes = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)  # 1=low, 2=medium, 3=high
    due_date = db.Column(db.DateTime)
    status_id = db.Column(db.Integer, db.ForeignKey('production_order_statuses.id'))
    progress = db.Column(db.Float, default=0)  # Progress in units/kg produced
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    production_id = db.Column(db.Integer, db.ForeignKey('productions.id', name='fk_production_order_production'))  # Reference to the created production
    
    product = db.relationship('Product', backref='production_orders')
    current_status = db.relationship('ProductionOrderStatus')
    status_history = db.relationship('ProductionOrderHistory', back_populates='order')
    production = db.relationship('Production', foreign_keys=[production_id], backref='source_order')

    def __init__(self, **kwargs):
        super(ProductionOrder, self).__init__(**kwargs)
        if not self.order_number:
            # Generate order number: PO-YYYYMMDD-XXXX
            today = datetime.now()
            prefix = f"PO-{today.strftime('%Y%m%d')}-"
            
            # Get the last order number for today
            last_order = ProductionOrder.query.filter(
                ProductionOrder.order_number.like(f"{prefix}%")
            ).order_by(ProductionOrder.order_number.desc()).first()
            
            if last_order:
                last_number = int(last_order.order_number.split('-')[-1])
                new_number = str(last_number + 1).zfill(4)
            else:
                new_number = '0001'
            
            self.order_number = f"{prefix}{new_number}"

class ProductionOrderHistory(db.Model):
    __tablename__ = 'production_order_history'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('production_orders.id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('production_order_statuses.id'), nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    order = db.relationship('ProductionOrder', back_populates='status_history')
    status = db.relationship('ProductionOrderStatus')
