import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Fridges API
export const fridgesAPI = {
  getAll: () => api.get('/fridges'),
  getOne: (id: string) => api.get(`/fridges/${id}`),
  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => api.post('/fridges', data),
  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
    }
  ) => api.put(`/fridges/${id}`, data),
  delete: (id: string) => api.delete(`/fridges/${id}`),
};

// Items API
export const itemsAPI = {
  getAll: (fridgeId?: string) =>
    api.get('/items', { params: { fridgeId } }),
  getOne: (id: string) => api.get(`/items/${id}`),
  getExpiring: (days?: number) =>
    api.get('/items/expiring', { params: { days } }),
  create: (data: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expirationDate: string;
    purchaseDate?: string;
    imageUrl?: string;
    memo?: string;
    position?: { shelf: number; column: number };
    fridgeId: string;
  }) => api.post('/items', data),
  update: (
    id: string,
    data: {
      name?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      expirationDate?: string;
      purchaseDate?: string;
      imageUrl?: string;
      memo?: string;
      position?: { shelf: number; column: number };
    }
  ) => api.put(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
