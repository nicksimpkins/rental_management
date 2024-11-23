import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005',  // Remove /api, just use the base URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password }); // Debug log
      const response = await api.post('/auth/login', { email, password }); // Remove /api/
      console.log('Login response:', response.data); // Debug log
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', response.data.user.userType);
        localStorage.setItem('userId', response.data.user.id);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error); // Debug log
      throw error.response?.data || error;
    }
  }
};

export default api;