from sqlalchemy import create_engine, inspect

# Connect to the SQLite database
engine = create_engine('sqlite:///instance/venezia.db')

# Create an inspector to get metadata
inspector = inspect(engine)

# Get all table names
tables = inspector.get_table_names()

print("Existing tables:")
for table in tables:
    print(f"- {table}")
    # Get columns for each table
    columns = inspector.get_columns(table)
    for column in columns:
        print(f"  - {column['name']} ({column['type']})")

engine.dispose()
