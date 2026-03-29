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

// ── Metrics ──
export const getMetricsSummary = async () => {
    // Fetch all comparisons and compute client-side (same logic as before, but from API)
    const { data: result } = await api.get('/comparisons', { params: { limit: 1000 } });
    const all = result.data || [];
    const total = all.length;

    // Count mismatches (use deterministic_pass if available, else body_match)
    const mismatches = all.filter((c: any) => c.deterministic_pass === false || c.body_match === false).length;
    const mismatchRate = total > 0 ? ((mismatches / total) * 100).toFixed(1) : '0.0';

    // Severity breakdown
    const severity: Record<string, number> = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };
    all.forEach((c: any) => {
        const sev = (c.severity || 'none').toLowerCase();
        if (sev in severity) severity[sev]++;
    });

    // Top endpoints
    const endpointMap: Record<string, { requests: number; mismatches: number; avg_prod_latency: number; avg_shadow_latency: number; _prodSum: number; _shadowSum: number }> = {};
    all.forEach((c: any) => {
        const ep = c.endpoint || 'unknown';
        if (!endpointMap[ep]) endpointMap[ep] = { requests: 0, mismatches: 0, avg_prod_latency: 0, avg_shadow_latency: 0, _prodSum: 0, _shadowSum: 0 };
        endpointMap[ep].requests++;
        endpointMap[ep]._prodSum += c.prod_response_time_ms || 0;
        endpointMap[ep]._shadowSum += c.shadow_response_time_ms || 0;
        if (c.deterministic_pass === false || c.body_match === false) endpointMap[ep].mismatches++;
    });
    Object.values(endpointMap).forEach(ep => {
        ep.avg_prod_latency = ep.requests > 0 ? ep._prodSum / ep.requests : 0;
        ep.avg_shadow_latency = ep.requests > 0 ? ep._shadowSum / ep.requests : 0;
    });

    // Latency
    const deltas = all.map((c: any) => c.latency_delta_ms || 0).sort((a: number, b: number) => a - b);
    const p50 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.5)] : 0;
    const p95 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.95)] : 0;
    const p99 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.99)] : 0;

    const avgRisk = total > 0 ? all.reduce((sum: number, c: any) => sum + Number(c.risk_score || 0), 0) / total : 0;

    return {
        data: {
            overview: {
                total_requests: total,
                total_comparisons: total,
                total_mismatches: mismatches,
                mismatch_rate_percent: mismatchRate,
                deployment_risk_score: Math.min(avgRisk, 10),
            },
            severity_breakdown: severity,
            top_endpoints: endpointMap,
            latency: {
                p50_delta_ms: p50,
                p95_delta_ms: p95,
                p99_delta_ms: p99,
            },
        },
    };
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
    const { data: result } = await api.get('/comparisons', { params: { limit: 1000 } });
    const all = result.data || [];

    const grouped: Record<string, { count: number; riskSum: number; passes: number }> = {};
    all.forEach((row: any) => {
        const ts = row.timestamp || row.created_at;
        if (!ts) return;
        const date = ts.substring(0, 10);
        if (!grouped[date]) grouped[date] = { count: 0, riskSum: 0, passes: 0 };
        grouped[date].count++;
        grouped[date].riskSum += Number(row.risk_score || 0);
        if (row.deterministic_pass) grouped[date].passes++;
    });

    return Object.entries(grouped).map(([date, stats]) => ({
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
