from app import app, db
from models import WebUser

def recreate_tables():
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("Dropped all tables")
        
        # Create all tables
        db.create_all()
        print("Created all tables")

if __name__ == "__main__":
    recreate_tables()
