-- Esquemas de base de datos para Super-Bot Venezia
-- Tablas para auditoría, logging y configuración

-- ==================== TABLA DE ACCIONES DEL BOT ====================
CREATE TABLE IF NOT EXISTS bot_actions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_params TEXT, -- JSON con parámetros de la acción
    result TEXT, -- JSON con resultado de la acción
    success BOOLEAN NOT NULL DEFAULT 0,
    execution_time_ms INTEGER, -- Tiempo de ejecución en milisegundos
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_bot_actions_user_id ON bot_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_actions_type ON bot_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_bot_actions_success ON bot_actions_log(success);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created_at ON bot_actions_log(created_at);

-- ==================== TABLA DE CONFIGURACIÓN DEL BOT ====================
CREATE TABLE IF NOT EXISTS bot_configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
    is_global BOOLEAN DEFAULT 0, -- Si es configuración global o por usuario
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_name)
);

-- Índices para configuración
CREATE INDEX IF NOT EXISTS idx_bot_config_user_id ON bot_configuration(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_config_setting_name ON bot_configuration(setting_name);
CREATE INDEX IF NOT EXISTS idx_bot_config_is_global ON bot_configuration(is_global);

-- ==================== TABLA DE HISTORIAL DE PRECIOS ====================
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    change_reason TEXT,
    changed_by_user_id INTEGER,
    changed_by_bot BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para historial de precios
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_by_bot ON price_history(changed_by_bot);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at);

-- ==================== TABLA DE MOVIMIENTOS DE INVENTARIO MEJORADA ====================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'addition', 'sale', 'adjustment', 'initial', 'production'
    quantity INTEGER NOT NULL, -- Puede ser negativo para salidas
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit VARCHAR(20) DEFAULT 'unidades',
    reason VARCHAR(100),
    notes TEXT,
    reference_id INTEGER, -- ID de venta, orden de producción, etc.
    reference_type VARCHAR(50), -- 'sale', 'production_order', 'manual', 'bot_command'
    created_by_user_id INTEGER,
    created_by_bot BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para movimientos de inventario
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by_bot ON inventory_movements(created_by_bot);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- ==================== TABLA DE ÓRDENES DE PRODUCCIÓN ====================
CREATE TABLE IF NOT EXISTS production_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_requested INTEGER NOT NULL,
    quantity_produced INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    notes TEXT,
    created_by_user_id INTEGER,
    created_by_bot BOOLEAN DEFAULT 0,
    assigned_to_user_id INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para órdenes de producción
CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_by_bot ON production_orders(created_by_bot);
CREATE INDEX IF NOT EXISTS idx_production_orders_priority ON production_orders(priority);
CREATE INDEX IF NOT EXISTS idx_production_orders_created_at ON production_orders(created_at);

-- ==================== TABLA DE COMANDOS DE VOZ ====================
CREATE TABLE IF NOT EXISTS voice_commands_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    original_text TEXT NOT NULL, -- Texto reconocido por voz
    processed_text TEXT, -- Texto después del procesamiento NLP
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2), -- 0.00 a 1.00
    action_executed VARCHAR(100),
    success BOOLEAN NOT NULL DEFAULT 0,
    error_message TEXT,
    language VARCHAR(10) DEFAULT 'es',
    audio_duration_ms INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para comandos de voz
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands_log(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands_log(intent_detected);
CREATE INDEX IF NOT EXISTS idx_voice_commands_success ON voice_commands_log(success);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created_at ON voice_commands_log(created_at);

-- ==================== TABLA DE FEEDBACK Y MEJORAS ====================
CREATE TABLE IF NOT EXISTS bot_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    command_text TEXT NOT NULL,
    expected_result TEXT,
    actual_result TEXT,
    satisfaction_score INTEGER CHECK(satisfaction_score >= 1 AND satisfaction_score <= 5),
    feedback_text TEXT,
    suggestion TEXT,
    bot_action_log_id INTEGER, -- Referencia a la acción que generó el feedback
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bot_action_log_id) REFERENCES bot_actions_log(id) ON DELETE SET NULL
);

