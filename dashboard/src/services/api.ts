import { supabase } from './supabase';

// ── Auth ──
export const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return { data: { token: data.session?.access_token, user: data.user } };
};

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    await supabase.auth.signOut();
};

export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// ── Metrics (computed from comparisons table) ──
export const getMetricsSummary = async () => {
    const { data: comparisons, error } = await supabase
        .from('comparisons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    const all = comparisons || [];
    const total = all.length;
    const mismatches = all.filter(c => !c.body_match).length;
    const mismatchRate = total > 0 ? ((mismatches / total) * 100).toFixed(1) : '0.0';

    // Severity breakdown
    const severity = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };
    all.forEach(c => { severity[c.severity as keyof typeof severity] = (severity[c.severity as keyof typeof severity] || 0) + 1; });

    // Top endpoints by mismatch count + latency
    const endpointMap: Record<string, { requests: number; mismatches: number; avg_prod_latency: number; avg_shadow_latency: number; _prodSum: number; _shadowSum: number }> = {};
    all.forEach(c => {
        if (!endpointMap[c.endpoint]) endpointMap[c.endpoint] = { requests: 0, mismatches: 0, avg_prod_latency: 0, avg_shadow_latency: 0, _prodSum: 0, _shadowSum: 0 };
        endpointMap[c.endpoint].requests++;
        endpointMap[c.endpoint]._prodSum += c.prod_response_time_ms || 0;
        endpointMap[c.endpoint]._shadowSum += c.shadow_response_time_ms || 0;
        if (!c.body_match) endpointMap[c.endpoint].mismatches++;
    });
    // Compute averages
    Object.values(endpointMap).forEach(ep => {
        ep.avg_prod_latency = ep.requests > 0 ? ep._prodSum / ep.requests : 0;
        ep.avg_shadow_latency = ep.requests > 0 ? ep._shadowSum / ep.requests : 0;
    });

    // Latency metrics
    const deltas = all.map(c => c.latency_delta_ms).sort((a, b) => a - b);
    const p50 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.5)] : 0;
    const p95 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.95)] : 0;
    const p99 = deltas.length > 0 ? deltas[Math.floor(deltas.length * 0.99)] : 0;

    // Risk score: average of all risk scores
    const avgRisk = total > 0 ? all.reduce((sum, c) => sum + Number(c.risk_score), 0) / total : 0;

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
}) => {
    let query = supabase
        .from('comparisons')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (params.endpoint) {
        query = query.ilike('endpoint', `%${params.endpoint}%`);
    }
    if (params.severity && params.severity !== 'all') {
        query = query.eq('severity', params.severity);
    }

    const size = params.size || 20;
    const page = params.page || 0;
    query = query.range(page * size, (page + 1) * size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        data: {
            data: data || [],
            page,
            size,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / size),
        },
    };
};

export const getComparison = async (requestId: string) => {
    const { data, error } = await supabase
        .from('comparisons')
        .select('*')
        .eq('request_id', requestId)
        .single();

    if (error) throw error;

    // Transform to match the expected format from the old API
    return {
        data: {
            request_id: data.request_id,
            tenant_id: data.tenant_id,
            timestamp: data.created_at,
            endpoint: data.endpoint,
            method: data.method,
            production: {
                status_code: data.prod_status_code,
                response_time_ms: data.prod_response_time_ms,
                body: typeof data.prod_body === 'string' ? data.prod_body : JSON.stringify(data.prod_body, null, 2),
            },
            shadow: {
                status_code: data.shadow_status_code,
                response_time_ms: data.shadow_response_time_ms,
                body: typeof data.shadow_body === 'string' ? data.shadow_body : JSON.stringify(data.shadow_body, null, 2),
            },
            comparison: {
                status_match: data.status_match,
                body_match: data.body_match,
                structure_match: data.structure_match,
                latency_delta_ms: data.latency_delta_ms,
                similarity_score: Number(data.similarity_score),
                risk_score: Number(data.risk_score),
                severity: data.severity,
                deterministic_pass: data.deterministic_pass,
                ai_compared: data.ai_compared,
                ai_explanation: data.ai_explanation,
                recommended_action: data.recommended_action,
                field_diffs: data.field_diffs || [],
            },
        },
    };
};

// ── AI Configurator (still goes through the local proxy) ──
import axios from 'axios';
export const configureProxy = (instruction: string) =>
    axios.post('/ai-api/configure-proxy', { instruction });
