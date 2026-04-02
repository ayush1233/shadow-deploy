/* ════════════════════════════════════════════════════════
   Shared helpers
   ════════════════════════════════════════════════════════ */

const esc = (s: string) => s.replace(/"/g, '""');

function triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ════════════════════════════════════════════════════════
   1. Generic CSV (legacy fallback)
   ════════════════════════════════════════════════════════ */

export const exportCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return `"${esc(JSON.stringify(val))}"`;
            if (typeof val === 'string') return `"${esc(val)}"`;
            return val;
        }).join(','))
    ].join('\n');
    triggerDownload(csvContent, filename);
};

/* ════════════════════════════════════════════════════════
   2. Comparison Detail CSV
   ════════════════════════════════════════════════════════ */

interface ComparisonCsvData {
    requestId: string;
    endpoint: string;
    method: string;
    comparison: any;
    production: any;
    shadow: any;
    prodBody: string;
    shadowBody: string;
}

export const exportComparisonCsv = (data: ComparisonCsvData, filename: string) => {
    const { requestId, endpoint, method, comparison: comp, production, shadow, prodBody, shadowBody } = data;
    const lines: string[] = [];
    const row = (l: string, v: string) => lines.push(`"${esc(l)}","${esc(v)}"`);
    const blank = () => lines.push('');

    lines.push('"Shadow Deploy - Comparison Report"');
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    blank();

    lines.push('"=== REQUEST SUMMARY ==="');
    row('Request ID', requestId);
    row('Endpoint', endpoint);
    row('Method', method || 'GET');
    blank();

    lines.push('"=== KEY METRICS ==="');
    row('Similarity', `${((comp.similarity_score || 0) * 100).toFixed(1)}%`);
    row('Risk Score', Number(comp.risk_score || 0).toFixed(1));
    row('Severity', comp.severity || 'unknown');
    row('Status Match', comp.status_match ? 'YES' : 'NO');
    row('Body Match', comp.body_match ? 'YES' : 'NO');
    row('Latency Delta', `${comp.latency_delta_ms || 0}ms`);
    row('Prod Status Code', String(production.status_code ?? 'N/A'));
    row('Shadow Status Code', String(shadow.status_code ?? 'N/A'));
    row('Prod Response Time', `${production.response_time_ms ?? 'N/A'}ms`);
    row('Shadow Response Time', `${shadow.response_time_ms ?? 'N/A'}ms`);
    blank();

    lines.push('"=== RECOMMENDATION ==="');
    row('Recommended Action', comp.recommended_action?.replace(/_/g, ' ') || 'NONE');
    row('AI Compared', comp.ai_compared ? 'Yes' : 'No');
    if (comp.explanation?.confidence) row('Confidence', `${(comp.explanation.confidence * 100).toFixed(0)}%`);
    blank();

    if (comp.explanation) {
        lines.push('"=== AI ANALYSIS ==="');
        if (comp.explanation.impact) row('Impact', comp.explanation.impact);
        if (comp.explanation.summary) row('Summary', comp.explanation.summary);
        if (comp.explanation.details) row('Details', comp.explanation.details);
        blank();
    }

    if (comp.field_diffs && comp.field_diffs.length > 0) {
        lines.push('"=== FIELD DIFFERENCES ==="');
        lines.push('"Path","Type","Production Value","Shadow Value"');
        for (const d of comp.field_diffs) {
            lines.push([`"${esc(d.path || 'unknown')}"`, `"${esc(d.diff_type || '')}"`, `"${esc(String(d.prod_value ?? '(none)'))}"`, `"${esc(String(d.shadow_value ?? '(none)'))}"` ].join(','));
        }
        blank();
    }

    lines.push('"=== PRODUCTION RESPONSE BODY ==="');
    lines.push(`"${esc(prodBody || '(empty)')}"`);
    blank();
    lines.push('"=== SHADOW RESPONSE BODY ==="');
    lines.push(`"${esc(shadowBody || '(empty)')}"`);

    triggerDownload(lines.join('\n'), filename);
};

/* ════════════════════════════════════════════════════════
   3. Dashboard Overview CSV
   ════════════════════════════════════════════════════════ */

interface OverviewCsvData {
    metrics: any;
    trendData: any[];
    recentComparisons: any[];
    trendRange: number;
}

