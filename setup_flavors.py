import sqlite3
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('instance/venezia.db')
c = conn.cursor()

# Create "Sabores" category if it doesn't exist
c.execute('''
    INSERT OR IGNORE INTO product_category (name, description)
    VALUES (?, ?)
''', ('Sabores', 'Todos los sabores de helados disponibles'))

# Get the category ID
c.execute('SELECT id FROM product_category WHERE name = ?', ('Sabores',))
category_id = c.fetchone()[0]

# List of all flavors
flavors = [
    'Dulce de Leche Clásico', 'Dulce de Leche Granizado', 'Chocolate Amargo',
    'Chocolate Suizo', 'Vainilla', 'Crema Americana', 'Frutilla a la Crema',
    'Banana Split', 'Limón', 'Frambuesa', 'Durazno', 'Naranja', 'Mango',
    'Ananá (Piña)', 'Cereza', 'Marroc', 'Sambayón', 'Crema de Almendras',
    'Tramontana', 'Coco'
]

# Add each flavor as a product
for flavor in flavors:
    c.execute('''
        INSERT OR IGNORE INTO product 
        (name, category_id, price, is_active, description, sales_format, weight_kg, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        flavor,
        category_id,
        0,  # price (can be updated later)
        True,  # is_active
        f'Helado sabor {flavor}',
        'KG',
        1.0,
        datetime.utcnow(),
        datetime.utcnow()
    ))

# Initialize stock for main store (Tienda Principal)
c.execute('SELECT id FROM store WHERE name = ?', ('Tienda Principal',))
main_store_id = c.fetchone()[0]

# Get all product IDs for flavors
c.execute('''
    SELECT id FROM product 
    WHERE category_id = (SELECT id FROM product_category WHERE name = 'Sabores')
''')
flavor_products = c.fetchall()

# Initialize stock records for each flavor
for (product_id,) in flavor_products:
    c.execute('''
        INSERT OR IGNORE INTO stock 
        (store_id, product_id, current_quantity, minimum_quantity)
        VALUES (?, ?, ?, ?)
    ''', (main_store_id, product_id, 0, 3))

# Commit changes and close connection
conn.commit()
conn.close()

print("Flavors setup completed successfully!")
