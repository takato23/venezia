import React from 'react';

const PosShell = ({ store, user, online, pending = 0, onRetryQueue, children, footerActions }) => {
  return (
    <div className="h-[calc(100vh-0px)] flex flex-col bg-[var(--pos-bg,theme(colors.gray.50))] dark:bg-gray-900">
      {/* Header */}
      <div className="bg-[var(--pos-card,white)] dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Venezia POS</h1>
          <span className="text-sm text-gray-600 dark:text-gray-300">{store?.name || 'Sucursal'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={online ? 'text-green-600' : 'text-red-600'} aria-live="polite" aria-atomic="true">
            {online ? '● Online' : '● Offline'}
          </span>
          <span className="text-gray-600 dark:text-gray-300">{new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</span>
          <span className="text-gray-700 dark:text-gray-200">{user?.name || user?.username || 'Usuario'}</span>
          <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Pendientes: {pending}</span>
          {pending > 0 && (
            <button onClick={onRetryQueue} className="ml-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500" aria-label="Reintentar envíos pendientes">
              Reintentar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Footer */}
      <div className="bg-[var(--pos-card,white)] dark:bg-gray-800 shadow-inner px-4 py-3 flex items-center gap-3">
        {footerActions}
      </div>
    </div>
  );
};

export default PosShell;


