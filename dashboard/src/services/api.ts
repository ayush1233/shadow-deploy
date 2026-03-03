import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Intercept and add JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('shadow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('shadow_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ──
export const login = (username: string, password: string) =>
    api.post('/auth/login', { username, password });

// ── Metrics ──
export const getMetricsSummary = (timeRange = '1h') =>
    api.get(`/metrics/summary?timeRange=${timeRange}`);

// ── Deployments ──
export const getDeploymentReport = (id: string) =>
    api.get(`/deployments/${id}/report`);

export const approveDeployment = (id: string) =>
    api.post(`/deployments/${id}/approve`);

export const rejectDeployment = (id: string, reason: string) =>
    api.post(`/deployments/${id}/reject`, { reason });

// ── Comparisons ──
export const getComparison = (requestId: string) =>
    api.get(`/comparisons/${requestId}`);

export const listComparisons = (params: {
    page?: number;
    size?: number;
    endpoint?: string;
    severity?: string;
    from?: string;
    to?: string;
}) => api.get('/comparisons', { params });

// ── AI Configurator ──
export const configureProxy = (instruction: string) =>
    axios.post('/ai-api/configure-proxy', { instruction });

export default api;
