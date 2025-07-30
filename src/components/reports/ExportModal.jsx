import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Image, 
  Table,
  X,
  Check,
  Mail,
  Save
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import clsx from 'clsx';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  reportName = 'reporte' 
}) => {
  const [format, setFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [emailReport, setEmailReport] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Export format options
  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Documento PDF completo',
      icon: FileText,
      recommended: true
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Hoja de cálculo con datos',
      icon: Table
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Datos en formato CSV',
      icon: Table
    },
    {
      value: 'png',
      label: 'PNG',
      description: 'Imagen de alta calidad',
      icon: Image
    }
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport(format, {
        includeCharts,
        includeData,
        emailReport,
        emailAddress: emailReport ? emailAddress : null
      });
      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormat('pdf');
    setIncludeCharts(true);
    setIncludeData(true);
    setEmailReport(false);
    setEmailAddress('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Reporte
        </div>
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Report Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            {reportName?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Reporte'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecciona el formato y opciones de exportación
          </p>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Formato de Exportación
          </label>
          
          <div className="grid grid-cols-1 gap-3">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={clsx(
                    'relative p-4 border rounded-lg text-left transition-all',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    format === option.value
                      ? 'border-venezia-500 bg-venezia-50 dark:bg-venezia-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={clsx(
                      'w-5 h-5 mt-0.5',
                      format === option.value
                        ? 'text-venezia-600 dark:text-venezia-400'
                        : 'text-gray-400'
                    )} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'font-medium',
                          format === option.value
                            ? 'text-venezia-900 dark:text-venezia-100'
                            : 'text-gray-900 dark:text-white'
                        )}>
                          {option.label}
                        </span>
                        
                        {option.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                    
                    <div className={clsx(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      format === option.value
                        ? 'border-venezia-500 bg-venezia-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}>
                      {format === option.value && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Opciones de Contenido
          </label>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="rounded border-gray-300 text-venezia-600 focus:ring-venezia-500"
                disabled={format === 'csv'}
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Incluir gráficos
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Incluye visualizaciones y gráficos en el reporte
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeData}
                onChange={(e) => setIncludeData(e.target.checked)}
                className="rounded border-gray-300 text-venezia-600 focus:ring-venezia-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Incluir tablas de datos
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Incluye datos detallados en formato de tabla
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Email Option */}
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={emailReport}
              onChange={(e) => setEmailReport(e.target.checked)}
              className="rounded border-gray-300 text-venezia-600 focus:ring-venezia-500"
            />
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Enviar por email
              </span>
            </div>
          </label>

          {emailReport && (
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              label="Dirección de email"
              icon={Mail}
              required
            />
          )}
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Save className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Vista previa del archivo
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Nombre: {reportName}_{new Date().toISOString().split('T')[0]}.{format}
              </p>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                <p>✓ {includeCharts ? 'Con gráficos' : 'Sin gráficos'}</p>
                <p>✓ {includeData ? 'Con datos detallados' : 'Solo resumen'}</p>
                {emailReport && <p>✓ Se enviará a {emailAddress}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="outline"
            icon={X}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleExport}
            variant="primary"
            icon={Download}
            loading={loading}
            disabled={emailReport && !emailAddress}
          >
            {emailReport ? 'Enviar y Descargar' : 'Descargar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;