import axios from 'axios';

// ── Axios instance with JWT token injection ──
const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('shadow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('shadow_token');
            localStorage.removeItem('shadow_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──
export const login = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('shadow_token', data.token);
    localStorage.setItem('shadow_user', JSON.stringify({
        username: data.username,
        role: data.role,
        tenant_id: data.tenant_id,
    }));
    return { data };
};

export const signUp = async (_email: string, _password: string) => {
    throw new Error('Sign up is not available. Use the admin credentials to login.');
};

export const signOut = async () => {
    localStorage.removeItem('shadow_token');
    localStorage.removeItem('shadow_user');
};

export const getSession = async () => {
    const token = localStorage.getItem('shadow_token');
    const user = localStorage.getItem('shadow_user');
    if (token && user) {
        return { access_token: token, user: JSON.parse(user) };
    }
    return null;
};

// ── Topology ──
export const getTopology = async () => {
    const { data } = await api.get('/topology');
    return data;
};

// ── Metrics ──
export const getMetricsSummary = async (days: number = 7) => {
    // Call the dedicated server-side metrics aggregation endpoint
    const { data } = await api.get('/metrics/summary', { params: { timeRange: `${days}d` } });
    
    // Transform formatting slightly to match what UI originally computed
    if (data.top_endpoints) {
        const topEndpointObj: Record<string, any> = {};
        data.top_endpoints.forEach((ep: any) => {
            topEndpointObj[ep.endpoint] = {
                requests: ep.total,
                mismatches: ep.mismatches,
            };
        });
        data.top_endpoints = topEndpointObj;
    }
    
    return { data };
};

// ── Comparisons ──
export const listComparisons = async (params: {
    page?: number;
    size?: number;
    endpoint?: string;
    severity?: string;
    timeRange?: string;
}) => {
    const { data } = await api.get('/comparisons', {
        params: {
            page: params.page || 0,
            size: params.size || 20,
            endpoint: params.endpoint || undefined,
            severity: params.severity && params.severity !== 'all' ? params.severity : undefined,
            timeRange: params.timeRange || undefined,
        },
    });
    return { data };
};

export const getComparison = async (requestId: string) => {
    const { data } = await api.get(`/comparisons/${requestId}`);
    // The API service already returns the structured format
    return { data };
};

// ── AI Configurator ──
export const configureProxy = (instruction: string) =>
    axios.post('/ai-api/configure-proxy', { instruction });

export const runWebsiteTest = (data: { production_url: string; shadow_url: string; paths: string[] }) =>
    axios.post('/ai-api/website-test', data);

export const getNotificationConfig = () =>
    axios.get('/ai-api/notifications/config');

export const configureNotifications = (data: any) =>
    axios.post('/ai-api/notifications/configure', data);

// ── Historical Trend ──
export const getRiskTrend = async (days: number = 7) => {
    // Fetch comparisons and group by day client-side
    const { data: result } = await api.get('/comparisons', { params: { size: 1000 } });
    const all = result.data || [];

    // Compute cutoff date based on the requested range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    const grouped: Record<string, { count: number; riskSum: number; passes: number }> = {};
    all.forEach((row: any) => {
        const ts = row.timestamp || row.created_at;
        if (!ts) return;
        // Skip entries older than the requested range
        if (ts < cutoffISO) return;
        const date = ts.substring(0, 10);
        if (!grouped[date]) grouped[date] = { count: 0, riskSum: 0, passes: 0 };
        grouped[date].count++;
        grouped[date].riskSum += Number(row.risk_score || 0);
        if (row.deterministic_pass) grouped[date].passes++;
    });

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
            date,
            avg_risk: (stats.riskSum / stats.count).toFixed(2),
            count: stats.count,
            pass_rate: ((stats.passes / stats.count) * 100).toFixed(1),
        }));
};

// ── Endpoint Tags (stored in localStorage since we don't have Supabase) ──
export const getEndpointTags = async () => {
    const stored = localStorage.getItem('shadow_endpoint_tags');
    return stored ? JSON.parse(stored) : [];
};

export const createEndpointTag = async (pattern: string, tag: string, color: string) => {
    const tags = await getEndpointTags();
    const newTag = { id: crypto.randomUUID(), endpoint_pattern: pattern, tag, color };
    tags.push(newTag);
    localStorage.setItem('shadow_endpoint_tags', JSON.stringify(tags));
    return newTag;
};

export const deleteEndpointTag = async (id: string) => {
    const tags = await getEndpointTags();
    const filtered = tags.filter((t: any) => t.id !== id);
    localStorage.setItem('shadow_endpoint_tags', JSON.stringify(filtered));
};
