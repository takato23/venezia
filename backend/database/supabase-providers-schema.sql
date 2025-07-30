-- Supabase Provider Management Schema
-- This schema defines tables for providers, purchase orders, and financial tracking
-- with proper RLS policies, indexes, and triggers for multi-store ice cream shops

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROVIDER CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_category_name UNIQUE (name)
);

-- Create indexes for provider_categories
CREATE INDEX idx_provider_categories_name ON provider_categories(name);
CREATE INDEX idx_provider_categories_is_active ON provider_categories(is_active);

-- =====================================================
-- PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    cuit VARCHAR(20), -- Tax ID for Argentina
    category_id UUID REFERENCES provider_categories(id) ON DELETE SET NULL,
    notes TEXT,
    payment_terms VARCHAR(100), -- e.g., 'Net 30', 'COD', '2/10 Net 30'
    credit_limit DECIMAL(10, 2) DEFAULT 0.00,
    current_balance DECIMAL(10, 2) DEFAULT 0.00,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    store_id UUID, -- For multi-store support
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT positive_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL)
);

-- Create indexes for providers
CREATE INDEX idx_providers_name ON providers(name);
CREATE INDEX idx_providers_category_id ON providers(category_id);
CREATE INDEX idx_providers_is_active ON providers(is_active);
CREATE INDEX idx_providers_store_id ON providers(store_id);
CREATE INDEX idx_providers_cuit ON providers(cuit) WHERE cuit IS NOT NULL;
CREATE INDEX idx_providers_email ON providers(email) WHERE email IS NOT NULL;

-- =====================================================
-- PROVIDER_PRODUCTS TABLE (Junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_code VARCHAR(100), -- Provider's product code
    product_name VARCHAR(255) NOT NULL, -- Provider's product name
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lead_time_days INTEGER DEFAULT 0,
    minimum_order_quantity DECIMAL(10, 3) DEFAULT 1,
    last_purchase_date TIMESTAMPTZ,
    last_purchase_price DECIMAL(10, 2),
    is_preferred BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT positive_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT positive_minimum_order CHECK (minimum_order_quantity > 0),
    CONSTRAINT positive_lead_time CHECK (lead_time_days >= 0),
    CONSTRAINT unique_provider_product UNIQUE (provider_id, product_id)
);

-- Create indexes for provider_products
CREATE INDEX idx_provider_products_provider_id ON provider_products(provider_id);
CREATE INDEX idx_provider_products_product_id ON provider_products(product_id);
CREATE INDEX idx_provider_products_product_code ON provider_products(product_code);
CREATE INDEX idx_provider_products_is_preferred ON provider_products(is_preferred);

-- =====================================================
-- PURCHASE ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    store_id UUID,
    order_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expected_delivery_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS 
        (subtotal + tax_amount + shipping_cost - discount_amount) STORED,
    notes TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_date TIMESTAMPTZ,
    invoice_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_order_number UNIQUE (order_number),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        shipping_cost >= 0 AND 
        discount_amount >= 0
    )
);

-- Create indexes for purchase_orders
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_provider_id ON purchase_orders(provider_id);
CREATE INDEX idx_purchase_orders_store_id ON purchase_orders(store_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_payment_status ON purchase_orders(payment_status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_invoice_number ON purchase_orders(invoice_number) WHERE invoice_number IS NOT NULL;

-- =====================================================
-- PURCHASE ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    received_quantity DECIMAL(10, 3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT valid_received_quantity CHECK (received_quantity >= 0 AND received_quantity <= quantity)
);

-- Create indexes for purchase_order_items
CREATE INDEX idx_purchase_order_items_order_id ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- =====================================================
-- PROVIDER PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'check', 'transfer', 'credit_card', 'other'))
);

