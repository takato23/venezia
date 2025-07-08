const { supabase } = require('../config/supabase');

class AIServiceSupabase {
  /**
   * Obtener o crear conversación activa para un usuario
   */
  async getOrCreateActiveConversation(userId) {
    try {
      // Primero intentar obtener conversación activa
      const { data: existing, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        return { success: true, data: existing };
      }

      // Si no existe, crear una nueva
      const { data: newConversation, error: createError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: `Conversación ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, data: newConversation };
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guardar mensaje en la conversación
   */
  async saveMessage(conversationId, userId, role, content, source = 'user', metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          source,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar analytics
      await this.updateAnalytics(userId, source);

      return { success: true, data };
    } catch (error) {
      console.error('Error saving message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getConversationMessages(conversationId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener historial de conversaciones de un usuario
   */
  async getUserConversations(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_conversations_stats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Guardar acción ejecutada por IA
   */
  async saveAction(conversationId, messageId, userId, actionType, actionData, result, success) {
    try {
      const { data, error } = await supabase
        .from('ai_actions')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          user_id: userId,
          action_type: actionType,
          action_data: actionData,
          result,
          success
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar analytics
      await this.updateAnalytics(userId, null, true);

      return { success: true, data };
    } catch (error) {
      console.error('Error saving action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar analytics
   */
  async updateAnalytics(userId, source = null, actionExecuted = false) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Primero intentar obtener registro existente
      const { data: existing } = await supabase
        .from('ai_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      const updates = {
        total_messages: (existing?.total_messages || 0) + 1,
        updated_at: new Date().toISOString()
      };

      if (source === 'gemini') {
        updates.gemini_requests = (existing?.gemini_requests || 0) + 1;
      } else if (source === 'mock') {
        updates.mock_responses = (existing?.mock_responses || 0) + 1;
      } else if (source === 'fallback') {
        updates.fallback_responses = (existing?.fallback_responses || 0) + 1;
      }

      if (actionExecuted) {
        updates.actions_executed = (existing?.actions_executed || 0) + 1;
      }

      if (existing) {
        // Actualizar registro existente
        await supabase
          .from('ai_analytics')
          .update(updates)
          .eq('user_id', userId)
          .eq('date', today);
      } else {
        // Crear nuevo registro
        await supabase
          .from('ai_analytics')
          .insert({
            user_id: userId,
            date: today,
            ...updates
          });
      }
    } catch (error) {
      console.error('Error updating analytics:', error);
      // No fallar si analytics falla
    }
  }

  /**
   * Marcar conversación como inactiva
   */
  async deactivateConversation(conversationId) {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deactivating conversation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar título de conversación
   */
  async updateConversationTitle(conversationId, title) {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener analytics del usuario
   */
  async getUserAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ai_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Calcular totales
      const totals = data.reduce((acc, day) => ({
        total_messages: acc.total_messages + day.total_messages,
        gemini_requests: acc.gemini_requests + day.gemini_requests,
        mock_responses: acc.mock_responses + day.mock_responses,
        fallback_responses: acc.fallback_responses + day.fallback_responses,
        actions_executed: acc.actions_executed + day.actions_executed
      }), {
        total_messages: 0,
        gemini_requests: 0,
        mock_responses: 0,
        fallback_responses: 0,
        actions_executed: 0
      });

      return { 
        success: true, 
        data: {
          daily: data,
          totals,
          days_active: data.length
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener analytics globales (solo admin)
   */
  async getGlobalAnalytics() {
    try {
      const { data, error } = await supabase
        .from('ai_analytics_summary')
        .select('*')
        .order('total_messages', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error getting global analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suscribirse a cambios en tiempo real de una conversación
   */
  subscribeToConversation(conversationId, callback) {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Desuscribirse de cambios en tiempo real
   */
  unsubscribeFromConversation(channel) {
    supabase.removeChannel(channel);
  }
}

module.exports = new AIServiceSupabase();