import React from 'react';

const TicketView = ({ sale, onPrint, onNewSale }) => {
  if (!sale) return null;
  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 print:w-[105mm]">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold">Venezia</h3>
        <div className="text-sm text-gray-600">Ticket #{sale.sale_number || sale.receipt_number}</div>
        <div className="text-xs text-gray-500">{new Date().toLocaleString('es-AR')}</div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sale.items?.map((it) => (
          <div key={`${it.product_id}-${Math.random()}`} className="py-2 flex items-center justify-between text-sm">
            <div className="mr-2">
              <div className="font-medium">{it.product_name || it.name}</div>
              {it.meta?.sabor && <div className="text-xs text-gray-500">{it.meta.sabor} · {it.meta.formato}</div>}
            </div>
            <div className="text-right">
              <div>x{it.qty || it.quantity}</div>
              <div className="font-semibold">${(it.price).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm">
        <div className="flex items-center justify-between"><span>Subtotal</span><span>${Number(sale.subtotal ?? sale.total).toFixed(2)}</span></div>
        {sale.discount ? (
          <div className="flex items-center justify-between text-red-600"><span>Descuento</span><span>- ${Number(sale.discount).toFixed(2)}</span></div>
        ) : null}
        <div className="flex items-center justify-between text-base font-bold mt-1"><span>Total</span><span>${Number(sale.total_final ?? sale.total).toFixed(2)}</span></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onPrint} className="px-3 py-3 rounded-xl bg-[var(--pos-cta,#2563eb)] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label="Imprimir ticket">Imprimir</button>
        <button onClick={onNewSale} className="px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus-visible:ring-2" aria-label="Nueva venta">Nueva venta</button>
      </div>
      <style>{`@media print{ @page{ size: A6; margin: 8mm } body{ background:white } }`}</style>
    </div>
  );
};

export default TicketView;


