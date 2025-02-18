import sqlite3
import csv

# Connect to the source database
source_conn = sqlite3.connect('instance/icecream_production.db')
source_cursor = source_conn.cursor()

# Export products
source_cursor.execute('SELECT * FROM product')
with open('products.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow([i[0] for i in source_cursor.description])  # write headers
    writer.writerows(source_cursor.fetchall())

# Export stock
source_cursor.execute('SELECT * FROM stock')
with open('stock.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow([i[0] for i in source_cursor.description])  # write headers
    writer.writerows(source_cursor.fetchall())

# Close the source connection
source_conn.close()