-- Create indexes for provider_payments
CREATE INDEX idx_provider_payments_provider_id ON provider_payments(provider_id);
CREATE INDEX idx_provider_payments_purchase_order_id ON provider_payments(purchase_order_id);
CREATE INDEX idx_provider_payments_payment_date ON provider_payments(payment_date);
CREATE INDEX idx_provider_payments_reference_number ON provider_payments(reference_number) WHERE reference_number IS NOT NULL;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for providers with calculated balance
CREATE OR REPLACE VIEW providers_with_balance AS
SELECT 
    p.*,
    pc.name as category_name,
    COALESCE(po_totals.total_purchases, 0) as total_purchases,
    COALESCE(po_totals.pending_amount, 0) as pending_amount,
    COALESCE(payments.total_paid, 0) as total_paid,
    (COALESCE(po_totals.total_purchases, 0) - COALESCE(payments.total_paid, 0)) as outstanding_balance
FROM providers p
LEFT JOIN provider_categories pc ON p.category_id = pc.id
LEFT JOIN (
    SELECT 
        provider_id,
        SUM(total_amount) as total_purchases,
        SUM(CASE WHEN payment_status IN ('pending', 'partial') THEN total_amount ELSE 0 END) as pending_amount
    FROM purchase_orders
    WHERE status != 'cancelled'
    GROUP BY provider_id
) po_totals ON p.id = po_totals.provider_id
LEFT JOIN (
    SELECT 
        provider_id,
        SUM(amount) as total_paid
    FROM provider_payments
    GROUP BY provider_id
) payments ON p.id = payments.provider_id;

-- View for purchase orders with provider details
CREATE OR REPLACE VIEW purchase_orders_detailed AS
SELECT 
    po.*,
    p.name as provider_name,
    p.email as provider_email,
    p.phone as provider_phone,
    p.payment_terms,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity) as total_items,
    SUM(poi.received_quantity) as total_received
FROM purchase_orders po
JOIN providers p ON po.provider_id = p.id
LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
GROUP BY po.id, p.id;

-- View for provider product pricing history
CREATE OR REPLACE VIEW provider_product_price_history AS
SELECT 
    pp.provider_id,
    pp.product_id,
    p.name as provider_name,
    pp.product_name,
    poi.unit_cost as purchase_price,
    po.order_date,
    po.order_number,
    ROW_NUMBER() OVER (PARTITION BY pp.provider_id, pp.product_id ORDER BY po.order_date DESC) as price_rank
FROM provider_products pp
JOIN providers p ON pp.provider_id = p.id
JOIN purchase_order_items poi ON poi.product_id = pp.product_id
JOIN purchase_orders po ON poi.order_id = po.id AND po.provider_id = pp.provider_id
WHERE po.status IN ('received', 'partial');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_purchase_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    current_year TEXT;
    last_number INTEGER;
BEGIN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) INTO last_number
    FROM purchase_orders
    WHERE order_number LIKE 'PO-' || current_year || '-%';
    
    new_number := 'PO-' || current_year || '-' || LPAD((last_number + 1)::TEXT, 5, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order totals
CREATE OR REPLACE FUNCTION update_purchase_order_totals(order_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE purchase_orders
    SET subtotal = (
        SELECT COALESCE(SUM(quantity * unit_cost), 0)
        FROM purchase_order_items
        WHERE order_id = order_id_param
    )
    WHERE id = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check provider credit limit
CREATE OR REPLACE FUNCTION check_provider_credit_limit(provider_id_param UUID, new_order_amount DECIMAL)
RETURNS JSONB AS $$
DECLARE
    provider_record RECORD;
    current_outstanding DECIMAL;
    available_credit DECIMAL;
BEGIN
    SELECT * INTO provider_record
    FROM providers
    WHERE id = provider_id_param;
    
    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', false,
            'error', 'Provider not found'
        );
    END IF;
    
    -- Calculate current outstanding balance
    SELECT COALESCE(SUM(po.total_amount), 0) - COALESCE(SUM(pp.amount), 0)
    INTO current_outstanding
    FROM purchase_orders po
    LEFT JOIN provider_payments pp ON pp.purchase_order_id = po.id
    WHERE po.provider_id = provider_id_param
        AND po.payment_status IN ('pending', 'partial')
        AND po.status != 'cancelled';
    
    available_credit := provider_record.credit_limit - current_outstanding;
    
    IF new_order_amount > available_credit THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', false,
            'error', 'Exceeds credit limit',
            'credit_limit', provider_record.credit_limit,
            'current_outstanding', current_outstanding,
            'available_credit', available_credit,
            'requested_amount', new_order_amount
        );
    END IF;
    
    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'credit_limit', provider_record.credit_limit,
        'current_outstanding', current_outstanding,
        'available_credit', available_credit
    );
