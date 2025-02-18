import sqlite3
import os

def setup_delivery_statuses():
    # Define the database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'venezia.db')
    
    # Create delivery statuses if they don't exist
    statuses = [
        {
            'name': 'Preparing',
            'description': 'Order is being prepared',
            'color_code': '#FFA500',  # Orange
            'order': 1
        },
        {
            'name': 'Ready',
            'description': 'Order is ready for pickup by delivery person',
            'color_code': '#4169E1',  # Royal Blue
            'order': 2
        },
        {
            'name': 'Out for Delivery',
            'description': 'Order is on its way',
            'color_code': '#32CD32',  # Lime Green
            'order': 3
        },
        {
            'name': 'Delivered',
            'description': 'Order has been delivered',
            'color_code': '#228B22',  # Forest Green
            'order': 4
        },
        {
            'name': 'Cancelled',
            'description': 'Order has been cancelled',
            'color_code': '#FF0000',  # Red
            'order': 5
        }
    ]

    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # For each status, insert if it doesn't exist
        for status in statuses:
            cursor.execute('''
                INSERT OR IGNORE INTO delivery_status (name, description, color_code, "order")
                VALUES (?, ?, ?, ?)
            ''', (status['name'], status['description'], status['color_code'], status['order']))

        # Commit changes and close connection
        conn.commit()
        conn.close()
        print("Delivery statuses have been set up successfully!")
        
    except Exception as e:
        print(f"Error setting up delivery statuses: {e}")

if __name__ == '__main__':
    setup_delivery_statuses()
