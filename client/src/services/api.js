const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Universal API Client with automatic JWT injection
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('campussync_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
};

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/events${queryString}`);
  },
  getEventById: (id) => request(`/events/${id}`),
  createEvent: (eventData) => request('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, updateData) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(updateData) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Registrations
  registerForEvent: (id) => request(`/events/${id}/register`, { method: 'POST' }),
  cancelRegistration: (id) => request(`/events/${id}/register`, { method: 'DELETE' }),

  // Stats
  getStats: () => request('/events/stats/overview')
};

