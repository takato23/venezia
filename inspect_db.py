import sqlite3

def inspect_db():
    conn = sqlite3.connect('instance/venezia.db')
    cursor = conn.cursor()
    
    # Get list of tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in database:")
    for table in tables:
        print(f"\n{table[0]}:")
        # Get table schema
        cursor.execute(f"PRAGMA table_info({table[0]});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col}")
        # Get foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({table[0]});")
        fks = cursor.fetchall()
        if fks:
            print("  Foreign Keys:")
            for fk in fks:
                print(f"    {fk}")
    
    conn.close()

if __name__ == '__main__':
    inspect_db()
