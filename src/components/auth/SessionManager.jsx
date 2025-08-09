import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Monitor, 
  Smartphone, 
  MapPin, 
  Clock, 
  Shield,
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.supabase';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import LoadingState from '../ui/LoadingState';
import clsx from 'clsx';

const SessionManager = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { success, error, warning } = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(new Set());

  // Load active sessions
  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        error('Error', 'No se pudieron cargar las sesiones');
      }
    } catch (err) {
      error('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Terminate session
  const terminateSession = async (sessionId, isCurrent = false) => {
    if (isCurrent && !window.confirm('¿Estás seguro de cerrar tu sesión actual?')) {
      return;
    }

    setTerminating(prev => new Set(prev).add(sessionId));
    
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (isCurrent) {
          success('Sesión cerrada', 'Tu sesión actual se ha cerrado');
          window.location.reload();
        } else {
          success('Sesión terminada', 'La sesión se ha cerrado correctamente');
          loadSessions(); // Reload sessions
        }
      } else {
        error('Error', 'No se pudo terminar la sesión');
      }
    } catch (err) {
      error('Error', 'Error al terminar la sesión');
    } finally {
      setTerminating(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  // Terminate all other sessions
  const terminateAllOtherSessions = async () => {
    if (!window.confirm('¿Estás seguro de cerrar todas las demás sesiones?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/sessions/terminate-others', {
        method: 'POST'
      });
      
      if (response.ok) {
        success('Sesiones cerradas', 'Todas las demás sesiones se han cerrado');
        loadSessions();
      } else {
        error('Error', 'No se pudieron cerrar las sesiones');
      }
    } catch (err) {
      error('Error', 'Error al cerrar las sesiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Get device icon
  const getDeviceIcon = (userAgent) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return Smartphone;
    }
    return Monitor;
  };

  // Get browser name
  const getBrowserName = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Desconocido';
  };

  // Get location display
  const getLocationDisplay = (location) => {
    if (location?.city && location?.country) {
      return `${location.city}, ${location.country}`;
    }
    return location?.ip || 'Ubicación desconocida';
  };

  // Check if session is suspicious
  const isSuspiciousSession = (session) => {
    // Logic to determine if session is suspicious
    // Could check unusual location, device, etc.
    return session.is_suspicious || false;
  };

  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Gestión de Sesiones
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Seguridad de tu Cuenta
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Revisa y gestiona las sesiones activas en tu cuenta. Si ves alguna actividad sospechosa, 
                termina esas sesiones inmediatamente.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={loadSessions}
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={loading}
            >
              Actualizar
            </Button>
            
            {otherSessions.length > 0 && (
              <Button
                onClick={terminateAllOtherSessions}
                variant="outline"
                size="sm"
                icon={X}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                Cerrar Todas las Demás
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} activa{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sessions List */}
        <LoadingState
          loading={loading}
          error={false}
          empty={sessions.length === 0}
          onRetry={loadSessions}
          emptyText="No hay sesiones activas"
          emptyIcon={Activity}
        />

        {!loading && sessions.length > 0 && (
          <div className="space-y-4">
            {/* Current Session */}
            {currentSession && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {React.createElement(getDeviceIcon(currentSession.user_agent), {
                      className: "w-6 h-6 text-green-600 dark:text-green-400 mt-1"
                    })}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Sesión Actual
                        </h4>
                        <Badge variant="success" size="xs">
                          Activo
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <p>{getBrowserName(currentSession.user_agent)} en {currentSession.platform || 'Plataforma desconocida'}</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{getLocationDisplay(currentSession.location)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Iniciado: {new Date(currentSession.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>
                            Última actividad: {new Date(currentSession.last_activity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => terminateSession(currentSession.id, true)}
                    variant="outline"
                    size="sm"
                    icon={X}
                    loading={terminating.has(currentSession.id)}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}

            {/* Other Sessions */}
            {otherSessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.user_agent);
              const suspicious = isSuspiciousSession(session);
              
              return (
                <div
                  key={session.id}
                  className={clsx(
                    'border rounded-lg p-4',
                    suspicious 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <DeviceIcon className={clsx(
                        'w-6 h-6 mt-1',
                        suspicious 
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      )} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={clsx(
                            'font-medium',
                            suspicious 
                              ? 'text-red-900 dark:text-red-100'
                              : 'text-gray-900 dark:text-white'
                          )}>
                            {getBrowserName(session.user_agent)} en {session.platform || 'Plataforma desconocida'}
                          </h4>
                          
                          {suspicious && (
                            <Badge variant="error" size="xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Sospechoso
                            </Badge>
                          )}
                        </div>
                        
                        <div className={clsx(
                          'space-y-1 text-sm',
                          suspicious 
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-gray-600 dark:text-gray-400'
                        )}>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{getLocationDisplay(session.location)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Iniciado: {new Date(session.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>
                              Última actividad: {new Date(session.last_activity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => terminateSession(session.id)}
                      variant="outline"
                      size="sm"
                      icon={X}
                      loading={terminating.has(session.id)}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Terminar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Security Tips */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Consejos de Seguridad
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Cierra sesiones en dispositivos que ya no uses</li>
            <li>• Revisa regularmente tus sesiones activas</li>
            <li>• Reporta cualquier actividad sospechosa</li>
            <li>• Usa dispositivos confiables para acceder a tu cuenta</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            icon={X}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionManager;