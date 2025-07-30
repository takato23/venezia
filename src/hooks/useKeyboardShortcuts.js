import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = () => {
  // Definir shortcuts globales
  const shortcuts = {
    // Navegación rápida - Secciones principales
    'ctrl+1': () => ({ type: 'navigate', target: '/', label: 'Dashboard' }),
    'ctrl+2': () => ({ type: 'navigate', target: '/pos', label: 'Punto de Venta' }),
    'ctrl+3': () => ({ type: 'navigate', target: '/sales', label: 'Ventas' }),
    'ctrl+4': () => ({ type: 'navigate', target: '/inventory', label: 'Inventario' }),
    'ctrl+5': () => ({ type: 'navigate', target: '/production', label: 'Producción' }),
    'ctrl+6': () => ({ type: 'navigate', target: '/analytics', label: 'Analíticas' }),
    'ctrl+7': () => ({ type: 'navigate', target: '/ai-assistant', label: 'Asistente AI' }),
    
    // Navegación extendida - Funcionalidades migradas
    'ctrl+shift+1': () => ({ type: 'navigate', target: '/ingredients', label: 'Ingredientes' }),
    'ctrl+shift+2': () => ({ type: 'navigate', target: '/recipes', label: 'Recetas' }),
    'ctrl+shift+3': () => ({ type: 'navigate', target: '/production-orders', label: 'Órdenes de Producción' }),
    'ctrl+shift+4': () => ({ type: 'navigate', target: '/batch-assignment', label: 'Asignar Lotes' }),
    'ctrl+shift+5': () => ({ type: 'navigate', target: '/transactions', label: 'Transacciones' }),
    'ctrl+shift+6': () => ({ type: 'navigate', target: '/stores', label: 'Tiendas' }),
    'ctrl+shift+7': () => ({ type: 'navigate', target: '/deliveries', label: 'Entregas' }),
    'ctrl+shift+8': () => ({ type: 'navigate', target: '/providers', label: 'Proveedores' }),
    'ctrl+shift+9': () => ({ type: 'navigate', target: '/web-users', label: 'Usuarios Web' }),
    'ctrl+shift+0': () => ({ type: 'navigate', target: '/settings', label: 'Configuración' }),
    
    // Chat AI
    'ctrl+space': () => ({ type: 'chat', action: 'toggle', label: 'Toggle Chat AI' }),
    'ctrl+shift+c': () => ({ type: 'chat', action: 'open', label: 'Abrir Chat' }),
    'escape': () => ({ type: 'chat', action: 'close', label: 'Cerrar Chat' }),
    'ctrl+shift+x': () => ({ type: 'chat', action: 'expand', label: 'Expandir Chat' }),
    
    // Búsqueda y comandos
    'ctrl+k': () => ({ type: 'search', action: 'open', label: 'Búsqueda rápida' }),
    'ctrl+slash': () => ({ type: 'help', action: 'shortcuts', label: 'Ver shortcuts' }),
    
    // Voz
    'ctrl+shift+v': () => ({ type: 'voice', action: 'toggle', label: 'Comando de voz' }),
    
    // Tema
    'ctrl+shift+d': () => ({ type: 'theme', action: 'toggle', label: 'Toggle tema' }),
    'ctrl+shift+a': () => ({ type: 'action', action: 'toggle_auto_theme', label: 'Toggle tema automático' }),
    
    // Acciones rápidas - Creación
    'ctrl+n': () => ({ type: 'action', action: 'new_sale', target: '/pos', label: 'Nueva venta' }),
    'ctrl+shift+n': () => ({ type: 'action', action: 'new_product', target: '/products', label: 'Nuevo producto' }),
    'ctrl+alt+n': () => ({ type: 'action', action: 'new_order', target: '/production-orders', label: 'Nueva orden de producción' }),
    'ctrl+alt+i': () => ({ type: 'action', action: 'new_ingredient', target: '/ingredients', label: 'Nuevo ingrediente' }),
    'ctrl+alt+r': () => ({ type: 'action', action: 'new_recipe', target: '/recipes', label: 'Nueva receta' }),
    'ctrl+alt+t': () => ({ type: 'action', action: 'new_transaction', target: '/transactions', label: 'Nueva transacción' }),
    
    // Acciones de sistema
    'ctrl+r': () => ({ type: 'action', action: 'refresh_data', label: 'Actualizar datos' }),
    'alt+r': () => ({ type: 'action', action: 'refresh_data', label: 'Actualizar datos' }),
    'ctrl+e': () => ({ type: 'action', action: 'export_data', label: 'Exportar datos' }),
    'ctrl+i': () => ({ type: 'action', action: 'import_data', label: 'Importar datos' }),
    
    // Filtros rápidos
    'ctrl+f': () => ({ type: 'filter', action: 'toggle_filters', label: 'Toggle filtros' }),
    'ctrl+shift+f': () => ({ type: 'filter', action: 'clear_filters', label: 'Limpiar filtros' }),
    'ctrl+l': () => ({ type: 'filter', action: 'low_stock', target: '/inventory?filter=low_stock', label: 'Stock bajo' }),
    'ctrl+p': () => ({ type: 'filter', action: 'pending_orders', target: '/production-orders?status=pending', label: 'Órdenes pendientes' }),
    
    // Sidebar
    'ctrl+b': () => ({ type: 'ui', action: 'toggle_sidebar', label: 'Toggle sidebar' }),
    
    // Modo focus y vistas
    'f11': () => ({ type: 'ui', action: 'toggle_focus', label: 'Modo focus' }),
    'ctrl+m': () => ({ type: 'ui', action: 'toggle_mobile_view', label: 'Vista móvil' }),
    'ctrl+g': () => ({ type: 'ui', action: 'toggle_grid_view', label: 'Vista grilla' }),
    'ctrl+t': () => ({ type: 'ui', action: 'toggle_table_view', label: 'Vista tabla' }),
    
    // Ayuda y documentación
    'ctrl+?': () => ({ type: 'help', action: 'shortcuts', label: 'Ver atajos de teclado' }),
    'ctrl+h': () => ({ type: 'help', action: 'help', label: 'Ayuda' }),
    'ctrl+shift+h': () => ({ type: 'help', action: 'tutorial', label: 'Tutorial' }),
  };

  // Obtener combinación de teclas
  const getKeyCombo = useCallback((event) => {
    const keys = [];
    
    if (event.ctrlKey || event.metaKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    
    // Verificar que event.key existe
    if (!event.key) {
      return null;
    }
    
    // Teclas especiales
    const specialKeys = {
      ' ': 'space',
      'Escape': 'escape',
      '/': 'slash',
      'F11': 'f11'
    };
    
    const key = specialKeys[event.key] || event.key.toLowerCase();
    keys.push(key);
    
    return keys.join('+');
  }, []);

  // Manejar evento de teclado
  const handleKeyDown = useCallback((event) => {
    // Ignorar si estamos en un input/textarea
    const activeElement = document.activeElement;
    const isInInput = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
    
    const combo = getKeyCombo(event);
    
    // Si no se pudo obtener la combinación, salir
    if (!combo) {
      return;
    }
    
    const shortcut = shortcuts[combo];
    
    if (shortcut) {
      // Para algunos shortcuts, permitir en inputs
      const allowInInputs = ['escape', 'f11'];
      
      if (isInInput && !allowInInputs.includes(combo)) {
        return;
      }
      
      event.preventDefault();
      event.stopPropagation();
      
      const command = shortcut();
      
      // Mostrar feedback visual
      showShortcutFeedback(command.label);
      
      // Ejecutar comando
      const customEvent = new CustomEvent('keyboardShortcut', { 
        detail: command 
      });
      window.dispatchEvent(customEvent);
      
      // Enviar analytics de uso de shortcuts
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'keyboard_shortcut_used', {
          'shortcut': combo,
          'label': command.label,
          'category': command.type
        });
      }
    }
  }, [getKeyCombo]);

  // Mostrar feedback visual del shortcut
  const showShortcutFeedback = useCallback((label) => {
    // Crear elemento de feedback
    const feedback = document.createElement('div');
    feedback.textContent = `⌨️ ${label}`;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      pointer-events: none;
      animation: shortcutFadeIn 0.2s ease-out;
    `;
    
    // Agregar animación CSS
    if (!document.getElementById('shortcut-styles')) {
      const style = document.createElement('style');
      style.id = 'shortcut-styles';
      style.textContent = `
        @keyframes shortcutFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shortcutFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remover después de 2 segundos
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.style.animation = 'shortcutFadeOut 0.2s ease-in forwards';
        setTimeout(() => {
          if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
          }
        }, 200);
      }
    }, 2000);
  }, []);

  // Obtener lista de shortcuts agrupados para mostrar en ayuda
  const getShortcutsList = useCallback(() => {
    const shortcuts_list = Object.entries(shortcuts).map(([combo, commandFn]) => {
      const command = commandFn();
      return {
        combo: combo.replace('ctrl', '⌘').replace('shift', '⇧').replace('alt', '⌥'),
        label: command.label,
        category: command.type,
        target: command.target
      };
    });
    
    // Agrupar por categoría
    const grouped = shortcuts_list.reduce((groups, shortcut) => {
      const category = shortcut.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    }, {});
    
    return grouped;
  }, []);

  // Configurar listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: getShortcutsList(),
    showShortcutFeedback
  };
};

export default useKeyboardShortcuts;