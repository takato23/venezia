from app import app, db, Product, ProductCategory

def check_categories():
    with app.app_context():
        print("\nProduct Categories:")
        categories = ProductCategory.query.all()
        for cat in categories:
            print(f"- {cat.name}")
            
        print("\nProducts in Sabores category:")
        sabores = ProductCategory.query.filter_by(name='Sabores').first()
        if sabores:
            products = Product.query.filter_by(category_id=sabores.id).all()
            for prod in products:
                print(f"- {prod.name} (${prod.price}): {prod.description}")

if __name__ == '__main__':
    check_categories()
