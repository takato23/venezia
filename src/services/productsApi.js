// Servicio de productos para POS (lista con búsqueda/paginación)
export async function listProducts({ search = '', page = 1, pageSize = 50 } = {}) {
  const baseUrl = import.meta?.env?.VITE_API_URL || '/api';
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));

  try {
    const res = await fetch(`${baseUrl}/products?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      console.error('[productsApi] listProducts error', json);
      return { success: false, data: [], error: json?.error || { code: 'REQUEST_FAILED' } };
    }
    const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : json?.products || []);
    return { success: true, data };
  } catch (error) {
    console.error('[productsApi] listProducts network error', error);
    return { success: false, data: [], error: { code: 'NETWORK', message: 'Error de red' } };
  }
}


