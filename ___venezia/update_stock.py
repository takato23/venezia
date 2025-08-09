import sqlite3
import random

# Connect to the database
conn = sqlite3.connect('instance/venezia.db')
c = conn.cursor()

# List of flavors
flavors = [
    'Dulce de Leche Clásico', 'Dulce de Leche Granizado', 'Chocolate Amargo',
    'Chocolate Suizo', 'Vainilla', 'Crema Americana', 'Frutilla a la Crema',
    'Banana Split', 'Limón', 'Frambuesa', 'Durazno', 'Naranja', 'Mango',
    'Ananá (Piña)', 'Cereza', 'Marroc', 'Sambayón', 'Crema de Almendras',
    'Tramontana', 'Coco'
]

# Update stock for each flavor in both stores
for store_id in [1, 2]:
    for flavor in flavors:
        stock = round(random.uniform(3, 20), 2)
        # Check if the stock record exists
        c.execute('SELECT id FROM stock WHERE store_id = ? AND product_id = (SELECT id FROM product WHERE name = ?)', (store_id, flavor))
        result = c.fetchone()
        if result:
            # Update existing stock
            c.execute('UPDATE stock SET current_quantity = ? WHERE id = ?', (stock, result[0]))
        else:
            # Insert new stock record
            c.execute('INSERT INTO stock (store_id, product_id, current_quantity, minimum_quantity) VALUES (?, (SELECT id FROM product WHERE name = ?), ?, 3)', (store_id, flavor, stock))

# Commit changes and close connection
conn.commit()
conn.close()
