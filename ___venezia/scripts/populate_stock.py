import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import Stock, Product, ProductCategory, Store
import random

def populate_random_stock():
    with app.app_context():
        # Get all stores
        stores = Store.query.all()
        
        # Get all products in the "Sabores" category
        products = Product.query.join(ProductCategory).filter(
            ProductCategory.name == 'Sabores'
        ).all()
        
        print(f"Found {len(stores)} stores and {len(products)} products")
        
        # Delete existing stock entries for Sabores category
        stocks_to_delete = Stock.query.join(Product).join(ProductCategory).filter(
            ProductCategory.name == 'Sabores'
        ).all()
        for stock in stocks_to_delete:
            db.session.delete(stock)
        db.session.commit()
        
        # For each store and product combination
        for store in stores:
            print(f"\nPopulating stock for store: {store.name}")
            for product in products:
                # Generate random current stock between 0 and 30 kg
                current_stock = round(random.uniform(0, 30), 2)
                
                # Generate random minimum stock between 5 and 10 kg
                min_stock = round(random.uniform(5, 10), 2)
                
                # Create new stock entry
                stock = Stock(
                    store_id=store.id,
                    product_id=product.id,
                    current_quantity=current_stock,
                    minimum_quantity=min_stock
                )
                db.session.add(stock)
                print(f"  {product.name}: Current={current_stock}kg, Min={min_stock}kg")
        
        # Commit all changes
        try:
            db.session.commit()
            print("\nSuccessfully populated random stock data!")
        except Exception as e:
            db.session.rollback()
            print(f"\nError populating stock data: {str(e)}")

if __name__ == "__main__":
    populate_random_stock()
