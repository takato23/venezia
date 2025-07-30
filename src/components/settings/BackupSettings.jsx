import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Clock,
  CheckCircle,
  AlertCircle,
  Cloud,
  HardDrive,
  Calendar,
  Play,
  Pause,
  RefreshCw,
  Shield,
  FileArchive,
  Settings,
  Save
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import { useApiCache } from '../../hooks/useApiCache';
import LoadingSpinner from '../ui/LoadingSpinner';
import clsx from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BackupSettings = () => {
  const [settings, setSettings] = useState({
    autoBackupEnabled: false,
    backupFrequency: 'daily',
    backupTime: '02:00',
    backupRetention: 30,
    backupLocation: 'local',
    cloudProvider: '',
    encryptBackups: true,
    includeMedia: true,
    notifyOnComplete: true,
    notifyOnError: true
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const { success, error, warning } = useToast();

  // Fetch backup history and settings
  const { 
    data: backupData, 
    loading, 
    refetch 
  } = useApiCache('/api/backups');

  const backups = backupData?.backups || [];
  const lastBackup = backups[0];
  const nextBackupTime = backupData?.next_backup_time;

  useEffect(() => {
    if (backupData?.settings) {
      setSettings(backupData.settings);
    }
  }, [backupData]);

  // Handle manual backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual',
          include_media: settings.includeMedia,
          encrypt: settings.encryptBackups
        })
      });

      if (response.ok) {
        success('Backup creado', 'El respaldo se creó exitosamente');
        refetch();
      } else {
        throw new Error('Error al crear backup');
      }
    } catch (err) {
      error('Error', 'No se pudo crear el backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle restore
  const handleRestore = async (backup) => {
    if (!window.confirm(`¿Estás seguro de restaurar el backup del ${format(new Date(backup.created_at), 'PPP', { locale: es })}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/backups/restore/${backup.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        success('Restauración iniciada', 'El sistema se restaurará y reiniciará en breve');
        // Reload after a delay
        setTimeout(() => window.location.reload(), 3000);
      } else {
        throw new Error('Error al restaurar');
      }
    } catch (err) {
      error('Error', 'No se pudo restaurar el backup');
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/backups/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        success('Configuración guardada', 'Los ajustes de backup se actualizaron');
      } else {
        throw new Error('Error al guardar configuración');
      }
    } catch (err) {
      error('Error', 'No se pudo guardar la configuración');
    }
  };

  // Handle backup download
  const handleDownload = async (backup) => {
    try {
      const response = await fetch(`/api/backups/download/${backup.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.id}-${format(new Date(backup.created_at), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      success('Descarga iniciada', 'El backup se está descargando');
    } catch (err) {
      error('Error', 'No se pudo descargar el backup');
    }
  };

  const getBackupStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'in_progress':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Cargando configuración de backups..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Sistema de Backup
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configura copias de seguridad automáticas y gestiona respaldos
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
              Estado del Sistema
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Último backup
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {lastBackup ? (
                      <>
                        {format(new Date(lastBackup.created_at), 'PPPp', { locale: es })}
                        <Badge 
                          variant={getBackupStatusColor(lastBackup.status)} 
                          size="sm" 
                          className="ml-2"
                        >
                          {lastBackup.status === 'completed' ? 'Exitoso' : lastBackup.status}
                        </Badge>
                      </>
                    ) : (
                      'Sin backups realizados'
                    )}
                  </div>
                </div>
              </div>

              {nextBackupTime && settings.autoBackupEnabled && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Próximo backup
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(nextBackupTime), 'PPPp', { locale: es })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Espacio utilizado
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatFileSize(backupData?.total_size || 0)} en {backups.length} backups
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creando backup...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Crear Backup Ahora
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Automatic Backup Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
          Configuración de Backup Automático
        </h4>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, autoBackupEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activar backup automático
              </span>
            </label>
          </div>

          {settings.autoBackupEnabled && (
            <>
              {/* Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frecuencia
                  </label>
                  <Select
                    value={settings.backupFrequency}
                    onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                  >
                    <option value="hourly">Cada hora</option>
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora del backup
                  </label>
                  <Input
                    type="time"
                    value={settings.backupTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, backupTime: e.target.value }))}
                  />
                </div>
              </div>

              {/* Retention */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Retención de backups (días)
                </label>
                <Input
                  type="number"
                  value={settings.backupRetention}
                  onChange={(e) => setSettings(prev => ({ ...prev, backupRetention: parseInt(e.target.value) }))}
                  min="1"
                  max="365"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Los backups más antiguos se eliminarán automáticamente
                </p>
              </div>
            </>
          )}

          {/* Storage Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicación del almacenamiento
            </label>
            <Select
              value={settings.backupLocation}
              onChange={(e) => setSettings(prev => ({ ...prev, backupLocation: e.target.value }))}
            >
              <option value="local">Local</option>
              <option value="cloud">Nube</option>
              <option value="both">Local y Nube</option>
            </Select>
          </div>

          {(settings.backupLocation === 'cloud' || settings.backupLocation === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proveedor de nube
              </label>
              <Select
                value={settings.cloudProvider}
                onChange={(e) => setSettings(prev => ({ ...prev, cloudProvider: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                <option value="google_drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
                <option value="aws_s3">Amazon S3</option>
                <option value="azure">Azure Storage</option>
              </Select>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.encryptBackups}
                onChange={(e) => setSettings(prev => ({ ...prev, encryptBackups: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Encriptar backups
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.includeMedia}
                onChange={(e) => setSettings(prev => ({ ...prev, includeMedia: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <FileArchive className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Incluir archivos multimedia
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifyOnComplete}
                onChange={(e) => setSettings(prev => ({ ...prev, notifyOnComplete: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <CheckCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Notificar cuando se complete
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifyOnError}
                onChange={(e) => setSettings(prev => ({ ...prev, notifyOnError: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Notificar en caso de error
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={handleSaveSettings}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-base font-medium text-gray-900 dark:text-white">
            Historial de Backups
          </h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(backup.created_at), 'PPPp', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={backup.type === 'manual' ? 'blue' : 'gray'} size="sm">
                      {backup.type === 'manual' ? 'Manual' : 'Automático'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={getBackupStatusColor(backup.status)} 
                      size="sm"
                    >
                      {backup.status === 'completed' ? 'Completado' : 
                       backup.status === 'failed' ? 'Fallido' : 
                       backup.status === 'in_progress' ? 'En progreso' : backup.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(backup)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        disabled={backup.status !== 'completed'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreConfirm(true);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        disabled={backup.status !== 'completed'}
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {backups.length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay backups disponibles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmar Restauración
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de restaurar el backup del {format(new Date(selectedBackup.created_at), 'PPP', { locale: es })}?
              Esta acción reemplazará todos los datos actuales y no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleRestore(selectedBackup);
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
              >
                Restaurar Backup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupSettings;