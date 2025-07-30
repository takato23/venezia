-- Crear las tablas relacionadas con sucursales

-- 1. Inventario por sucursal
CREATE TABLE IF NOT EXISTS branch_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    last_restock_date TIMESTAMP,
    stock_unit VARCHAR(50) DEFAULT 'kg',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- 2. Precios por sucursal
CREATE TABLE IF NOT EXISTS branch_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    promotional_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    promotion_start TIMESTAMP,
    promotion_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- 3. Transferencias entre sucursales
CREATE TABLE IF NOT EXISTS branch_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_branch_id UUID REFERENCES branches(id),
    to_branch_id UUID REFERENCES branches(id),
    status VARCHAR(50) DEFAULT 'pending',
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 4. Items de transferencia
CREATE TABLE IF NOT EXISTS transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES branch_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    requested_quantity DECIMAL(10,2),
    approved_quantity DECIMAL(10,2),
    received_quantity DECIMAL(10,2),
    unit VARCHAR(50) DEFAULT 'kg'
);

-- 5. Actualizar tabla de ventas si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales') THEN
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
        ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_id UUID;
    END IF;
END $$;

-- 6. Turnos de trabajo
CREATE TABLE IF NOT EXISTS work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    is_active BOOLEAN DEFAULT true
);

-- 7. Asignación de empleados
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    shift_id UUID REFERENCES work_shifts(id),
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    UNIQUE(user_id, date, shift_id)
);

-- 8. Cajas registradoras
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    current_user_id UUID REFERENCES users(id),
    last_opening TIMESTAMP,
    last_closing TIMESTAMP
);

-- 9. Movimientos de caja
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    register_id UUID REFERENCES cash_registers(id),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    amount DECIMAL(10,2),
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch ON branch_inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_product ON branch_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_branch_prices_branch ON branch_prices(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_branch ON cash_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_date ON employee_shifts(date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_branch ON employee_shifts(branch_id);