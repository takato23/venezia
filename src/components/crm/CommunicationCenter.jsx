import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send,
  Users,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const CommunicationCenter = ({ customers, onClose }) => {
  const [messageType, setMessageType] = useState('email');
  const [recipients, setRecipients] = useState('all');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  
  const { success, error } = useToast();

  // Message templates
  const templates = [
    {
      id: 'birthday',
      name: 'Cumpleaños',
      subject: '¡Feliz Cumpleaños! 🎂',
      message: 'Hola {nombre},\n\n¡Feliz cumpleaños! En tu día especial, queremos regalarte un 20% de descuento en tu próxima compra.\n\nCódigo: CUMPLE20\n\n¡Esperamos verte pronto!'
    },
    {
      id: 'promotion',
      name: 'Promoción',
      subject: 'Oferta Especial para Ti 🎁',
      message: 'Hola {nombre},\n\nTenemos una oferta especial solo para nuestros clientes favoritos:\n\n2x1 en todos los helados artesanales este fin de semana.\n\n¡No te lo pierdas!'
    },
    {
      id: 'loyalty',
      name: 'Programa de Fidelidad',
      subject: '¡Felicitaciones! Has subido de nivel 🌟',
      message: 'Hola {nombre},\n\n¡Excelentes noticias! Has alcanzado el nivel {nivel} en nuestro programa de fidelidad.\n\nAhora disfrutas de:\n- {beneficios}\n\n¡Gracias por tu preferencia!'
    },
    {
      id: 'reminder',
      name: 'Recordatorio',
      subject: 'Te extrañamos 💙',
      message: 'Hola {nombre},\n\nHace tiempo que no nos visitas. Te esperamos con tus sabores favoritos y algunas novedades que seguro te encantarán.\n\nComo agradecimiento, aquí tienes un 15% de descuento: VUELVE15'
    }
  ];

  // Filter customers based on selection
  const getRecipientsList = () => {
    let filteredCustomers = [...customers];
    
    if (recipients === 'segment' && selectedSegment !== 'all') {
      filteredCustomers = filteredCustomers.filter(c => c.segment === selectedSegment);
    } else if (recipients === 'custom') {
      filteredCustomers = selectedCustomers;
    }
    
    return filteredCustomers;
  };

  const recipientsList = getRecipientsList();

  const handleTemplateSelect = (template) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      error('Error', 'Por favor completa el asunto y mensaje');
      return;
    }

    if (recipientsList.length === 0) {
      error('Error', 'No hay destinatarios seleccionados');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success(
        'Mensaje enviado',
        `Se envió el mensaje a ${recipientsList.length} cliente${recipientsList.length > 1 ? 's' : ''}`
      );
      
      onClose();
    } catch (err) {
      error('Error', 'No se pudo enviar el mensaje');
    }
  };

  const handleCustomerToggle = (customer) => {
    setSelectedCustomers(prev => {
      const exists = prev.find(c => c.id === customer.id);
      if (exists) {
        return prev.filter(c => c.id !== customer.id);
      } else {
        return [...prev, customer];
      }
    });
  };

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Centro de Comunicación
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Envía mensajes personalizados a tus clientes
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de mensaje
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'sms', label: 'SMS', icon: Phone },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setMessageType(type.id)}
                      className={clsx(
                        'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors',
                        messageType === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destinatarios
                </label>
                <Select
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="mb-2"
                >
                  <option value="all">Todos los clientes ({customers.length})</option>
                  <option value="segment">Por segmento</option>
                  <option value="custom">Selección personalizada</option>
                </Select>

                {recipients === 'segment' && (
                  <Select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                  >
                    <option value="all">Todos los segmentos</option>
                    <option value="vip">VIP</option>
                    <option value="frequent">Frecuente</option>
                    <option value="regular">Regular</option>
                    <option value="new">Nuevo</option>
                    <option value="inactive">Inactivo</option>
                  </Select>
                )}

                {recipients === 'custom' && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg max-h-40 overflow-y-auto">
                    {customers.map(customer => (
                      <label
                        key={customer.id}
                        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.some(c => c.id === customer.id)}
                          onChange={() => handleCustomerToggle(customer)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {customer.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {recipientsList.length} destinatario{recipientsList.length !== 1 && 's'} seleccionado{recipientsList.length !== 1 && 's'}
                </div>
              </div>

              {/* Subject (for email) */}
              {messageType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asunto
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ingresa el asunto del mensaje"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensaje
                </label>
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Usa {'{nombre}'} para personalizar el mensaje
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4" />
                  Programar envío (opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Templates Sidebar */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Plantillas
              </h3>
              
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {template.subject}
                    </div>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Vista previa
                </h4>
                {recipientsList.length > 0 && (
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Para:</span>
                      <div className="text-gray-700 dark:text-gray-300">
                        {recipientsList[0].name}
                        {recipientsList.length > 1 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {' '}y {recipientsList.length - 1} más
                          </span>
                        )}
                      </div>
                    </div>
                    {messageType === 'email' && subject && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Asunto:</span>
                        <div className="text-gray-700 dark:text-gray-300">{subject}</div>
                      </div>
                    )}
                    {message && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Mensaje:</span>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {message.replace('{nombre}', recipientsList[0].name)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {scheduledDate && scheduledTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Programado para {new Date(`${scheduledDate} ${scheduledTime}`).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={recipientsList.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {scheduledDate ? 'Programar' : 'Enviar'} Mensaje
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CommunicationCenter;