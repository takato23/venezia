import React, { useEffect, useRef, useState } from 'react';

const TotalsPanel = ({ subtotal, discount, total, code, onApplyCode, onRemoveCode, onConfirm, online }) => {
  const [localCode, setLocalCode] = useState(code || '');
  const codeRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        codeRef.current?.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onConfirm]);

  useEffect(() => {
    setLocalCode(code || '');
  }, [code]);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
        <span className="text-gray-900 dark:text-white">${subtotal.toFixed?.(2) ?? Number(subtotal).toFixed(2)}</span>
      </div>
      {discount > 0 && (
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-300">Descuento</span>
          <span className="text-red-600 dark:text-red-400">- ${Number(discount).toFixed(2)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-lg font-bold pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-gray-900 dark:text-white">TOTAL</span>
        <span className="text-[var(--pos-cta,#2563eb)]">${Number(total).toFixed(2)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={codeRef}
          value={localCode}
          onChange={(e) => setLocalCode(e.target.value)}
          placeholder="Código (F2)"
          aria-label="Código de descuento"
          className="flex-1 px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        />
        <button
          onClick={() => onApplyCode?.(localCode)}
          className="px-3 py-3 rounded-xl bg-[var(--pos-cta,#2563eb)] text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Validar y aplicar código"
        >
          Validar
        </button>
        {!!code && (
          <button
            onClick={() => onRemoveCode?.()}
            className="px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2"
            aria-label="Quitar código aplicado"
          >
            Quitar
          </button>
        )}
      </div>

      <button
        onClick={() => onConfirm?.()}
        className="mt-3 w-full px-4 py-4 rounded-2xl bg-[var(--pos-cta,#2563eb)] text-white text-base font-semibold hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Confirmar venta"
      >
        Confirmar Venta (Enter)
      </button>

      {!online && (
        <div className="mt-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
          Modo offline: la venta se guardará en cola.
        </div>
      )}
    </div>
  );
};

export default TotalsPanel;


