import axios from 'axios';

// 1. Create a centralized Axios instance
// We point this to your API Gateway (Port 8080)
const api = axios.create({
  baseURL: 'http://localhost:8080', // This routes to your FastAPI Gateway
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor
// Before any request is sent, this function runs.
// It checks if we have a token and adds it to the headers.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Optional but recommended)
// If the backend says "401 Unauthorized" (token expired),
// we wipe the storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;