import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_STORAGE_KEY = 'volunteer-hub-auth';

export const getStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || null;
  } catch (_error) {
    return null;
  }
};

export const setStoredAuth = auth => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use(config => {
  const auth = getStoredAuth();
  if (auth?.tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const auth = getStoredAuth();

    if (error.response?.status === 401 && auth?.tokens?.refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: auth.tokens.refreshToken,
        });
        setStoredAuth(data);
        originalRequest.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredAuth();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.details?.length) {
    return (
      error.response.data.message +
      ': ' +
      error.response.data.details.map(d => `${d.path || d.param} is invalid`).join(', ')
    );
  }
  return error.response?.data?.message || error.message || defaultMessage;
};
