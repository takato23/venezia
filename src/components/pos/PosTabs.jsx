import React from 'react';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`min-w-[120px] px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      active
        ? 'bg-[var(--pos-cta,#2563eb)] text-white focus-visible:ring-[var(--pos-cta,#2563eb)]'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
    }`}
    aria-pressed={active}
  >
    {children}
  </button>
);

const PosTabs = ({ active = 'helados', onChange }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-transparent" role="tablist" aria-label="Categorías POS">
      <TabButton active={active === 'helados'} onClick={() => onChange('helados')}>
        Helados
      </TabButton>
      <TabButton active={active === 'otros'} onClick={() => onChange('otros')}>
        Otros
      </TabButton>
    </div>
  );
};

export default PosTabs;


