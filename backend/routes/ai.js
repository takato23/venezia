const express = require('express');
const router = express.Router();
const { authMiddleware: authenticateToken, requireRole } = require('../middleware/auth');
const aiService = require('../services/aiService.supabase');

// Obtener o crear conversación activa
router.get('/conversations/active', authenticateToken, async (req, res) => {
  try {
    const result = await aiService.getOrCreateActiveConversation(req.user.userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de conversaciones
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await aiService.getUserConversations(req.user.userId, limit);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mensajes de una conversación
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await aiService.getConversationMessages(req.params.id, limit);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar nuevo mensaje
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId, role, content, source, metadata } = req.body;
    
    if (!conversationId || !role || !content) {
      return res.status(400).json({ 
        error: 'conversationId, role, and content are required' 
      });
    }
    
    const result = await aiService.saveMessage(
      conversationId,
      req.user.userId,
      role,
      content,
      source,
      metadata
    );
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar acción ejecutada
router.post('/actions', authenticateToken, async (req, res) => {
  try {
    const { 
      conversationId, 
      messageId, 
      actionType, 
      actionData, 
      result, 
      success 
    } = req.body;
    
    if (!conversationId || !actionType || !actionData) {
      return res.status(400).json({ 
        error: 'conversationId, actionType, and actionData are required' 
      });
    }
    
    const saveResult = await aiService.saveAction(
      conversationId,
      messageId,
      req.user.userId,
      actionType,
      actionData,
      result,
      success
    );
    
    if (saveResult.success) {
      res.json(saveResult.data);
    } else {
      res.status(500).json({ error: saveResult.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desactivar conversación
router.patch('/conversations/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    const result = await aiService.deactivateConversation(req.params.id);
    
    if (result.success) {
      res.json({ message: 'Conversation deactivated' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar título de conversación
router.patch('/conversations/:id/title', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = await aiService.updateConversationTitle(req.params.id, title);
    
    if (result.success) {
      res.json({ message: 'Title updated' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener analytics del usuario
router.get('/analytics/user', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await aiService.getUserAnalytics(req.user.userId, days);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener analytics globales (solo admin)
router.get('/analytics/global', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await aiService.getGlobalAnalytics();
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SSE endpoint para suscribirse a mensajes en tiempo real
router.get('/conversations/:id/subscribe', authenticateToken, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const conversationId = req.params.id;
  
  // Suscribirse a cambios
  const channel = aiService.subscribeToConversation(conversationId, (payload) => {
    res.write(`data: ${JSON.stringify(payload.new)}\n\n`);
  });

  // Mantener conexión viva
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  // Limpiar al cerrar conexión
  req.on('close', () => {
    clearInterval(heartbeat);
    aiService.unsubscribeFromConversation(channel);
  });
});

module.exports = router;