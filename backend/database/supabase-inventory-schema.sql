-- Supabase Inventory Management Schema
-- This schema defines tables for ingredients, recipes, and their relationships
-- with proper RLS policies, indexes, and triggers for a restaurant/food service application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INGREDIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'g', 'ml', 'l', 'units'
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    minimum_stock DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    maximum_stock DECIMAL(10, 3),
    supplier VARCHAR(255),
    category VARCHAR(100), -- e.g., 'dairy', 'meat', 'vegetables', 'spices'
    is_active BOOLEAN DEFAULT true,
    barcode VARCHAR(100),
    storage_location VARCHAR(255),
    shelf_life_days INTEGER,
    allergens TEXT[], -- Array of allergen types
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT positive_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
    CONSTRAINT positive_minimum_stock CHECK (minimum_stock >= 0),
    CONSTRAINT valid_stock_range CHECK (maximum_stock IS NULL OR maximum_stock >= minimum_stock)
);

-- Create indexes for ingredients
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_is_active ON ingredients(is_active);
CREATE INDEX idx_ingredients_barcode ON ingredients(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_ingredients_low_stock ON ingredients(stock_quantity, minimum_stock) 
    WHERE is_active = true;

-- Create updated_at trigger for ingredients
CREATE TRIGGER set_timestamp_ingredients
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =====================================================
-- RECIPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'appetizer', 'main', 'dessert', 'beverage'
    preparation_time INTEGER, -- in minutes
    cooking_time INTEGER, -- in minutes
    servings INTEGER DEFAULT 1,
    difficulty_level VARCHAR(20), -- e.g., 'easy', 'medium', 'hard'
    instructions TEXT,
    notes TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    selling_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2) DEFAULT 0.00, -- Will be calculated from ingredients
    profit_margin DECIMAL(5, 2) GENERATED ALWAYS AS 
        (CASE 
            WHEN selling_price > 0 THEN ((selling_price - cost_price) / selling_price * 100)
            ELSE 0 
        END) STORED,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT positive_times CHECK (
        (preparation_time IS NULL OR preparation_time >= 0) AND 
        (cooking_time IS NULL OR cooking_time >= 0)
    ),
    CONSTRAINT positive_servings CHECK (servings > 0),
    CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('easy', 'medium', 'hard') OR difficulty_level IS NULL),
    CONSTRAINT positive_prices CHECK (
        (selling_price IS NULL OR selling_price >= 0) AND 
        cost_price >= 0
    )
);

-- Create indexes for recipes
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_is_active ON recipes(is_active);
CREATE INDEX idx_recipes_profit_margin ON recipes(profit_margin) WHERE is_active = true;

-- Create updated_at trigger for recipes
CREATE TRIGGER set_timestamp_recipes
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =====================================================
-- RECIPE_INGREDIENTS TABLE (Junction/Bridge table)
-- =====================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50), -- Optional: override ingredient's default unit
    notes TEXT, -- e.g., 'finely chopped', 'room temperature'
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT unique_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
);

-- Create indexes for recipe_ingredients
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Create updated_at trigger for recipe_ingredients
CREATE TRIGGER set_timestamp_recipe_ingredients
BEFORE UPDATE ON recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for recipes with calculated total cost
CREATE OR REPLACE VIEW recipes_with_cost AS
SELECT 
    r.*,
    COALESCE(SUM(ri.quantity * i.unit_cost), 0) as calculated_cost,
    COUNT(ri.id) as ingredient_count
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id AND i.is_active = true
GROUP BY r.id;

-- View for ingredients that are low on stock
CREATE OR REPLACE VIEW low_stock_ingredients AS
SELECT 
    i.*,
    (i.stock_quantity < i.minimum_stock) as is_below_minimum,
    (i.minimum_stock - i.stock_quantity) as quantity_needed
FROM ingredients i
WHERE i.is_active = true 
    AND i.stock_quantity < i.minimum_stock;

-- View for recipe ingredients with full details
CREATE OR REPLACE VIEW recipe_ingredients_detailed AS
SELECT 
    ri.*,
    r.name as recipe_name,
    r.category as recipe_category,
    i.name as ingredient_name,
    i.unit as ingredient_unit,
    i.unit_cost,
    i.stock_quantity,
    (ri.quantity * i.unit_cost) as line_cost,
    CASE 
        WHEN i.stock_quantity >= ri.quantity THEN true 
        ELSE false 
    END as in_stock
FROM recipe_ingredients ri
JOIN recipes r ON ri.recipe_id = r.id
JOIN ingredients i ON ri.ingredient_id = i.id;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update recipe cost based on ingredients
CREATE OR REPLACE FUNCTION update_recipe_cost(recipe_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE recipes
    SET cost_price = (
        SELECT COALESCE(SUM(ri.quantity * i.unit_cost), 0)
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = recipe_id_param
            AND i.is_active = true
    )
    WHERE id = recipe_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check if recipe can be made with current stock
CREATE OR REPLACE FUNCTION check_recipe_availability(recipe_id_param UUID, servings_multiplier INTEGER DEFAULT 1)
RETURNS TABLE (
    can_make BOOLEAN,
    missing_ingredients JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH ingredient_check AS (
        SELECT 
            ri.ingredient_id,
            i.name,
            ri.quantity * servings_multiplier as needed_quantity,
            i.stock_quantity,
            CASE 
                WHEN i.stock_quantity >= (ri.quantity * servings_multiplier) THEN true 
                ELSE false 
            END as available
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = recipe_id_param
            AND ri.is_optional = false
            AND i.is_active = true
    )
    SELECT 
        BOOL_AND(available) as can_make,
        CASE 
            WHEN BOOL_AND(available) THEN NULL
            ELSE JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'ingredient_id', ingredient_id,
                    'name', name,
                    'needed', needed_quantity,
                    'available', stock_quantity,
                    'shortage', needed_quantity - stock_quantity
                ) 
                ORDER BY name
            ) FILTER (WHERE NOT available)
        END as missing_ingredients
    FROM ingredient_check;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct ingredients from stock when recipe is made
