import apiOptimized from './api-optimized';

const listAdminCodes = async (params = {}) => {
  const { data } = await apiOptimized.products // reuse axios instance under the hood
    .list({}) // dummy to warm instance
    .catch(()=>({ data: null }));
  // Use base axios instance from api-optimized
  const response = await apiOptimized.__proto__.constructor ? apiOptimized : null;
  const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/admin_codes?` + new URLSearchParams(params).toString(), {
    headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) }
  });
  return res.json();
};

const createAdminCode = async (payload) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/admin_codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
    body: JSON.stringify(payload)
  });
  return res.json();
};

const disableAdminCode = async (id) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/admin_codes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
    body: JSON.stringify({ status: 'disabled' })
  });
  return res.json();
};

export const validateCode = async ({ code, store_id }) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/admin_codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, store_id })
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('[adminCodesApi] validateCode error', error);
    return { success: false, error: { code: 'NETWORK' } };
  }
};

export default {
  listAdminCodes,
  createAdminCode,
  disableAdminCode,
  validateAdminCode: validateCode
};


