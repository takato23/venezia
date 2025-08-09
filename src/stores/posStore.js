import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePosStore = create(persist((set, get) => ({
  items: [],
  code: '',
  codeInfo: null,
  subtotal: 0,
  discount: 0,
  total: 0,
  pendingQueue: [],
  selectedItemId: null,

  recalc() {
    const subtotal = get().items.reduce((s, it) => s + it.price * it.qty, 0);
    const discount = get().codeInfo?.discount_amount || 0;
    const total = Math.max(0, subtotal - discount);
    set({ subtotal, discount, total });
  },

  addItem(product, qty = 1, meta) {
    const exists = get().items.find((i) => i.product_id === product.id && JSON.stringify(i.meta) === JSON.stringify(meta));
    if (exists) {
      exists.qty += qty;
      set({ items: [...get().items], selectedItemId: exists.id });
    } else {
      const newItem = {
        id: Date.now(),
        product_id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        qty: qty,
        type: product.type || (product.category?.name === 'Helados' ? 'helado' : 'otro'),
        meta: meta || null
      };
      set({ items: [...get().items, newItem], selectedItemId: newItem.id });
    }
    get().recalc();
  },

  removeItem(id) {
    set({ items: get().items.filter((i) => i.id !== id) });
    get().recalc();
  },

  setQty(id, qty) {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)) });
    get().recalc();
  },

  setSelected(id) {
    set({ selectedItemId: id });
  },

  applyCode(code, codeInfo) {
    set({ code, codeInfo });
    // si el backend devuelve discount_amount, usarlo; si no, calcular simple
    if (!codeInfo?.discount_amount) {
      const subtotal = get().items.reduce((s, it) => s + it.price * it.qty, 0);
      const amount = codeInfo?.discount_type === 'percent'
        ? subtotal * (Number(codeInfo.discount_value || 0) / 100)
        : Number(codeInfo?.discount_value || 0);
      set({ discount: amount, subtotal, total: Math.max(0, subtotal - amount) });
    } else {
      get().recalc();
    }
  },

  removeCode() {
    set({ code: '', codeInfo: null });
    get().recalc();
  },

  resetSale() {
    set({ items: [], code: '', codeInfo: null, subtotal: 0, discount: 0, total: 0, selectedItemId: null });
  },

  enqueue(payload) {
    set({ pendingQueue: [...get().pendingQueue, { payload, ts: Date.now() }] });
  },

  dequeue() {
    const [first, ...rest] = get().pendingQueue;
    set({ pendingQueue: rest });
    return first;
  },

}), { name: 'pos-store' }));