CREATE OR REPLACE FUNCTION deduct_recipe_ingredients(
    recipe_id_param UUID, 
    servings_multiplier INTEGER DEFAULT 1,
    check_availability BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    can_make_recipe BOOLEAN;
BEGIN
    -- Check availability if requested
    IF check_availability THEN
        SELECT can_make INTO can_make_recipe
        FROM check_recipe_availability(recipe_id_param, servings_multiplier);
        
        IF NOT can_make_recipe THEN
            RETURN JSONB_BUILD_OBJECT(
                'success', false,
                'error', 'Insufficient stock for one or more ingredients'
            );
        END IF;
    END IF;
    
    -- Deduct ingredients
    UPDATE ingredients i
    SET stock_quantity = stock_quantity - (ri.quantity * servings_multiplier)
    FROM recipe_ingredients ri
    WHERE i.id = ri.ingredient_id
        AND ri.recipe_id = recipe_id_param
        AND i.is_active = true;
    
    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'message', 'Ingredients deducted successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Ingredients policies
CREATE POLICY "Public ingredients are viewable by everyone" 
ON ingredients FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert ingredients" 
ON ingredients FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ingredients" 
ON ingredients FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete their own ingredients" 
ON ingredients FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Recipes policies
CREATE POLICY "Public recipes are viewable by everyone" 
ON recipes FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can view all recipes" 
ON recipes FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert recipes" 
ON recipes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipes" 
ON recipes FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete their own recipes" 
ON recipes FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Recipe ingredients policies
CREATE POLICY "Recipe ingredients are viewable by everyone" 
ON recipe_ingredients FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert recipe ingredients" 
ON recipe_ingredients FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = created_by 
    AND EXISTS (
        SELECT 1 FROM recipes 
        WHERE id = recipe_id 
        AND created_by = auth.uid()
    )
);

CREATE POLICY "Users can update recipe ingredients for their recipes" 
ON recipe_ingredients FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes 
        WHERE id = recipe_id 
        AND created_by = auth.uid()
    )
)
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete recipe ingredients for their recipes" 
ON recipe_ingredients FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes 
        WHERE id = recipe_id 
        AND created_by = auth.uid()
    )
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC COST CALCULATION
-- =====================================================

-- Trigger to update recipe cost when ingredients are added/updated/deleted
CREATE OR REPLACE FUNCTION trigger_update_recipe_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_recipe_cost(OLD.recipe_id);
        RETURN OLD;
    ELSE
        PERFORM update_recipe_cost(NEW.recipe_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_cost_on_ingredient_change
AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION trigger_update_recipe_cost();

-- Trigger to update recipe costs when ingredient prices change
CREATE OR REPLACE FUNCTION trigger_update_affected_recipes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.unit_cost != NEW.unit_cost THEN
        UPDATE recipes r
        SET cost_price = (
            SELECT COALESCE(SUM(ri.quantity * i.unit_cost), 0)
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = r.id
                AND i.is_active = true
        )
        WHERE r.id IN (
            SELECT DISTINCT recipe_id 
            FROM recipe_ingredients 
            WHERE ingredient_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_on_ingredient_price_change
AFTER UPDATE ON ingredients
FOR EACH ROW
WHEN (OLD.unit_cost IS DISTINCT FROM NEW.unit_cost)
EXECUTE FUNCTION trigger_update_affected_recipes();

-- =====================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =====================================================
-- Uncomment the following lines to insert sample data for testing

/*
-- Sample ingredients
INSERT INTO ingredients (name, unit, unit_cost, stock_quantity, minimum_stock, category) VALUES
('Flour', 'kg', 1.50, 50.000, 10.000, 'dry goods'),
('Sugar', 'kg', 2.00, 30.000, 5.000, 'dry goods'),
('Butter', 'kg', 8.00, 10.000, 2.000, 'dairy'),
('Eggs', 'units', 0.30, 120.000, 24.000, 'dairy'),
('Milk', 'l', 1.20, 20.000, 5.000, 'dairy'),
('Vanilla Extract', 'ml', 0.05, 500.000, 100.000, 'spices');

-- Sample recipe
INSERT INTO recipes (name, category, preparation_time, cooking_time, servings, difficulty_level, selling_price) VALUES
('Vanilla Cake', 'dessert', 20, 30, 8, 'medium', 25.00);

-- Link ingredients to recipe (will trigger cost calculation)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Flour'), 0.500),
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Sugar'), 0.400),
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Butter'), 0.250),
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Eggs'), 4.000),
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Milk'), 0.250),
((SELECT id FROM recipes WHERE name = 'Vanilla Cake'), (SELECT id FROM ingredients WHERE name = 'Vanilla Extract'), 10.000);
*/