export const exportOverviewCsv = (data: OverviewCsvData, filename: string) => {
    const { metrics, trendData, recentComparisons, trendRange } = data;
    const lines: string[] = [];
    const row = (l: string, v: string) => lines.push(`"${esc(l)}","${esc(v)}"`);
    const blank = () => lines.push('');
    const ov = metrics.overview;
    const lat = metrics.latency;
    const sev = metrics.severity_breakdown;

    lines.push('"Shadow Deploy - Dashboard Overview Report"');
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    lines.push(`"Period","Last ${trendRange} days"`);
    blank();

    lines.push('"=== KEY PERFORMANCE INDICATORS ==="');
    row('Total Requests', String(ov.total_requests));
    row('Total Mismatches', String(ov.total_mismatches));
    row('Mismatch Rate', `${Number(ov.mismatch_rate_percent).toFixed(1)}%`);
    row('Deployment Risk Score', `${Number(ov.deployment_risk_score).toFixed(1)} / 10`);
    const rs = ov.deployment_risk_score;
    row('Verdict', rs <= 3 ? 'Safe to Deploy' : rs <= 6 ? 'Review Recommended' : 'High Risk - Do Not Deploy');
    row('P50 Latency Delta', `${lat.p50_delta_ms}ms`);
    row('P95 Latency Delta', `${lat.p95_delta_ms}ms`);
    row('P99 Latency Delta', `${lat.p99_delta_ms}ms`);
    blank();

    lines.push('"=== SEVERITY BREAKDOWN ==="');
    row('Low', String(sev.low));
    row('Medium', String(sev.medium));
    row('High', String(sev.high));
    row('Critical', String(sev.critical));
    blank();

    if (metrics.top_endpoints && Object.keys(metrics.top_endpoints).length > 0) {
        lines.push('"=== LATENCY BY ENDPOINT ==="');
        lines.push('"Endpoint","Prod (ms)","Shadow (ms)","Delta (ms)"');
        for (const [ep, d] of Object.entries(metrics.top_endpoints) as any[]) {
            const prod = Math.round(d.avg_prod_latency || 0);
            const shadow = Math.round(d.avg_shadow_latency || 0);
            lines.push(`"${esc(ep)}","${prod}","${shadow}","${shadow - prod}"`);
        }
        blank();
    }

    if (trendData.length > 0) {
        lines.push('"=== RISK TREND ==="');
        lines.push('"Date","Risk Score","Pass Rate","Total","Mismatches"');
        for (const t of trendData) {
            lines.push([
                `"${esc(t.date || t.bucket || '')}"`,
                `"${typeof t.risk_score === 'number' ? t.risk_score.toFixed(1) : ''}"`,
                `"${typeof t.pass_rate === 'number' ? t.pass_rate.toFixed(1) + '%' : ''}"`,
                `"${t.total ?? t.total_requests ?? ''}"`,
                `"${t.mismatches ?? t.total_mismatches ?? ''}"`,
            ].join(','));
        }
        blank();
    }

    if (recentComparisons.length > 0) {
        lines.push('"=== RECENT COMPARISONS ==="');
        lines.push('"Endpoint","Method","Status Match","Severity","Risk Score","Timestamp"');
        for (const c of recentComparisons) {
            lines.push([
                `"${esc(c.endpoint || '')}"`,
                `"${c.method || 'GET'}"`,
                `"${c.status_match !== false ? 'Match' : 'Mismatch'}"`,
                `"${c.severity || 'none'}"`,
                `"${typeof c.risk_score === 'number' ? c.risk_score.toFixed(1) : ''}"`,
                `"${(c.timestamp || c.created_at) ? new Date(c.timestamp || c.created_at).toLocaleString() : 'N/A'}"`,
            ].join(','));
        }
    }

    triggerDownload(lines.join('\n'), filename);
};

/* ════════════════════════════════════════════════════════
   4. Endpoint Analysis CSV
   ════════════════════════════════════════════════════════ */

interface EndpointCsvData {
    comparisons: any[];
    filters: { endpoint: string; severity: string; timeRange: string };
    totalResults: number;
}

export const exportEndpointAnalysisCsv = (data: EndpointCsvData, filename: string) => {
    const { comparisons, filters, totalResults } = data;
    if (!comparisons || comparisons.length === 0) return;

    const lines: string[] = [];
    const row = (l: string, v: string) => lines.push(`"${esc(l)}","${esc(v)}"`);
    const blank = () => lines.push('');

    lines.push('"Shadow Deploy - Endpoint Analysis Report"');
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    blank();

    lines.push('"=== FILTERS ==="');
    row('Endpoint', filters.endpoint || '(all)');
    row('Severity', filters.severity === 'all' ? '(all)' : filters.severity);
    row('Time Range', filters.timeRange);
    row('Total Results', String(totalResults));
    row('Exported Results', String(comparisons.length));
    blank();

    // Summary stats
    lines.push('"=== SUMMARY ==="');
    const mismatches = comparisons.filter(c => c.body_match === false || c.status_match === false).length;
    const avgRisk = comparisons.reduce((s, c) => s + (c.risk_score || 0), 0) / comparisons.length;
    const avgLat = comparisons.reduce((s, c) => s + (c.latency_delta_ms || 0), 0) / comparisons.length;
    row('Mismatches', String(mismatches));
    row('Mismatch Rate', `${((mismatches / comparisons.length) * 100).toFixed(1)}%`);
    row('Avg Risk Score', avgRisk.toFixed(1));
    row('Avg Latency Delta', `${avgLat.toFixed(0)}ms`);
    blank();

    // Full table
    lines.push('"=== COMPARISON RESULTS ==="');
    lines.push('"#","Endpoint","Method","Status Match","Body Match","Severity","Risk Score","Similarity","Latency Delta","Timestamp"');
    comparisons.forEach((item, idx) => {
        const sim = item.similarity_score !== undefined ? (item.similarity_score * 100).toFixed(0) + '%' : 'N/A';
        const ts = (item.timestamp || item.created_at) ? new Date(item.timestamp || item.created_at).toLocaleString() : 'N/A';
        lines.push([
            `"${idx + 1}"`,
            `"${esc(item.endpoint || '')}"`,
            `"${item.method || 'GET'}"`,
            `"${item.status_match !== false ? 'Yes' : 'No'}"`,
            `"${item.body_match !== false ? 'Yes' : 'No'}"`,
            `"${(item.severity || 'none').toUpperCase()}"`,
            `"${Number(item.risk_score || 0).toFixed(1)}"`,
            `"${sim}"`,
            `"+${item.latency_delta_ms || 0}ms"`,
            `"${ts}"`,
        ].join(','));
    });

    triggerDownload(lines.join('\n'), filename);
};
