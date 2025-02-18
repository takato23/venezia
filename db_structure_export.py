import sqlite3
import json
from pathlib import Path

def get_table_info(cursor, table_name):
    # Get table schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    # Get foreign keys
    cursor.execute(f"PRAGMA foreign_key_list({table_name})")
    foreign_keys = cursor.fetchall()
    
    # Get indexes
    cursor.execute(f"PRAGMA index_list({table_name})")
    indexes = cursor.fetchall()
    
    return {
        "columns": [
            {
                "name": col[1],
                "type": col[2],
                "notnull": bool(col[3]),
                "default_value": col[4],
                "is_primary_key": bool(col[5])
            }
            for col in columns
        ],
        "foreign_keys": [
            {
                "from": fk[3],
                "to_table": fk[2],
                "to_column": fk[4],
                "on_update": fk[5],
                "on_delete": fk[6]
            }
            for fk in foreign_keys
        ],
        "indexes": [
            {
                "name": idx[1],
                "unique": bool(idx[2])
            }
            for idx in indexes
        ]
    }

def export_db_structure():
    db_path = Path("instance/venezia.db")
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = cursor.fetchall()
    
    db_structure = {}
    for (table_name,) in tables:
        db_structure[table_name] = get_table_info(cursor, table_name)
    
    # Export to JSON file
    output_path = Path("db_structure.json")
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(db_structure, f, indent=2, ensure_ascii=False)
    
    print(f"Database structure exported to {output_path.absolute()}")
    
    # Close connection
    conn.close()

if __name__ == "__main__":
    try:
        export_db_structure()
    except Exception as e:
        print(f"Error exporting database structure: {e}")
