import sqlite3
import random

# Connect to the database
conn = sqlite3.connect('instance/venezia.db')
c = conn.cursor()

# Retrieve all flavors
c.execute('SELECT id, name FROM product')
products = c.fetchall()

# Update stock for each product in both stores
for store_id in [1, 2]:
    for product_id, name in products:
        stock = round(random.uniform(3, 20), 2)
        # Check if the stock record exists
        c.execute('SELECT id FROM stock WHERE store_id = ? AND product_id = ?', (store_id, product_id))
        result = c.fetchone()
        if result:
            # Update existing stock
            c.execute('UPDATE stock SET current_quantity = ? WHERE id = ?', (stock, result[0]))
        else:
            # Insert new stock record
            c.execute('INSERT INTO stock (store_id, product_id, current_quantity, minimum_quantity) VALUES (?, ?, ?, 3)', (store_id, product_id, stock))

# Commit changes and close connection
conn.commit()
conn.close()
