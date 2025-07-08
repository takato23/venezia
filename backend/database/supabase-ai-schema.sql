-- ====================================
-- SCHEMA PARA VENEZIA AI
-- ====================================

-- Tabla para conversaciones de IA
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Tabla para mensajes individuales
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'user', -- 'user', 'gemini', 'mock', 'fallback'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para acciones ejecutadas por IA
CREATE TABLE IF NOT EXISTS ai_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_stock', 'create_product', 'update_price', etc.
  action_data JSONB NOT NULL,
  result JSONB,
  success BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para analytics de uso de IA
CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_messages INTEGER DEFAULT 0,
  gemini_requests INTEGER DEFAULT 0,
  mock_responses INTEGER DEFAULT 0,
  fallback_responses INTEGER DEFAULT 0,
  actions_executed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Índices para mejor performance
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at DESC);
CREATE INDEX idx_ai_actions_conversation_id ON ai_actions(conversation_id);
CREATE INDEX idx_ai_analytics_user_date ON ai_analytics(user_id, date);

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Habilitar RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON ai_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para ai_messages
CREATE POLICY "Users can view own messages" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE id = ai_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE id = ai_messages.conversation_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages" ON ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para ai_actions
CREATE POLICY "Users can view own actions" ON ai_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actions" ON ai_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all actions" ON ai_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para ai_analytics
CREATE POLICY "Users can view own analytics" ON ai_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update own analytics" ON ai_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON ai_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ====================================
-- FUNCIONES ÚTILES
-- ====================================

-- Función para obtener o crear conversación activa
CREATE OR REPLACE FUNCTION get_or_create_active_conversation(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Buscar conversación activa existente
  SELECT id INTO v_conversation_id
  FROM ai_conversations
  WHERE user_id = p_user_id 
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Si no existe, crear una nueva
  IF v_conversation_id IS NULL THEN
    INSERT INTO ai_conversations (user_id, title)
    VALUES (p_user_id, 'Nueva conversación')
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar analytics
CREATE OR REPLACE FUNCTION update_ai_analytics(
  p_user_id UUID,
  p_source TEXT,
  p_action_executed BOOLEAN DEFAULT false
)
RETURNS void AS $$
BEGIN
  INSERT INTO ai_analytics (user_id, date, total_messages)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_messages = ai_analytics.total_messages + 1,
    gemini_requests = CASE 
      WHEN p_source = 'gemini' 
      THEN ai_analytics.gemini_requests + 1 
      ELSE ai_analytics.gemini_requests 
    END,
    mock_responses = CASE 
      WHEN p_source = 'mock' 
      THEN ai_analytics.mock_responses + 1 
      ELSE ai_analytics.mock_responses 
    END,
    fallback_responses = CASE 
      WHEN p_source = 'fallback' 
      THEN ai_analytics.fallback_responses + 1 
      ELSE ai_analytics.fallback_responses 
    END,
    actions_executed = CASE 
      WHEN p_action_executed 
      THEN ai_analytics.actions_executed + 1 
      ELSE ai_analytics.actions_executed 
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at en conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- ====================================
-- VISTAS ÚTILES
-- ====================================

-- Vista para conversaciones con estadísticas
CREATE OR REPLACE VIEW ai_conversations_stats AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  c.updated_at,
  c.is_active,
  COUNT(m.id) as message_count,
  COUNT(DISTINCT a.id) as action_count,
  u.name as user_name,
  u.email as user_email
FROM ai_conversations c
LEFT JOIN ai_messages m ON c.id = m.conversation_id
LEFT JOIN ai_actions a ON c.id = a.conversation_id
LEFT JOIN users u ON c.user_id = u.id
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at, c.is_active, u.name, u.email;

-- Vista para analytics agregados
CREATE OR REPLACE VIEW ai_analytics_summary AS
SELECT 
  u.name as user_name,
  u.email as user_email,
  SUM(a.total_messages) as total_messages,
  SUM(a.gemini_requests) as total_gemini_requests,
  SUM(a.mock_responses) as total_mock_responses,
  SUM(a.fallback_responses) as total_fallback_responses,
  SUM(a.actions_executed) as total_actions_executed,
  COUNT(DISTINCT a.date) as days_active
FROM ai_analytics a
JOIN users u ON a.user_id = u.id
GROUP BY u.id, u.name, u.email;

-- ====================================
-- DATOS DE EJEMPLO
-- ====================================

-- Insertar conversación de ejemplo para el admin (comentado por defecto)
/*
INSERT INTO ai_conversations (user_id, title, context)
SELECT 
  id, 
  'Conversación de bienvenida', 
  '{"firstTime": true}'::jsonb
FROM users 
WHERE email = 'admin@venezia.com'
LIMIT 1;
*/