END;
$$ LANGUAGE plpgsql;

-- Function to process purchase order receipt
CREATE OR REPLACE FUNCTION receive_purchase_order(
    order_id_param UUID,
    received_items JSONB -- Array of {product_id, received_quantity}
)
RETURNS JSONB AS $$
DECLARE
    item JSONB;
    order_status VARCHAR;
    all_received BOOLEAN;
    partial_received BOOLEAN;
BEGIN
    -- Update received quantities
    FOR item IN SELECT * FROM jsonb_array_elements(received_items)
    LOOP
        UPDATE purchase_order_items
        SET received_quantity = (item->>'received_quantity')::DECIMAL
        WHERE order_id = order_id_param
            AND product_id = (item->>'product_id')::UUID;
    END LOOP;
    
    -- Check if all items are fully received
    SELECT 
        BOOL_AND(received_quantity >= quantity) as all_received,
        BOOL_OR(received_quantity > 0 AND received_quantity < quantity) as partial_received
    INTO all_received, partial_received
    FROM purchase_order_items
    WHERE order_id = order_id_param;
    
    -- Update order status
    IF all_received THEN
        order_status := 'received';
    ELSIF partial_received THEN
        order_status := 'partial';
    ELSE
        order_status := 'confirmed';
    END IF;
    
    UPDATE purchase_orders
    SET status = order_status,
        delivery_date = CASE 
            WHEN order_status = 'received' THEN TIMEZONE('utc'::text, NOW())
            ELSE delivery_date
        END
    WHERE id = order_id_param;
    
    RETURN JSONB_BUILD_OBJECT(
        'success', true,
        'status', order_status,
        'message', 'Purchase order receipt processed successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create updated_at triggers
CREATE TRIGGER set_timestamp_provider_categories
BEFORE UPDATE ON provider_categories
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_providers
BEFORE UPDATE ON providers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_provider_products
BEFORE UPDATE ON provider_products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_purchase_orders
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_purchase_order_items
BEFORE UPDATE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger to update purchase order totals when items change
CREATE OR REPLACE FUNCTION trigger_update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_purchase_order_totals(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM update_purchase_order_totals(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_update_order_totals();

-- Trigger to update provider balance when payments are made
CREATE OR REPLACE FUNCTION trigger_update_provider_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current balance
    UPDATE providers
    SET current_balance = (
        SELECT COALESCE(SUM(po.total_amount), 0) - COALESCE(SUM(pp.amount), 0)
        FROM purchase_orders po
        LEFT JOIN provider_payments pp ON pp.provider_id = providers.id
        WHERE po.provider_id = providers.id
            AND po.status != 'cancelled'
    )
    WHERE id = NEW.provider_id;
    
    -- Update payment status of related purchase order
    IF NEW.purchase_order_id IS NOT NULL THEN
        UPDATE purchase_orders po
        SET payment_status = CASE
            WHEN (
                SELECT SUM(amount) FROM provider_payments 
                WHERE purchase_order_id = NEW.purchase_order_id
            ) >= po.total_amount THEN 'paid'
            WHEN (
                SELECT SUM(amount) FROM provider_payments 
                WHERE purchase_order_id = NEW.purchase_order_id
            ) > 0 THEN 'partial'
            ELSE 'pending'
        END,
        payment_date = CASE
            WHEN (
                SELECT SUM(amount) FROM provider_payments 
                WHERE purchase_order_id = NEW.purchase_order_id
            ) >= po.total_amount THEN NEW.payment_date
            ELSE payment_date
        END
        WHERE id = NEW.purchase_order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_balance_on_payment
AFTER INSERT OR UPDATE ON provider_payments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_provider_balance();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_payments ENABLE ROW LEVEL SECURITY;

-- Provider categories policies
CREATE POLICY "Provider categories are viewable by authenticated users" 
ON provider_categories FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage provider categories" 
ON provider_categories FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Providers policies with store isolation
CREATE POLICY "Providers are viewable by users in same store" 
ON providers FOR SELECT 
TO authenticated
USING (store_id IS NULL OR store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert providers for their store" 
ON providers FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND
    (store_id IS NULL OR store_id IN (
        SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    ))
);

CREATE POLICY "Users can update providers for their store" 
ON providers FOR UPDATE 
TO authenticated
USING (store_id IS NULL OR store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
))
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete providers for their store" 
ON providers FOR DELETE 
TO authenticated
USING (
    auth.uid() = created_by AND
    (store_id IS NULL OR store_id IN (
        SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    ))
);

-- Provider products policies
CREATE POLICY "Provider products are viewable by authenticated users" 
ON provider_products FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM providers 
        WHERE id = provider_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

CREATE POLICY "Users can manage provider products for their providers" 
ON provider_products FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM providers 
        WHERE id = provider_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM providers 
        WHERE id = provider_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

-- Purchase orders policies with store isolation
CREATE POLICY "Purchase orders are viewable by users in same store" 
ON purchase_orders FOR SELECT 
TO authenticated
USING (store_id IS NULL OR store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create purchase orders for their store" 
ON purchase_orders FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND
    (store_id IS NULL OR store_id IN (
        SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    ))
);

CREATE POLICY "Users can update purchase orders for their store" 
ON purchase_orders FOR UPDATE 
TO authenticated
USING (store_id IS NULL OR store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
))
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete draft purchase orders they created" 
ON purchase_orders FOR DELETE 
TO authenticated
USING (
    auth.uid() = created_by AND 
    status = 'draft' AND
    (store_id IS NULL OR store_id IN (
        SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    ))
);

-- Purchase order items policies
CREATE POLICY "Purchase order items are viewable by users with access to order" 
ON purchase_order_items FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM purchase_orders 
        WHERE id = order_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

CREATE POLICY "Users can manage items for accessible purchase orders" 
ON purchase_order_items FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM purchase_orders 
        WHERE id = order_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM purchase_orders 
        WHERE id = order_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

-- Provider payments policies
CREATE POLICY "Provider payments are viewable by users in same store" 
ON provider_payments FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM providers 
        WHERE id = provider_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

CREATE POLICY "Users can create payments for providers in their store" 
ON provider_payments FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM providers 
        WHERE id = provider_id 
        AND (store_id IS NULL OR store_id IN (
            SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        ))
    )
);

