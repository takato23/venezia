import sqlite3

def check_table():
    conn = sqlite3.connect('venezia.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(web_users)")
        columns = cursor.fetchall()
        print("\nColumns in web_users table:")
        for column in columns:
            print(f"- {column[1]} ({column[2]})")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_table()
