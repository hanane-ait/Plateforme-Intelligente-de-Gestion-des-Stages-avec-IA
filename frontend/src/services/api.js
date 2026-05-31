import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/';

const API = axios.create({
    baseURL: API_BASE,
});

export function clearStoredAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
}

function redirectToLogin() {
    clearStoredAuth();
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
    }
}

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

let refreshPromise = null;

async function refreshAccessToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
        throw new Error('No refresh token');
    }
    const { data } = await axios.post(`${API_BASE}auth/login/refresh/`, { refresh });
    localStorage.setItem('access_token', data.access);
    return data.access;
}

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (
            status !== 401
            || !originalRequest
            || originalRequest._retry
            || originalRequest.url?.includes('auth/login/')
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
            }
            const newToken = await refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return API(originalRequest);
        } catch {
            redirectToLogin();
            return Promise.reject(error);
        }
    }
);

export default API;
