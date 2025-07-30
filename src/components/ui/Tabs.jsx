import React, { useState } from 'react';
import clsx from 'clsx';

/**
 * Componente de pestañas accesible
 * @param {Object} props
 * @param {Array<{ id: string, label: string, icon?: React.ElementType }>} props.tabs Lista de pestañas
 * @param {string} [props.initial] Id de la pestaña inicial
 * @param {(id: string) => React.ReactNode} props.render Contenido a renderizar por id
 */
const Tabs = ({ tabs, initial, render }) => {
  const [active, setActive] = useState(initial || tabs[0].id);

  return (
    <div className="w-full">
      {/* Navegación */}
      <div role="tablist" aria-label="Pestañas" className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            aria-controls={`tab-panel-${id}`}
            id={`tab-${id}`}
            onClick={() => setActive(id)}
            className={clsx(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium focus-ring',
              active === id
                ? 'bg-venezia-900 text-white shadow-minimal'
                : 'bg-white text-venezia-700 hover:bg-venezia-100 border border-venezia-200'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Paneles */}
      {tabs.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={`tab-panel-${id}`}
          aria-labelledby={`tab-${id}`}
          hidden={active !== id}
          className="focus:outline-none"
        >
          {active === id && render(id)}
        </div>
      ))}
    </div>
  );
};

export default Tabs; 