import os
from app import db, app
from app import Store, Product, ProductCategory
from app import Ingredient, Recipe, RecipeIngredient, IngredientTransaction, Provider, Stock
from datetime import datetime

def reset_database():
    print("Starting database reset...")
    
    # Remove the existing database file
    db_path = 'venezia.db'  
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print(f"Removed existing database: {db_path}")
        except Exception as e:
            print(f"Error removing database: {str(e)}")
            return

    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating tables...")
        db.create_all()
        
        try:
            # Create stores
            stores = [
                Store(
                    name='Tienda Principal',
                    address='Av. Rivadavia 3526, Almagro, CABA'
                ),
                Store(
                    name='Sucursal Caballito',
                    address='Av. Pedro Goyena 1234, Caballito, CABA'
                ),
                Store(
                    name='Sucursal Flores',
                    address='Av. Rivadavia 6587, Flores, CABA'
                ),
                Store(
                    name='Sucursal Villa Crespo',
                    address='Av. Corrientes 5123, Villa Crespo, CABA'
                )
            ]
            for store in stores:
                db.session.add(store)
            db.session.commit()
            print("Added stores")

            # Create product categories
            categories = [
                ProductCategory(name='Helado'),  # For potes
                ProductCategory(name='Sabores'),  # For ice cream flavors
                ProductCategory(name='Postres Helados'),  # For ice cream desserts
                ProductCategory(name='Productos Envasados')  # For packaged products
            ]
            for category in categories:
                db.session.add(category)
            db.session.commit()
            print("Added product categories")

            # Get category references
            helado_category = ProductCategory.query.filter_by(name='Helado').first()
            sabores_category = ProductCategory.query.filter_by(name='Sabores').first()
            postres_category = ProductCategory.query.filter_by(name='Postres Helados').first()
            envasados_category = ProductCategory.query.filter_by(name='Productos Envasados').first()

            # Create sample products
            products = [
                # Potes
                Product(
                    name='Pote 1/4 KG',
                    price=5000,
                    category_id=helado_category.id,
                    active=True,
                    track_stock=False,
                    weight_kg=0.25,
                    max_flavors=2,
                    description='Pote de helado 1/4 KG'
                ),
                Product(
                    name='Pote 1/2 KG',
                    price=8000,
                    category_id=helado_category.id,
                    active=True,
                    track_stock=False,
                    weight_kg=0.5,
                    max_flavors=3,
                    description='Pote de helado 1/2 KG'
                ),
                Product(
                    name='Pote 1 KG',
                    price=12000,
                    category_id=helado_category.id,
                    active=True,
                    track_stock=False,
                    weight_kg=1.0,
                    max_flavors=4,
                    description='Pote de helado 1 KG'
                ),

                # Ice cream flavors
                Product(name='Dulce de Leche Clásico', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de dulce de leche clásico'),
                Product(name='Dulce de Leche Granizado', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de dulce de leche con chocolate'),
                Product(name='Chocolate Amargo', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de chocolate amargo'),
                Product(name='Chocolate Suizo', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de chocolate con trozos de chocolate'),
                Product(name='Vainilla', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de vainilla'),
                Product(name='Crema Americana', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de crema americana'),
                Product(name='Frutilla a la Crema', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de frutilla con crema'),
                Product(name='Banana Split', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de banana split'),
                Product(name='Limón', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de limón'),
                Product(name='Frambuesa', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de frambuesa'),
                Product(name='Durazno', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de durazno'),
                Product(name='Naranja', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de naranja'),
                Product(name='Mango', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de mango'),
                Product(name='Ananá (Piña)', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de ananá'),
                Product(name='Cereza', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de cereza'),
                Product(name='Marroc', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de marroc'),
                Product(name='Sambayón', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de sambayón'),
                Product(name='Crema de Almendras', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de crema de almendras'),
                Product(name='Tramontana', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de tramontana'),
                Product(name='Coco', price=0, category_id=sabores_category.id, active=True, track_stock=True, description='Helado de coco'),

                # Ice cream desserts
                Product(
                    name='Palito Bombon',
                    price=1000,
                    category_id=postres_category.id,
                    active=True,
                    track_stock=True,
                    description='Palito bombón helado'
                ),
                Product(
                    name='Torta Helada',
                    price=15000,
                    category_id=postres_category.id,
                    active=True,
                    track_stock=True,
                    description='Torta helada decorada'
                ),
                Product(
                    name='Bombones Helados',
                    price=8000,
                    category_id=postres_category.id,
                    active=True,
                    track_stock=True,
                    description='Caja de bombones helados'
                ),

                # Packaged products
                Product(
                    name='Cucurucho',
                    price=200,
                    category_id=envasados_category.id,
                    active=True,
                    track_stock=True,
                    description='Cucurucho de helado'
                ),
                Product(
                    name='Barquillo',
                    price=100,
                    category_id=envasados_category.id,
                    active=True,
                    track_stock=True,
                    description='Barquillo de helado'
                )
            ]
            
            for product in products:
                db.session.add(product)
            db.session.commit()
            print("Added sample products")

            # Add stock for products that need tracking
            stores = Store.query.all()
            for store in stores:
                for product in products:
                    if product.track_stock:
                        initial_stock = 10
                        if product.name == 'Dulce de Leche Clásico':
                            initial_stock = 86
                        elif product.name == 'Dulce de Leche Granizado':
                            initial_stock = 18
                        elif product.name == 'Chocolate Amargo':
                            initial_stock = 30
                        elif product.name == 'Chocolate Suizo':
                            initial_stock = 18
                        elif product.name == 'Vainilla':
                            initial_stock = 15
                        elif product.name == 'Palito Bombon':
                            initial_stock = 14942

                        stock = Stock(
                            store_id=store.id,
                            product_id=product.id,
                            quantity=initial_stock,
                            minimum_quantity=10 if product.category_id == sabores_category.id else 0
                        )
                        db.session.add(stock)
            db.session.commit()
            print("Added stock for products")

        except Exception as e:
            print(f"Error during database initialization: {str(e)}")
            return

        print("Database reset completed successfully!")

if __name__ == "__main__":
    reset_database()