-- =====================================================
-- SAMPLE DATA (Optional - Remove in production)
-- =====================================================
-- Uncomment the following lines to insert sample data for testing

/*
-- Sample provider categories
INSERT INTO provider_categories (name, description) VALUES
('Dairy Products', 'Suppliers of milk, cream, and dairy ingredients'),
('Packaging', 'Suppliers of containers, cups, and packaging materials'),
('Ingredients', 'Suppliers of flavors, toppings, and other ingredients'),
('Equipment', 'Suppliers of machinery and equipment'),
('Services', 'Service providers for maintenance, cleaning, etc.');

-- Sample providers
INSERT INTO providers (name, contact_person, phone, email, address, cuit, category_id, payment_terms, credit_limit) VALUES
('Dairy Fresh Ltd', 'John Smith', '+54-11-4567-8900', 'john@dairyfresh.com', '123 Milk St, Buenos Aires', '20-12345678-9', 
    (SELECT id FROM provider_categories WHERE name = 'Dairy Products'), 'Net 30', 50000.00),
('Package Solutions', 'Maria Garcia', '+54-11-4567-8901', 'maria@packagesolutions.com', '456 Box Ave, Buenos Aires', '20-23456789-0', 
    (SELECT id FROM provider_categories WHERE name = 'Packaging'), 'Net 15', 30000.00);
*/