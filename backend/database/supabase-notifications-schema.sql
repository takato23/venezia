-- Notifications Schema for Venezia Ice Cream Shop

-- Drop existing tables if they exist
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id INTEGER,
    role VARCHAR(50),
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    types JSONB DEFAULT '{}',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification templates table
CREATE TABLE notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_store_id ON notifications(store_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_status ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notifications policies
-- Users can see their own notifications or notifications without a specific user
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                (role = 'admin') OR
                (role = notifications.role) OR
                (store_id = notifications.store_id)
            )
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin can insert notifications
CREATE POLICY "Admin can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admin can delete old notifications
CREATE POLICY "Admin can delete notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Notification preferences policies
-- Users can view and update their own preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification templates policies (admin only)
CREATE POLICY "Admin can manage templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Public can view active templates
CREATE POLICY "Public can view active templates" ON notification_templates
    FOR SELECT USING (active = true);

-- Insert default notification templates
INSERT INTO notification_templates (type, title, message_template, priority, category) VALUES
    ('stock_alert', 'Alerta de Stock', 'Stock crítico detectado', 'high', 'inventory'),
    ('low_stock', 'Stock Bajo', 'El producto {product} tiene stock bajo ({current}/{minimum})', 'medium', 'inventory'),
    ('out_of_stock', 'Sin Stock', 'El producto {product} está agotado', 'high', 'inventory'),
    ('new_order', 'Nueva Orden', 'Nueva orden #{order_number} de {customer}', 'medium', 'orders'),
    ('order_ready', 'Orden Lista', 'La orden #{order_number} está lista para entrega', 'medium', 'orders'),
    ('order_delivered', 'Orden Entregada', 'La orden #{order_number} fue entregada', 'low', 'orders'),
    ('system_maintenance', 'Mantenimiento del Sistema', 'Mantenimiento programado: {message}', 'medium', 'system'),
    ('system_update', 'Actualización del Sistema', 'Nueva actualización disponible: {message}', 'low', 'system'),
    ('sales_milestone', 'Hito de Ventas', 'Hito alcanzado: {message}', 'low', 'sales'),
    ('daily_goal', 'Meta Diaria Alcanzada', 'Has alcanzado la meta diaria de ventas ({amount})', 'low', 'sales'),
    ('record_sales', 'Record de Ventas', 'Nuevo record de ventas: {amount}', 'medium', 'sales'),
    ('temperature_warning', 'Advertencia de Temperatura', 'Temperatura del {device} fuera de rango: {temperature}°C', 'high', 'equipment'),
    ('temperature_critical', 'Temperatura Crítica', 'ALERTA CRÍTICA: {device} a {temperature}°C', 'critical', 'equipment'),
    ('payment_success', 'Pago Exitoso', 'Pago de {amount} recibido para orden #{order_number}', 'low', 'payments'),
    ('payment_failed', 'Pago Fallido', 'Error al procesar pago para orden #{order_number}', 'high', 'payments'),
    ('batch_completed', 'Lote Completado', 'Lote de {product} completado ({quantity} unidades)', 'low', 'production'),
    ('expiration_warning', 'Advertencia de Vencimiento', '{product} vence en {days} días', 'medium', 'inventory');

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE (user_id = p_user_id OR user_id IS NULL)
    AND read_at IS NULL;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
    AND read_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep
    AND read_at IS NOT NULL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;