import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Keyboard, 
  Search, 
  Command, 
  Navigation,
  Zap,
  Filter,
  Eye,
  HelpCircle,
  Star,
  ChevronRight
} from 'lucide-react';
import Modal from './Modal';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import clsx from 'clsx';

const CategoryIcon = ({ category }) => {
  const icons = {
    navigate: Navigation,
    action: Zap,
    chat: Command,
    search: Search,
    filter: Filter,
    ui: Eye,
    help: HelpCircle,
    voice: Command,
    theme: Eye
  };
  
  const IconComponent = icons[category] || Command;
  return <IconComponent className="h-5 w-5" />;
};

const ShortcutItem = ({ shortcut, isHighlighted, onDemo }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleDemo = () => {
    setIsPressed(true);
    onDemo(shortcut);
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'group flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
        'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
        'cursor-pointer',
        isHighlighted
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        isPressed && 'scale-95 bg-blue-100 dark:bg-blue-900/50'
      )}
      onClick={handleDemo}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
          <CategoryIcon category={shortcut.category} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {shortcut.label}
          </p>
          {shortcut.target && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              → {shortcut.target}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {shortcut.combo.split('+').map((key, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400 text-sm">+</span>}
              <kbd className={clsx(
                'px-2 py-1 text-xs font-mono font-semibold rounded border shadow-sm',
                'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                'border-gray-300 dark:border-gray-600',
                'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30',
                'group-hover:border-blue-300 dark:group-hover:border-blue-600',
                isPressed && 'bg-blue-100 dark:bg-blue-900/50 border-blue-400'
              )}>
                {key}
              </kbd>
            </React.Fragment>
          ))}
        </div>
        
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </motion.div>
  );
};

const CategorySection = ({ title, shortcuts, searchTerm, onShortcutDemo }) => {
  const categoryIcons = {
    navigate: { icon: Navigation, color: 'text-blue-600 dark:text-blue-400' },
    action: { icon: Zap, color: 'text-green-600 dark:text-green-400' },
    chat: { icon: Command, color: 'text-purple-600 dark:text-purple-400' },
    search: { icon: Search, color: 'text-orange-600 dark:text-orange-400' },
    filter: { icon: Filter, color: 'text-indigo-600 dark:text-indigo-400' },
    ui: { icon: Eye, color: 'text-pink-600 dark:text-pink-400' },
    help: { icon: HelpCircle, color: 'text-gray-600 dark:text-gray-400' },
    voice: { icon: Command, color: 'text-red-600 dark:text-red-400' },
    theme: { icon: Eye, color: 'text-yellow-600 dark:text-yellow-400' }
  };

  const categoryInfo = categoryIcons[title.toLowerCase()] || categoryIcons.help;
  const IconComponent = categoryInfo.icon;

  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.combo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredShortcuts.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={clsx('p-2 rounded-lg bg-gray-100 dark:bg-gray-700', categoryInfo.color)}>
          <IconComponent className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {title === 'navigate' ? 'Navegación' : 
             title === 'action' ? 'Acciones' :
             title === 'chat' ? 'Chat AI' :
             title === 'search' ? 'Búsqueda' :
             title === 'filter' ? 'Filtros' :
             title === 'ui' ? 'Interfaz' :
             title === 'help' ? 'Ayuda' :
             title === 'voice' ? 'Comandos de Voz' :
             title === 'theme' ? 'Tema' : title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredShortcuts.length} atajo{filteredShortcuts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {filteredShortcuts.map((shortcut, index) => (
          <ShortcutItem
            key={index}
            shortcut={shortcut}
            isHighlighted={searchTerm && shortcut.label.toLowerCase().includes(searchTerm.toLowerCase())}
            onDemo={onShortcutDemo}
          />
        ))}
      </div>
    </motion.div>
  );
};

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const { shortcuts } = useKeyboardShortcuts();
  const [searchTerm, setSearchTerm] = useState('');
  const [demoCount, setDemoCount] = useState(0);

  const handleShortcutDemo = (shortcut) => {
    setDemoCount(prev => prev + 1);
    
    // Simular la ejecución del shortcut
    const event = new CustomEvent('keyboardShortcut', {
      detail: {
        type: shortcut.category,
        target: shortcut.target,
        label: shortcut.label,
        demo: true
      }
    });
    window.dispatchEvent(event);
  };

  const totalShortcuts = Object.values(shortcuts).reduce((total, categoryShortcuts) => 
    total + categoryShortcuts.length, 0
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setDemoCount(0);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Keyboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Atajos de Teclado
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalShortcuts} atajos disponibles para acelerar tu trabajo
            </p>
          </div>
        </div>
      }
      size="xl"
      className="max-h-[85vh]"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar atajos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Tips Pro
            </h4>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• Haz clic en cualquier atajo para probarlo</p>
            <p>• Los atajos funcionan desde cualquier página</p>
            <p>• Usa ⌘+? para abrir esta ayuda rápidamente</p>
            {demoCount > 0 && (
              <p className="font-medium">• ¡Has probado {demoCount} atajo{demoCount !== 1 ? 's' : ''}!</p>
            )}
          </div>
        </div>

        {/* Shortcuts by Category */}
        <div className="space-y-8 max-h-96 overflow-y-auto custom-scrollbar">
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <CategorySection
              key={category}
              title={category}
              shortcuts={categoryShortcuts}
              searchTerm={searchTerm}
              onShortcutDemo={handleShortcutDemo}
            />
          ))}
        </div>

        {/* No results */}
        {searchTerm && Object.values(shortcuts).every(categoryShortcuts => 
          categoryShortcuts.filter(shortcut =>
            shortcut.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shortcut.combo.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0
        ) && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron atajos para "{searchTerm}"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {totalShortcuts} atajos totales • Haz clic para probar
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;