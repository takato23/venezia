import sqlite3

def add_address_column():
    # Connect to the database
    conn = sqlite3.connect('venezia.db')
    cursor = conn.cursor()
    
    try:
        # Create web_users table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS web_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            city TEXT,
            state TEXT,
            postal_code TEXT,
            country TEXT DEFAULT 'Argentina',
            date_of_birth DATE,
            gender TEXT,
            newsletter_subscription BOOLEAN DEFAULT 1,
            last_login DATETIME,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active BOOLEAN DEFAULT 1
        )
        """)
        print("Created/verified web_users table")
        
        # Check if the address column exists
        cursor.execute("PRAGMA table_info(web_users)")
        columns = cursor.fetchall()
        has_address = any(column[1] == 'address' for column in columns)
        
        # Add the address column if it doesn't exist
        if not has_address:
            cursor.execute("ALTER TABLE web_users ADD COLUMN address TEXT")
            print("Added address column to web_users table")
        
        # Commit the changes
        conn.commit()
        print("Database updated successfully")
        
    except Exception as e:
        print(f"Error updating database: {str(e)}")
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == "__main__":
    add_address_column()
