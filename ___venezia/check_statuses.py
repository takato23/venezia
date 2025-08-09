import sqlite3
import sys
import os

# Get the absolute path to the database
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, 'instance', 'venezia.db')

try:
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file {DB_PATH} not found", file=sys.stderr)
        sys.exit(1)

    # Use direct SQLite connection with timeout
    conn = sqlite3.connect(DB_PATH, timeout=10)
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, name, "order" FROM delivery_status ORDER BY "order"')
        statuses = cursor.fetchall()
        
        print("\nCurrent delivery statuses:")
        for status in statuses:
            print(f"ID: {status[0]}, Name: {status[1]}, Order: {status[2]}")
            
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()
        
except Exception as e:
    print(f"Application error: {str(e)}", file=sys.stderr)
    sys.exit(1)
