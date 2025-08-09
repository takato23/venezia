import React from 'react';

const CartList = ({ items, onQty, onRemove, selectedId, onSelect }) => {
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Carrito de compra">
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Carrito vacío. Agregá productos.</div>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect?.(item.id)}
          className={`p-3 rounded-2xl bg-white dark:bg-gray-800 border ${
            selectedId === item.id
              ? 'border-[var(--pos-cta,#2563eb)] ring-2 ring-offset-2 ring-[var(--pos-cta,#2563eb)]'
              : 'border-gray-200 dark:border-gray-700'
          }`}
          role="listitem"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
              {item?.meta?.sabor && (
                <div className="text-xs text-gray-500">{item.meta.sabor} · {item.meta.formato}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">${(item.price).toFixed(2)}</div>
              <div className="text-base font-bold text-gray-900 dark:text-white">${(item.price * item.qty).toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQty(item.id, Math.max(1, item.qty - 1))}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2"
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="min-w-[32px] text-center">{item.qty}</span>
              <button
                onClick={() => onQty(item.id, item.qty + 1)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Eliminar ítem"
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartList;


