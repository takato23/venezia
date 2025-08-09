-- Seed básico de productos para POS (idempotente)
INSERT OR IGNORE INTO products (id, name, description, price, stock, current_stock, category_id, context, active)
VALUES 
  (101, 'Cucurucho simple', 'Helado en cucurucho - una bocha', 2500, 100, 100, 1, 'pos', 1),
  (102, 'Cucurucho doble', 'Helado en cucurucho - dos bochas', 4200, 100, 100, 1, 'pos', 1),
  (103, '1/4 kg', 'Helado por cuarto kilo', 3800, 100, 100, 1, 'pos', 1),
  (104, '1/2 kg', 'Helado por medio kilo', 6900, 100, 100, 1, 'pos', 1),
  (105, '1 kg', 'Helado por kilo', 11900, 100, 100, 1, 'pos', 1),
  (106, 'Topping choco', 'Topping de chocolate', 900, 200, 200, 5, 'pos', 1);


