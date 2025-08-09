import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminCodesStore } from '../../../stores/adminCodesStore';

const parseQS = (search) => Object.fromEntries(new URLSearchParams(search));
const toQS = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  return `?${sp.toString()}`;
};

function CreateCodeModal({ open, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [storeId, setStoreId] = useState('');
  const [type, setType] = useState('event');

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" aria-modal="true" role="dialog" aria-label="Crear código admin">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow w-full max-w-md p-4">
        <h2 className="text-lg font-semibold mb-3">Crear código</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Código (opcional)</label>
            <input className="w-full border rounded px-2 py-1" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Autogenerado si se deja vacío" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Max uses</label>
              <input type="number" min={1} className="w-full border rounded px-2 py-1" value={maxUses} onChange={(e)=>setMaxUses(Number(e.target.value||1))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Store ID (opcional)</label>
              <input className="w-full border rounded px-2 py-1" value={storeId} onChange={(e)=>setStoreId(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Expira (UTC)</label>
            <input type="datetime-local" className="w-full border rounded px-2 py-1" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select className="w-full border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="event">event</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button className="px-3 py-1 border rounded" onClick={onClose} aria-label="Cancelar">Cancelar</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>onCreate({ code: code || undefined, max_uses: maxUses, store_id: storeId || null, expires_at: expiresAt || null, type })} aria-label="Crear código">Crear</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCodigosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qs = useMemo(()=>parseQS(location.search),[location.search]);
  const { items, total, page, pageSize, loading, error, fetchList, setFilters, setPage, createCode, disableCode } = useAdminCodesStore();

  const [search, setSearch] = useState(qs.search || '');
  const [status, setStatus] = useState(qs.status || '');
  const [storeId, setStoreId] = useState(qs.store_id || '');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const params = {
      page: Number(qs.page || 1),
      pageSize: Number(qs.pageSize || 10),
      search: qs.search || '',
      status: qs.status || '',
      store_id: qs.store_id || ''
    };
    setFilters(params);
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const applyFilters = () => {
    const next = {
      page: 1,
      pageSize: pageSize,
      search: search || '',
      status: status || '',
      store_id: storeId || ''
    };
    navigate({ pathname: '/admin/codigos', search: toQS(next) });
  };

  const onCreate = async (payload) => {
    const ok = await createCode(payload);
    if (ok) {
      setModalOpen(false);
      fetchList();
    }
  };

  const onDisable = async (id) => {
    if (!window.confirm('¿Deshabilitar este código?')) return;
    const ok = await disableCode(id);
    if (ok) fetchList();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Códigos de evento</h1>
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>setModalOpen(true)} aria-label="Crear código">Crear código</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Buscar..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="border rounded px-2 py-1" value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">Estado (todos)</option>
          <option value="active">Activo</option>
          <option value="disabled">Deshabilitado</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Store ID" value={storeId} onChange={(e)=>setStoreId(e.target.value)} />
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={applyFilters} aria-label="Aplicar filtros">Aplicar</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Código</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Usos</th>
              <th className="text-left px-3 py-2">Expira</th>
              <th className="text-left px-3 py-2">Store</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={6}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={6}>Sin resultados</td></tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{row.code}</td>
                  <td className="px-3 py-2">{row.status}{row.is_expired ? ' (expirado)' : ''}</td>
                  <td className="px-3 py-2">{row.uses}/{row.max_uses}</td>
                  <td className="px-3 py-2">{row.expires_at || '-'}</td>
                  <td className="px-3 py-2">{row.store_id ?? '-'}</td>
                  <td className="px-3 py-2">
                    <button className="px-2 py-1 text-xs border rounded" onClick={()=>onDisable(row.id)} aria-label={`Deshabilitar código ${row.code}`}>Deshabilitar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded" disabled={page<=1} onClick={()=>{setPage(page-1); navigate({ pathname:'/admin/codigos', search: toQS({ ...qs, page: Math.max(1, page-1) })});}}>Anterior</button>
          <span className="text-sm">Página {page}</span>
          <button className="px-2 py-1 border rounded" disabled={(page*pageSize)>=total} onClick={()=>{setPage(page+1); navigate({ pathname:'/admin/codigos', search: toQS({ ...qs, page: page+1 })});}}>Siguiente</button>
        </div>
      </div>

      <CreateCodeModal open={modalOpen} onClose={()=>setModalOpen(false)} onCreate={onCreate} />
    </div>
  );
}


