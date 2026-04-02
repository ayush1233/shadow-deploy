/* ────────────────────────────────────────────────────────
   Generic CSV export (used by Overview & Endpoint pages)
   ──────────────────────────────────────────────────────── */
export const exportCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
            return val;
        }).join(','))
    ].join('\n');

    triggerDownload(csvContent, filename);
};

/* ────────────────────────────────────────────────────────
   Detailed Comparison CSV — flat + readable
   ──────────────────────────────────────────────────────── */

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
    const addRow = (label: string, value: string) => {
        lines.push(`"${esc(label)}","${esc(value)}"`);
    };
    const addBlank = () => lines.push('');
    const esc = (s: string) => s.replace(/"/g, '""');

    // Header
    lines.push('"Shadow Deploy - Comparison Report"');
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    addBlank();

    // Request Summary
    lines.push('"=== REQUEST SUMMARY ==="');
    addRow('Request ID', requestId);
    addRow('Endpoint', endpoint);
    addRow('Method', method || 'GET');
    addBlank();

    // Key Metrics
    lines.push('"=== KEY METRICS ==="');
    const simPct = ((comp.similarity_score || 0) * 100).toFixed(1);
    addRow('Similarity', `${simPct}%`);
    addRow('Risk Score', Number(comp.risk_score || 0).toFixed(1));
    addRow('Severity', comp.severity || 'unknown');
    addRow('Status Match', comp.status_match ? 'YES' : 'NO');
    addRow('Body Match', comp.body_match ? 'YES' : 'NO');
    addRow('Latency Delta', `${comp.latency_delta_ms || 0}ms`);
    addRow('Prod Status Code', String(production.status_code ?? 'N/A'));
    addRow('Shadow Status Code', String(shadow.status_code ?? 'N/A'));
    addRow('Prod Response Time', `${production.response_time_ms ?? 'N/A'}ms`);
    addRow('Shadow Response Time', `${shadow.response_time_ms ?? 'N/A'}ms`);
    addBlank();

    // Recommendation
    lines.push('"=== RECOMMENDATION ==="');
    addRow('Recommended Action', comp.recommended_action?.replace(/_/g, ' ') || 'NONE');
    addRow('AI Compared', comp.ai_compared ? 'Yes' : 'No');
    if (comp.explanation?.confidence) {
        addRow('Confidence', `${(comp.explanation.confidence * 100).toFixed(0)}%`);
    }
    addBlank();

    // AI Analysis
    if (comp.explanation) {
        lines.push('"=== AI ANALYSIS ==="');
        if (comp.explanation.impact) addRow('Impact', comp.explanation.impact);
        if (comp.explanation.summary) addRow('Summary', comp.explanation.summary);
        if (comp.explanation.details) addRow('Details', comp.explanation.details);
        addBlank();
    }

    // Field Differences
    if (comp.field_diffs && comp.field_diffs.length > 0) {
        lines.push('"=== FIELD DIFFERENCES ==="');
        lines.push('"Path","Type","Production Value","Shadow Value"');
        for (const diff of comp.field_diffs) {
            lines.push([
                `"${esc(diff.path || 'unknown')}"`,
                `"${esc(diff.diff_type || '')}"`,
                `"${esc(String(diff.prod_value ?? '(none)'))}"`,
                `"${esc(String(diff.shadow_value ?? '(none)'))}"`,
            ].join(','));
        }
        addBlank();
    }

    // Response Bodies
    lines.push('"=== PRODUCTION RESPONSE BODY ==="');
    lines.push(`"${esc(prodBody || '(empty)')}"`);
    addBlank();
    lines.push('"=== SHADOW RESPONSE BODY ==="');
    lines.push(`"${esc(shadowBody || '(empty)')}"`);

    triggerDownload(lines.join('\n'), filename);
};

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
