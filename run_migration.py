from app import app, db
from migrations.add_fields_to_web_users import upgrade

with app.app_context():
    upgrade()
    print("Migration completed successfully")
