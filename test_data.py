from app import app, db, Store, Product, Sale, SaleItem
from datetime import datetime, timedelta
import random
import json

def generate_test_sales():
    try:
        stores = Store.query.all()
        products = Product.query.all()
        payment_methods = ['cash', 'card', 'transfer']
        payment_statuses = ['paid', 'pending']
        
        # Generate sales for the last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        current_date = start_date
        
        while current_date <= end_date:
            # Generate 1-5 sales per day
            num_sales = random.randint(1, 5)
            for _ in range(num_sales):
                # Create a sale
                sale = Sale(
                    store_id=random.choice(stores).id,
                    payment_method=random.choice(payment_methods),
                    payment_status=random.choice(payment_statuses),
                    created_at=current_date + timedelta(hours=random.randint(8, 20)),
                    is_delivery=random.choice([True, False]),
                    total_amount=0
                )
                db.session.add(sale)
                db.session.flush()  # Get sale.id
                
                # Add 1-3 items to the sale
                total_amount = 0
                for _ in range(random.randint(1, 3)):
                    product = random.choice(products)
                    quantity = random.randint(1, 3)
                    unit_price = random.uniform(100, 500)
                    total_price = quantity * unit_price
                    total_amount += total_price
                    
                    item = SaleItem(
                        sale_id=sale.id,
                        product_id=product.id,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        flavors=json.dumps(['Chocolate', 'Vainilla']) if random.choice([True, False]) else None
                    )
                    db.session.add(item)
                
                sale.total_amount = total_amount
            
            current_date += timedelta(days=1)
        
        db.session.commit()
        print('Test sales data generated successfully')
        
    except Exception as e:
        db.session.rollback()
        print(f'Error generating test sales: {str(e)}')

if __name__ == '__main__':
    with app.app_context():
        generate_test_sales()
