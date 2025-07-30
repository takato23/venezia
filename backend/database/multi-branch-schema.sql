-- Schema para sistema multi-sucursal de heladerías

-- Tabla de organizaciones (empresa matriz)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#FF69B4',
    secondary_color VARCHAR(7) DEFAULT '#9333EA',
    subscription_plan VARCHAR(50) DEFAULT 'professional',
    subscription_status VARCHAR(50) DEFAULT 'active',
    max_branches INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sucursales
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Código único por sucursal (SUC001, SUC002, etc)
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    coordinates JSONB, -- {lat: -34.603684, lng: -58.381559}
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    opening_hours JSONB, -- {"monday": {"open": "10:00", "close": "22:00"}, ...}
    is_active BOOLEAN DEFAULT true,
    is_main_branch BOOLEAN DEFAULT false, -- Sucursal principal
    features JSONB DEFAULT '[]', -- ["delivery", "dine_in", "takeaway", "wholesale"]
    settings JSONB DEFAULT '{}', -- Configuraciones específicas de la sucursal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modificar tabla de usuarios para multi-sucursal
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN branch_access UUID[] DEFAULT '{}'; -- Array de branch_ids a los que tiene acceso
ALTER TABLE users ADD COLUMN role_per_branch JSONB DEFAULT '{}'; -- {"branch_id": "manager", "branch_id2": "cashier"}

-- Inventario por sucursal
CREATE TABLE branch_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0, -- Stock mínimo para alertas
    max_stock DECIMAL(10,2), -- Stock máximo recomendado
    last_restock_date TIMESTAMP,
    stock_unit VARCHAR(50) DEFAULT 'kg', -- kg, units, liters
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- Precios por sucursal (permite precios diferentes por zona)
CREATE TABLE branch_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),
    cost DECIMAL(10,2), -- Costo puede variar por sucursal
    promotion_start TIMESTAMP,
    promotion_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- Transferencias entre sucursales
CREATE TABLE branch_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_branch_id UUID REFERENCES branches(id),
    to_branch_id UUID REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, completed, cancelled
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Items de transferencia
CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES branch_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    requested_quantity DECIMAL(10,2),
    approved_quantity DECIMAL(10,2),
    received_quantity DECIMAL(10,2),
    unit VARCHAR(50) DEFAULT 'kg'
);

-- Ventas con referencia a sucursal
ALTER TABLE sales ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE sales ADD COLUMN shift_id UUID; -- Para control de turnos

-- Turnos de trabajo por sucursal
CREATE TABLE work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100), -- "Turno Mañana", "Turno Tarde"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Lunes, 7=Domingo
    is_active BOOLEAN DEFAULT true
);

-- Asignación de empleados a turnos
CREATE TABLE employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    shift_id UUID REFERENCES work_shifts(id),
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, working, completed, absent
    notes TEXT,
    UNIQUE(user_id, date, shift_id)
);

-- Cash registers por sucursal
CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    current_user_id UUID REFERENCES users(id),
    last_opening TIMESTAMP,
    last_closing TIMESTAMP
);

-- Movimientos de caja por sucursal
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    register_id UUID REFERENCES cash_registers(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50), -- opening, closing, sale, expense, withdrawal, deposit
    amount DECIMAL(10,2),
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    reference_id UUID, -- ID de venta, gasto, etc
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Métricas comparativas entre sucursales
CREATE VIEW branch_performance AS
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    COUNT(DISTINCT s.id) as total_sales,
    SUM(s.total_amount) as revenue,
    AVG(s.total_amount) as avg_ticket,
    COUNT(DISTINCT DATE(s.created_at)) as days_operated,
    COUNT(DISTINCT s.customer_id) as unique_customers
FROM branches b
LEFT JOIN sales s ON s.branch_id = b.id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.name;

-- Índices para optimización
CREATE INDEX idx_branch_inventory_branch ON branch_inventory(branch_id);
CREATE INDEX idx_branch_inventory_product ON branch_inventory(product_id);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_cash_movements_branch ON cash_movements(branch_id);
CREATE INDEX idx_employee_shifts_date ON employee_shifts(date);
CREATE INDEX idx_employee_shifts_branch ON employee_shifts(branch_id);

-- Triggers para actualización automática
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar inventario de la sucursal correspondiente
    UPDATE branch_inventory 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE branch_id = NEW.branch_id 
    AND product_id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para alertas de stock bajo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE(
    branch_name VARCHAR,
    product_name VARCHAR,
    current_stock DECIMAL,
    min_stock DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.name,
        p.name,
        bi.current_stock,
        bi.min_stock
    FROM branch_inventory bi
    JOIN branches b ON bi.branch_id = b.id
    JOIN products p ON bi.product_id = p.id
    WHERE bi.current_stock <= bi.min_stock
    AND bi.is_available = true
    AND b.is_active = true;
END;
$$ LANGUAGE plpgsql;