-- Índices para feedback
CREATE INDEX IF NOT EXISTS idx_bot_feedback_user_id ON bot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_feedback_satisfaction ON bot_feedback(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_bot_feedback_created_at ON bot_feedback(created_at);

-- ==================== VISTA PARA ESTADÍSTICAS DEL BOT ====================
CREATE VIEW IF NOT EXISTS bot_statistics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_actions,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_actions,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_actions,
    ROUND(AVG(CASE WHEN success = 1 THEN 100.0 ELSE 0.0 END), 2) as success_rate,
    AVG(execution_time_ms) as avg_execution_time,
    COUNT(DISTINCT user_id) as unique_users,
    action_type,
    COUNT(*) as action_count
FROM bot_actions_log
GROUP BY DATE(created_at), action_type
ORDER BY date DESC, action_count DESC;

-- ==================== VISTA PARA TOP COMANDOS ====================
CREATE VIEW IF NOT EXISTS top_bot_commands AS
SELECT 
    action_type,
    COUNT(*) as usage_count,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
    ROUND(
        (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
        2
    ) as success_rate,
    AVG(execution_time_ms) as avg_execution_time,
    MIN(created_at) as first_used,
    MAX(created_at) as last_used
FROM bot_actions_log
GROUP BY action_type
ORDER BY usage_count DESC;

-- ==================== CONFIGURACIONES INICIALES DEL BOT ====================
INSERT OR IGNORE INTO bot_configuration (user_id, setting_name, setting_value, setting_type, is_global, description) VALUES
(NULL, 'auto_execute', 'false', 'boolean', 1, 'Ejecutar comandos automáticamente sin confirmación'),
(NULL, 'confirmation_required', 'true', 'boolean', 1, 'Requerir confirmación para acciones críticas'),
(NULL, 'voice_enabled', 'true', 'boolean', 1, 'Habilitar comandos de voz'),
(NULL, 'language', 'es', 'string', 1, 'Idioma por defecto del bot'),
(NULL, 'max_retries', '3', 'number', 1, 'Número máximo de reintentos'),
(NULL, 'response_timeout', '15000', 'number', 1, 'Timeout de respuesta en milisegundos'),
(NULL, 'nlp_confidence_threshold', '0.7', 'number', 1, 'Umbral mínimo de confianza para NLP'),
(NULL, 'enable_learning', 'true', 'boolean', 1, 'Habilitar aprendizaje automático del bot'),
(NULL, 'log_all_interactions', 'true', 'boolean', 1, 'Registrar todas las interacciones para auditoría'),
(NULL, 'enable_analytics', 'true', 'boolean', 1, 'Habilitar analytics y métricas del bot');

-- ==================== TRIGGERS PARA AUDITORÍA ====================

-- Trigger para actualizar updated_at en bot_configuration
CREATE TRIGGER IF NOT EXISTS update_bot_configuration_timestamp 
    AFTER UPDATE ON bot_configuration
BEGIN
    UPDATE bot_configuration 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en production_orders
CREATE TRIGGER IF NOT EXISTS update_production_orders_timestamp 
    AFTER UPDATE ON production_orders
BEGIN
    UPDATE production_orders 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ==================== PROCEDIMIENTOS PARA LIMPIEZA ====================

-- Nota: SQLite no soporta procedimientos almacenados nativamente
-- Estos son scripts que pueden ejecutarse periódicamente para mantenimiento

-- Script para limpiar logs antiguos (más de 90 días)
-- DELETE FROM bot_actions_log WHERE created_at < datetime('now', '-90 days');
-- DELETE FROM voice_commands_log WHERE created_at < datetime('now', '-90 days');

-- Script para limpiar configuraciones huérfanas
-- DELETE FROM bot_configuration WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

-- Script para optimizar base de datos
-- VACUUM;
-- ANALYZE;

-- ==================== COMENTARIOS Y DOCUMENTACIÓN ====================

/*
DOCUMENTACIÓN DE TABLAS DEL SUPER-BOT VENEZIA

1. bot_actions_log: Registra todas las acciones ejecutadas por el bot
   - Incluye parámetros, resultados y métricas de rendimiento
   - Permite auditoría completa de todas las operaciones

2. bot_configuration: Configuraciones del bot por usuario y globales
   - Permite personalización del comportamiento del bot
   - Configuraciones globales afectan a todos los usuarios

3. price_history: Historial de cambios de precios
   - Rastrea todos los cambios de precios con razón y responsable
   - Indica si el cambio fue hecho por el bot o manualmente

4. inventory_movements: Movimientos de inventario mejorados
   - Incluye información sobre el creador (usuario o bot)
   - Referencias a órdenes de venta, producción, etc.

5. production_orders: Órdenes de producción
   - Puede ser creadas por el bot o usuarios
   - Incluye estimaciones de tiempo y seguimiento de progreso

6. voice_commands_log: Log específico de comandos de voz
   - Incluye métricas de reconocimiento y confianza
   - Permite análisis de precisión del reconocimiento de voz

7. bot_feedback: Feedback de usuarios sobre el bot
   - Permite mejora continua basada en experiencia del usuario
   - Puntuaciones de satisfacción y sugerencias

VISTAS:
- bot_statistics: Estadísticas diarias de uso del bot
- top_bot_commands: Comandos más utilizados con métricas de éxito

CONSIDERACIONES DE RENDIMIENTO:
- Todos los índices están optimizados para consultas frecuentes
- Las vistas pre-calculan estadísticas comunes
- Los triggers mantienen timestamps actualizados automáticamente

PRIVACIDAD Y SEGURIDAD:
- Todos los logs incluyen user_id para trazabilidad
- Las configuraciones pueden ser por usuario o globales
- Los datos sensibles en JSON pueden ser encriptados en aplicación
*/