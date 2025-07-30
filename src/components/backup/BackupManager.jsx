import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Calendar, 
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchBackupInfo();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backups');
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Error al cargar backups');
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupInfo = async () => {
    try {
      const response = await fetch('/api/backups/info');
      const data = await response.json();
      if (data.success) {
        setBackupInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching backup info:', error);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup creado exitosamente');
        fetchBackups();
        fetchBackupInfo();
      } else {
        toast.error(data.message || 'Error al crear backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (fileName) => {
    if (!confirm(`¿Estás seguro de restaurar el backup ${fileName}? Se perderán todos los cambios actuales.`)) {
      return;
    }

    setRestoring(fileName);
    try {
      const response = await fetch(`/api/backups/${fileName}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup restaurado exitosamente');
        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(data.message || 'Error al restaurar backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Error al restaurar backup');
    } finally {
      setRestoring(null);
    }
  };

  const downloadBackup = (fileName) => {
    window.open(`/api/backups/${fileName}/download`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type) => {
    switch (type) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getBackupTypeLabel = (type) => {
    switch (type) {
      case 'scheduled':
        return 'Diario';
      case 'weekly':
        return 'Semanal';
      case 'manual':
        return 'Manual';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Gestión de Backups
        </h2>
        <button
          onClick={createBackup}
          disabled={creating || backupInfo?.isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Database className="h-5 w-5" />
          )}
          {creating ? 'Creando...' : 'Crear Backup'}
        </button>
      </div>

      {/* Backup Info */}
      {backupInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Backups</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {backupInfo.totalBackups} / {backupInfo.maxBackups}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Espacio Total</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatFileSize(backupInfo.totalSize)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Último Backup</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {backupInfo.newestBackup 
                    ? new Date(backupInfo.newestBackup.created).toLocaleDateString()
                    : 'Nunca'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Backups Disponibles
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">No hay backups disponibles</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {backups.map((backup) => (
              <motion.div
                key={backup.fileName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getBackupTypeIcon(backup.type)}
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {backup.fileName}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(backup.created).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(backup.size)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                            {getBackupTypeLabel(backup.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => downloadBackup(backup.fileName)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Descargar backup"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => restoreBackup(backup.fileName)}
                      disabled={restoring === backup.fileName}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Restaurar backup"
                    >
                      {restoring === backup.fileName ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Información sobre backups:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Los backups automáticos se realizan diariamente a las 2:00 AM</li>
              <li>Se realiza un backup completo semanal los domingos a las 3:00 AM</li>
              <li>Se mantienen los últimos 30 backups, los más antiguos se eliminan automáticamente</li>
              <li>Al restaurar un backup se perderán todos los cambios realizados después de ese punto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;