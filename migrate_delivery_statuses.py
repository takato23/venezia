import sqlite3
import os
import sys

# Get the absolute path to the database
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, 'instance', 'venezia.db')

# Status mapping from English to Spanish IDs
STATUS_MAPPING = {
    6: 1,  # Preparing -> Pendiente
    7: 2,  # Ready -> En Preparación
    8: 3,  # Out for Delivery -> En Camino
    9: 4,  # Delivered -> Entregado
    10: 5, # Cancelled -> Cancelado
}

try:
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file {DB_PATH} not found", file=sys.stderr)
        sys.exit(1)

    # Use direct SQLite connection with timeout
    conn = sqlite3.connect(DB_PATH, timeout=10)
    cursor = conn.cursor()
    
    try:
        # Start a transaction
        cursor.execute("BEGIN TRANSACTION")
        
        # Update delivery_status_history table
        for eng_id, esp_id in STATUS_MAPPING.items():
            cursor.execute("""
                UPDATE delivery_status_history 
                SET status_id = ? 
                WHERE status_id = ?
            """, (esp_id, eng_id))
            rows = cursor.rowcount
            print(f"Updated {rows} records in delivery_status_history from status {eng_id} to {esp_id}")

        # Update delivery_order table
        for eng_id, esp_id in STATUS_MAPPING.items():
            cursor.execute("""
                UPDATE delivery_order 
                SET current_status_id = ? 
                WHERE current_status_id = ?
            """, (esp_id, eng_id))
            rows = cursor.rowcount
            print(f"Updated {rows} records in delivery_order from status {eng_id} to {esp_id}")

        # Delete English statuses
        eng_ids = list(STATUS_MAPPING.keys())
        cursor.execute(f"""
            DELETE FROM delivery_status 
            WHERE id IN ({','.join('?' * len(eng_ids))})
        """, eng_ids)
        rows = cursor.rowcount
        print(f"\nRemoved {rows} English status entries")

        # Commit the transaction
        cursor.execute("COMMIT")
        print("\nMigration completed successfully!")
        
        # Verify current statuses
        cursor.execute('SELECT id, name, "order" FROM delivery_status ORDER BY "order"')
        statuses = cursor.fetchall()
        print("\nCurrent delivery statuses:")
        for status in statuses:
            print(f"ID: {status[0]}, Name: {status[1]}, Order: {status[2]}")
            
    except sqlite3.Error as e:
        cursor.execute("ROLLBACK")
        print(f"Database error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()
        
except Exception as e:
    print(f"Application error: {str(e)}", file=sys.stderr)
    sys.exit(1)
