import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Shield, Palette, Activity, Users, Brain, ToggleLeft, ToggleRight, Key, Save, Database } from 'lucide-react';
import Tabs from '../components/ui/Tabs';
import { useAuthStore } from '../store/authStore.supabase';
import UserProfile from '../components/auth/UserProfile';
import { PermissionsList } from '../components/auth/PermissionGuard';
import SessionManager from '../components/auth/SessionManager';
import BackupManager from '../components/backup/BackupManager';
import Button from '../components/ui/Button';
import aiService from '../services/AIService';

const SettingsPage = () => {
  const { user, updateUser, darkMode, toggleDarkMode } = useAuthStore();
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(
    localStorage.getItem('ai-assistant-enabled') !== 'false'
  );
  const [aiDefaultMode, setAiDefaultMode] = useState(
    localStorage.getItem('ai-default-mode') || 'guided'
  );
  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem('gemini-api-key') || ''
  );
  const [apiKeyStatus, setApiKeyStatus] = useState(() => {
    return aiService.getServiceStatus();
  });

  const renderTab = (id) => {
    switch (id) {
      case 'profile':
        return <UserProfile />;
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configuración de Tema
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Personaliza la apariencia de la aplicación según tus preferencias.
                </p>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Modo Oscuro
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {darkMode ? 'Actualmente usando modo oscuro' : 'Actualmente usando modo claro'}
                    </p>
                  </div>
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    icon={Palette}
                  >
                    {darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Gestión de Seguridad
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Sesiones Activas
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Gestiona las sesiones activas en tu cuenta
                    </p>
                    <Button
                      onClick={() => setShowSessionManager(true)}
                      variant="outline"
                      size="sm"
                      icon={Activity}
                    >
                      Ver Sesiones
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Información de Cuenta
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Usuario: {user?.username || user?.email}</p>
                      <p>Rol: {user?.role || 'No asignado'}</p>
                      <p>Último acceso: {user?.last_login ? 
                        new Date(user.last_login).toLocaleString() : 
                        'Desconocido'
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'permissions':
        return <PermissionsList />;
        
      case 'ai':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Configuración del Asistente AI
              </h3>
              
              <div className="space-y-6">
                {/* Habilitar/Deshabilitar AI Assistant */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Asistente AI Flotante
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Muestra el botón flotante del asistente AI en la esquina inferior derecha
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !aiAssistantEnabled;
                      setAiAssistantEnabled(newValue);
                      localStorage.setItem('ai-assistant-enabled', newValue.toString());
                      // Disparar evento para actualizar el componente
                      window.dispatchEvent(new CustomEvent('ai-assistant-toggle', { 
                        detail: { enabled: newValue } 
                      }));
                    }}
                    className="p-2"
                  >
                    {aiAssistantEnabled ? (
                      <ToggleRight className="w-10 h-6 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Modo por defecto */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Modo por Defecto
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Elige qué modo del asistente se activa al abrir
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setAiDefaultMode('guided');
                        localStorage.setItem('ai-default-mode', 'guided');
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        aiDefaultMode === 'guided'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🧙‍♂️</div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          Modo Guiado
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Asistente paso a paso con botones
                        </p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setAiDefaultMode('chat');
                        localStorage.setItem('ai-default-mode', 'chat');
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        aiDefaultMode === 'chat'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">💬</div>
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          Modo Chat AI
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Conversación libre con IA
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Configuración de Gemini API Key */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Configuración de Gemini AI
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                    Para habilitar el chat AI con Gemini, necesitas una API key gratuita de Google
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                        API Key de Gemini
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder="AIzaSy... (opcional)"
                          className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-purple-900/20"
                        />
                        <Button
                          onClick={() => {
                            const success = aiService.setGeminiApiKey(geminiApiKey);
                            setApiKeyStatus(aiService.getServiceStatus());
                            if (success) {
                              alert('✅ API Key configurada correctamente');
                            } else {
                              alert('❌ Error al configurar API Key');
                            }
                          }}
                          size="sm"
                          icon={Save}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Estado de la API */}
                    <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Estado: {apiKeyStatus.hasApiKey ? (
                            apiKeyStatus.geminiAvailable ? '🟢 Conectado' : '🟡 Verificando...'
                          ) : '⚪ Sin configurar'}
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Requests hoy: {apiKeyStatus.dailyRequests}/50 
                          {apiKeyStatus.hasApiKey && ` (${apiKeyStatus.remainingRequests} restantes)`}
                        </p>
                      </div>
                      {!apiKeyStatus.hasApiKey && (
                        <a 
                          href="https://makersuite.google.com/app/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Obtener API Key →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Atajos de teclado */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Atajos de Teclado
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">A</kbd> - Abrir/Cerrar asistente</p>
                    <p>• <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Esc</kbd> - Cerrar asistente (cuando está abierto)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'backup':
        return <BackupManager />;
        
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'ai', label: 'Asistente AI', icon: Brain },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'permissions', label: 'Permisos', icon: Users },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" /> Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ajustes del sistema y preferencias personales
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} render={renderTab} />
      
      {/* Session Manager Modal */}
      <SessionManager 
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </div>
  );
};

export default SettingsPage; 