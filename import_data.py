import sqlite3
import csv

# Connect to the destination database
conn = sqlite3.connect('instance/venezia.db')
cursor = conn.cursor()

# Import products
with open('products.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        cursor.execute('''
            INSERT OR IGNORE INTO product (id, name, category_id, price, is_active, description, sales_format, weight_kg, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (row['id'], row['name'], row['category_id'], row['price'], row['is_active'], row['description'], row['sales_format'], row['weight_kg'], row['created_at'], row['updated_at']))

# Create a mapping from flavor to product_id
flavor_to_product_id = {}
cursor.execute('SELECT id, name FROM product')
for product_id, name in cursor.fetchall():
    flavor_to_product_id[name] = product_id

# Import stock
with open('stock.csv', newline='', encoding='utf-8', errors='replace') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        product_id = flavor_to_product_id.get(row['flavor'])
        if product_id:
            cursor.execute('''
                INSERT OR IGNORE INTO stock (id, store_id, product_id, current_quantity, minimum_quantity, batch_numbers)
                VALUES (?, ?, ?, ?, ?, ?)''',
                (row['id'], row['store_id'], product_id, row['current_quantity'], row['minimum_quantity'], row['batch_numbers']))

# Commit changes and close connection
conn.commit()
conn.close()
