const API_BASE = '/api/v1';

export const getAuthToken = () => localStorage.getItem('uneg_token');
export const setAuthToken = (token) => localStorage.setItem('uneg_token', token);
export const removeAuthToken = () => localStorage.removeItem('uneg_token');

export const getUserInfo = () => {
  const user = localStorage.getItem('uneg_user');
  return user ? JSON.parse(user) : null;
};
export const setUserInfo = (user) => localStorage.setItem('uneg_user', JSON.stringify(user));
export const removeUserInfo = () => localStorage.removeItem('uneg_user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    removeUserInfo();
    window.location.href = '#login';
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (cedula, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula, password }),
    });
  },
  getMe: async () => request('/auth/me'),

  // Bienes
  getBienes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bienes${query ? `?${query}` : ''}`);
  },
  createBien: async (data) => {
    return request('/bienes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  uploadDocumentoSoporte: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/bienes/documento-soporte', {
      method: 'POST',
      body: formData,
    });
  },
  updateBien: async (id, data) => {
    return request(`/bienes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  getAuditoria: async (responsableId) => {
    const query = responsableId ? `?responsable_id=${responsableId}` : '';
    return request(`/bienes/auditoria/reporte-por-responsable${query}`);
  },

  // Ubicaciones
  getUbicaciones: async () => request('/ubicaciones'),
  createUbicacion: async (data) => {
    return request('/ubicaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Usuarios
  getUsuarios: async (rol) => {
    const query = rol ? `?rol=${encodeURIComponent(rol)}` : '';
    return request(`/usuarios${query}`);
  },

  // Trámites
  getTramites: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tramites${query ? `?${query}` : ''}`);
  },
  createTramite: async (data) => {
    return request('/tramites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  uploadEvidencia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/tramites/evidencia', {
      method: 'POST',
      body: formData,
    });
  },
  decidirTramite: async (tramiteId, accion, observaciones = '') => {
    return request(`/tramites/${tramiteId}/decidir`, {
      method: 'POST',
      body: JSON.stringify({ accion, observaciones }),
    });
  },
};

