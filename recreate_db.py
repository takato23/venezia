from app import db, app, Store, Category, Product
import os

# Remove existing database
db_path = 'instance/venezia.db'
if os.path.exists(db_path):
    os.remove(db_path)

# Create all tables with new schema
with app.app_context():
    db.create_all()
    
    # Create initial stores if they don't exist
    stores = [
        Store(name='Tienda Principal'),
        Store(name='Sucursal Centro')
    ]
    db.session.add_all(stores)
    
    # Create Sabores category if it doesn't exist
    sabores = Category(name='Sabores')
    db.session.add(sabores)
    
    db.session.commit()
    print("Database recreated successfully!")
