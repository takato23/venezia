import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listProducts } from '../../services/productsApi';

const OtrosCatalog = ({ categories = ['bebidas','toppings','extras'], onAdd }) => {
  const [activeCategory, setActiveCategory] = useState('bebidas');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleF1 = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleF1);
    return () => window.removeEventListener('keydown', handleF1);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { success, data } = await listProducts({ search });
      if (mounted) {
        setProducts(success ? data : []);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [search]);

  const otherItems = useMemo(() =>
    products.filter(p => (p.type === 'otro' || !['Helados', 'Helado'].includes(p.category?.name))
  ), [products]);

  const filtered = useMemo(() => {
    const key = activeCategory.toLowerCase();
    return otherItems.filter(p => (p.category?.name?.toLowerCase() || p.category)?.includes(key));
  }, [otherItems, activeCategory]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-2 rounded-xl text-sm min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              activeCategory === c
                ? 'bg-[var(--pos-cta,#2563eb)] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
            aria-pressed={activeCategory === c}
            aria-label={`Categoría ${c}`}
          >
            {c}
          </button>
        ))}
      </div>

      <input
        ref={searchRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Buscar en ${activeCategory} (F1)`}
        aria-label="Buscar en catálogo"
        className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Cargando…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onAdd({ product: p, qty: 1 })}
                className="min-h-[120px] p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[var(--pos-cta,#2563eb)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <div className="text-base font-semibold text-gray-900 dark:text-white truncate">{p.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">${p.price}</div>
                {p.low_stock && (
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Stock bajo</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OtrosCatalog;


