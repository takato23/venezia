import { create } from 'zustand';
import adminCodesApi from '../services/adminCodesApi';

export const useAdminCodesStore = create((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  filters: { search: '', status: '', store_id: '' },
  loading: false,
  error: null,

  setFilters: (filters) => set({ filters, page: Number(filters.page || 1), pageSize: Number(filters.pageSize || 10) }),
  setPage: (page) => set({ page }),

  fetchList: async () => {
    try {
      set({ loading: true, error: null });
      const { page, pageSize, filters } = get();
      const res = await adminCodesApi.listAdminCodes({ page, pageSize, ...filters });
      if (!res.success) throw new Error(res.error?.msg || 'Error al listar');
      const { items, total } = res.data;
      set({ items, total, loading: false });
    } catch (e) {
      set({ loading: false, error: e.message });
    }
  },

  createCode: async (payload) => {
    try {
      set({ error: null });
      const res = await adminCodesApi.createAdminCode(payload);
      if (!res.success) throw new Error(res.error?.msg || 'No se pudo crear');
      return true;
    } catch (e) {
      set({ error: e.message });
      return false;
    }
  },

  disableCode: async (id) => {
    try {
      const res = await adminCodesApi.disableAdminCode(id);
      if (!res.success) throw new Error(res.error?.msg || 'No se pudo deshabilitar');
      return true;
    } catch (e) {
      set({ error: e.message });
      return false;
    }
  }
}));


