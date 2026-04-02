import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ════════════════════════════════════════════════════════
   Shared constants & helpers
   ════════════════════════════════════════════════════════ */

const COLORS = {
    brand:     [99, 102, 241] as [number, number, number],
    dark:      [30, 41, 59]   as [number, number, number],
    green:     [34, 197, 94]  as [number, number, number],
    red:       [239, 68, 68]  as [number, number, number],
    amber:     [245, 158, 11] as [number, number, number],
    orange:    [251, 146, 60] as [number, number, number],
    muted:     [120, 120, 130] as [number, number, number],
    bg:        [15, 15, 20]   as [number, number, number],
    cardBg:    [24, 24, 32]   as [number, number, number],
    white:     [255, 255, 255] as [number, number, number],
    lightGray: [200, 200, 210] as [number, number, number],
};

function initPage(doc: jsPDF) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, pw, ph, 'F');
}

function addHeader(doc: jsPDF, title: string, subtitle: string, rightText?: string) {
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pw, 38, 'F');
    doc.setFillColor(...COLORS.brand);
    doc.rect(0, 38, pw, 1.5, 'F');

    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text(title, 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.lightGray);
    doc.text(subtitle, 14, 24);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
    if (rightText) doc.text(rightText, pw - 14, 33, { align: 'right' });
}

function addFooters(doc: jsPDF, reportName: string) {
    const pageCount = doc.getNumberOfPages();
    const pw = doc.internal.pageSize.getWidth();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        if (i > 1) initPage(doc);
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, ph - 12, pw, 12, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text(`Shadow Deploy - ${reportName}`, 14, ph - 4.5);
        doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 4.5, { align: 'right' });
    }
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
    if (y > 260) { doc.addPage(); initPage(doc); y = 20; }
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.white);
    doc.text(title, 14, y);
    y += 2;
    doc.setDrawColor(...COLORS.brand);
    doc.setLineWidth(0.8);
    doc.line(14, y, 80, y);
    return y + 8;
}

function addKeyValue(doc: jsPDF, y: number, label: string, value: string, valueColor?: [number, number, number]): number {
    if (y > 275) { doc.addPage(); initPage(doc); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, 16, y);
    doc.setFontSize(10);
    doc.setTextColor(...(valueColor || COLORS.white));
    doc.text(value, 65, y);
    return y + 6;
}

function addWrappedText(doc: jsPDF, y: number, text: string, maxWidth: number = 178): number {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.lightGray);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
        if (y > 278) { doc.addPage(); initPage(doc); y = 20; }
        doc.text(line, 16, y);
        y += 4.5;
    }
    return y;
}

function addCodeBlock(doc: jsPDF, y: number, code: string, label: string, maxLines: number = 50): number {
    if (y > 240) { doc.addPage(); initPage(doc); y = 20; }

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, 16, y);
    y += 6;

    const allLines = code.split('\n');
    const lines = allLines.slice(0, maxLines);
    const lineHeight = 3.8;
    const blockHeight = Math.min(lines.length * lineHeight + 8, 200);

    if (y + blockHeight > 278) { doc.addPage(); initPage(doc); y = 20; }

    doc.setFillColor(10, 10, 14);
    doc.setDrawColor(50, 50, 60);
    doc.roundedRect(14, y - 2, 182, blockHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.lightGray);
    let lineY = y + 4;
    for (const line of lines) {
        if (lineY > 278) { doc.addPage(); initPage(doc); lineY = 20; }
        const truncated = line.length > 120 ? line.substring(0, 117) + '...' : line;
        doc.text(truncated, 17, lineY);
        lineY += lineHeight;
    }

    if (lines.length < allLines.length) {
        doc.setTextColor(...COLORS.muted);
        doc.text(`... (${allLines.length - maxLines} more lines)`, 17, lineY);
        lineY += lineHeight;
    }

    return lineY + 6;
}

function statusColor(val: string): [number, number, number] {
    const v = val.toLowerCase();
    if (['pass', 'low', 'ok', 'yes', 'safe', 'match'].some(k => v.includes(k))) return COLORS.green;
    if (['fail', 'high', 'no', 'block', 'critical', 'mismatch'].some(k => v.includes(k))) return COLORS.red;
    if (['warning', 'medium', 'review'].some(k => v.includes(k))) return COLORS.amber;
    return COLORS.lightGray;
}

function severityColor(severity: string): [number, number, number] {
    switch (severity?.toLowerCase()) {
        case 'critical': return COLORS.red;
        case 'high': return COLORS.orange;
        case 'medium': return COLORS.amber;
        case 'low': return COLORS.green;
        default: return COLORS.muted;
    }
}

/** Standard table styling */
const tableStyles = {
    theme: 'grid' as const,
    styles: { fontSize: 8, cellPadding: 3.5, textColor: COLORS.lightGray, lineColor: [50, 50, 60] as [number, number, number], lineWidth: 0.3 },
    headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' as const },
    bodyStyles: { fillColor: COLORS.cardBg },
    margin: { left: 14, right: 14 },
};

/* ════════════════════════════════════════════════════════
   1. Generic table PDF (legacy fallback)
   ════════════════════════════════════════════════════════ */

export const exportPdf = (data: any[], title: string, filename: string) => {
    if (!data || data.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(title, 14, 15);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
    }));
    autoTable(doc, { head: [headers], body: rows, startY: 30, styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [30, 41, 59] } });
    doc.save(filename);
};

/* ════════════════════════════════════════════════════════
   2. Comparison Detail PDF
   ════════════════════════════════════════════════════════ */

interface ComparisonExportData {
    requestId: string;
    endpoint: string;
    method: string;
    comparison: any;
    production: any;
    shadow: any;
    prodBody: string;
    shadowBody: string;
}

export const exportComparisonPdf = (exportData: ComparisonExportData, filename: string) => {
    const { requestId, endpoint, method, comparison: comp, production, shadow, prodBody, shadowBody } = exportData;
    const doc = new jsPDF();
    initPage(doc);
    addHeader(doc, 'Shadow Deploy', 'Comparison Report', `Report ID: ${requestId}`);

    let y = 48;

    // Request Summary
    y = addSectionTitle(doc, y, 'Request Summary');
    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Request ID', 'Endpoint', 'Method', 'Timestamp']],
        body: [[requestId, endpoint, method || 'GET', new Date().toLocaleString()]],
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Key Metrics
    y = addSectionTitle(doc, y, 'Key Metrics');
    const simScore = comp.similarity_score || 0;
    const simPct = (simScore * 100).toFixed(1);
    const riskScore = Number(comp.risk_score || 0).toFixed(1);
    const latencyDelta = comp.latency_delta_ms || 0;

    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Metric', 'Value', 'Status']],
        body: [
            ['Similarity', `${simPct}%`, simScore > 0.9 ? 'PASS' : simScore > 0.7 ? 'WARNING' : 'FAIL'],
            ['Risk Score', riskScore, Number(riskScore) < 4 ? 'LOW' : Number(riskScore) < 7 ? 'MEDIUM' : 'HIGH'],
            ['Severity', (comp.severity || 'unknown').toUpperCase(), comp.severity || 'unknown'],
            ['Status Match', comp.status_match ? 'YES' : 'NO', comp.status_match ? 'PASS' : 'FAIL'],
            ['Body Match', comp.body_match ? 'YES' : 'NO', comp.body_match ? 'PASS' : 'FAIL'],
            ['Latency Delta', `${latencyDelta > 0 ? '+' : ''}${latencyDelta}ms`, latencyDelta > 50 ? 'HIGH' : latencyDelta > 20 ? 'WARNING' : 'OK'],
            ['Prod Status Code', String(production.status_code ?? 'N/A'), ''],
            ['Shadow Status Code', String(shadow.status_code ?? 'N/A'), ''],
            ['Prod Response Time', `${production.response_time_ms ?? 'N/A'}ms`, ''],
            ['Shadow Response Time', `${shadow.response_time_ms ?? 'N/A'}ms`, ''],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 } },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 2 && data.cell.raw)
                data.cell.styles.textColor = statusColor(String(data.cell.raw));
        },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Recommendation
    y = addSectionTitle(doc, y, 'Recommendation');
    const action = comp.recommended_action?.replace(/_/g, ' ') || 'NONE';
    const actionColor = action.includes('BLOCK') ? COLORS.red : action.includes('MANUAL') ? COLORS.orange : action.includes('REVIEW') ? COLORS.amber : COLORS.green;
    y = addKeyValue(doc, y, 'Action:', action, actionColor);
    if (comp.ai_compared) {
        y = addKeyValue(doc, y, 'AI Compared:', 'Yes', COLORS.brand);
        if (comp.explanation?.confidence)
            y = addKeyValue(doc, y, 'Confidence:', `${(comp.explanation.confidence * 100).toFixed(0)}%`);
    }
    y += 4;

    // AI Analysis
    if (comp.explanation) {
        y = addSectionTitle(doc, y, 'AI Analysis');
        if (comp.explanation.impact) {
            y = addKeyValue(doc, y, 'Impact:', comp.explanation.impact, comp.explanation.impact.toLowerCase().includes('high') ? COLORS.red : COLORS.green);
        }
        if (comp.explanation.summary) { y = addKeyValue(doc, y, 'Summary:', '', COLORS.muted); y = addWrappedText(doc, y, comp.explanation.summary); y += 3; }
        if (comp.explanation.details) { y = addKeyValue(doc, y, 'Details:', '', COLORS.muted); y = addWrappedText(doc, y, comp.explanation.details); y += 3; }
        y += 4;
    }

    // Field Differences
    if (comp.field_diffs && comp.field_diffs.length > 0) {
        y = addSectionTitle(doc, y, `Field Differences (${comp.field_diffs.length})`);
        autoTable(doc, {
            ...tableStyles, startY: y,
            styles: { ...tableStyles.styles, fontSize: 7, overflow: 'linebreak' as any },
            head: [['Path', 'Type', 'Production Value', 'Shadow Value']],
            body: comp.field_diffs.map((d: any) => [
                d.path || 'unknown', d.diff_type || '',
                d.prod_value != null ? String(d.prod_value).substring(0, 80) : '(none)',
                d.shadow_value != null ? String(d.shadow_value).substring(0, 80) : '(none)',
            ]),
            columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 22 }, 2: { cellWidth: 55 }, 3: { cellWidth: 55 } },
            didParseCell(data) {
                if (data.section === 'body' && data.column.index === 1) {
                    const val = String(data.cell.raw);
                    if (val === 'ADDED') data.cell.styles.textColor = COLORS.green;
                    else if (val === 'REMOVED') data.cell.styles.textColor = COLORS.red;
                    else if (val === 'MODIFIED') data.cell.styles.textColor = COLORS.amber;
                }
            },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Response Bodies
    doc.addPage(); initPage(doc); y = 20;
    y = addSectionTitle(doc, y, `Production Response (v1) - Status ${production.status_code ?? 'N/A'}`);
    if (prodBody && prodBody.trim() !== '{}') { y = addCodeBlock(doc, y, prodBody, `Response Body  |  ${production.response_time_ms ?? '?'}ms`, 60); }
    else { y = addKeyValue(doc, y, 'Body:', '(empty or not captured)', COLORS.muted); y += 4; }

    y = addSectionTitle(doc, y, `Shadow Response (v2) - Status ${shadow.status_code ?? 'N/A'}`);
    if (shadowBody && shadowBody.trim() !== '{}') { y = addCodeBlock(doc, y, shadowBody, `Response Body  |  ${shadow.response_time_ms ?? '?'}ms`, 60); }
    else { y = addKeyValue(doc, y, 'Body:', '(empty or not captured)', COLORS.muted); }

    addFooters(doc, 'Comparison Report');
    doc.save(filename);
};

/* ════════════════════════════════════════════════════════
   3. Dashboard Overview PDF
   ════════════════════════════════════════════════════════ */

interface OverviewExportData {
    metrics: any;
    trendData: any[];
    recentComparisons: any[];
    severityData: { name: string; value: number; color: string }[];
    latencyData: { endpoint: string; prod: number; shadow: number }[];
    trendRange: number;
}

export const exportOverviewPdf = (data: OverviewExportData, filename: string) => {
    const { metrics, trendData, recentComparisons, severityData, latencyData, trendRange } = data;
    const doc = new jsPDF();
    initPage(doc);
    addHeader(doc, 'Shadow Deploy', 'Dashboard Overview Report', `Period: Last ${trendRange} days`);

    let y = 48;
    const ov = metrics.overview;
    const lat = metrics.latency;

    // KPI Summary
    y = addSectionTitle(doc, y, 'Key Performance Indicators');
    const riskScore = ov.deployment_risk_score;
    const riskVerdict = riskScore <= 3 ? 'Safe to Deploy' : riskScore <= 6 ? 'Review Recommended' : 'High Risk - Do Not Deploy';
    const riskCol = riskScore <= 3 ? COLORS.green : riskScore <= 6 ? COLORS.amber : COLORS.red;

    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Metric', 'Value', 'Status']],
        body: [
            ['Total Requests', String(ov.total_requests), 'Active mirroring'],
            ['Total Mismatches', String(ov.total_mismatches), ov.total_mismatches === 0 ? 'PASS' : 'WARNING'],
            ['Mismatch Rate', `${Number(ov.mismatch_rate_percent).toFixed(1)}%`, Number(ov.mismatch_rate_percent) > 10 ? 'HIGH' : Number(ov.mismatch_rate_percent) > 5 ? 'WARNING' : 'LOW'],
            ['Deployment Risk Score', `${Number(riskScore).toFixed(1)} / 10`, riskVerdict],
            ['P50 Latency Delta', `${lat.p50_delta_ms}ms`, lat.p50_delta_ms > 50 ? 'HIGH' : 'OK'],
            ['P95 Latency Delta', `${lat.p95_delta_ms}ms`, lat.p95_delta_ms > 100 ? 'HIGH' : lat.p95_delta_ms > 50 ? 'WARNING' : 'OK'],
            ['P99 Latency Delta', `${lat.p99_delta_ms}ms`, lat.p99_delta_ms > 200 ? 'HIGH' : 'OK'],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 45 }, 2: { cellWidth: 55 } },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 2 && data.cell.raw)
                data.cell.styles.textColor = statusColor(String(data.cell.raw));
        },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Deployment Verdict
    y = addSectionTitle(doc, y, 'Deployment Verdict');
    y = addKeyValue(doc, y, 'Risk Score:', `${Number(riskScore).toFixed(1)} / 10`, riskCol);
    y = addKeyValue(doc, y, 'Verdict:', riskVerdict, riskCol);
    y = addKeyValue(doc, y, 'Description:', '', COLORS.muted);
    const verdictDesc = riskScore <= 3
        ? 'All comparisons are within acceptable thresholds. Your shadow deployment matches production behavior closely.'
        : riskScore <= 6
        ? 'Some mismatches detected. Review the endpoint analysis for details before promoting.'
        : 'Significant behavioral differences detected. Manual review required before deployment.';
    y = addWrappedText(doc, y, verdictDesc);
    y += 6;

    // Severity Breakdown
    y = addSectionTitle(doc, y, 'Severity Breakdown');
    const sevBreak = metrics.severity_breakdown;
    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Severity', 'Count', 'Percentage']],
        body: [
            ['Low', String(sevBreak.low), `${ov.total_requests ? ((sevBreak.low / ov.total_requests) * 100).toFixed(1) : 0}%`],
            ['Medium', String(sevBreak.medium), `${ov.total_requests ? ((sevBreak.medium / ov.total_requests) * 100).toFixed(1) : 0}%`],
            ['High', String(sevBreak.high), `${ov.total_requests ? ((sevBreak.high / ov.total_requests) * 100).toFixed(1) : 0}%`],
            ['Critical', String(sevBreak.critical), `${ov.total_requests ? ((sevBreak.critical / ov.total_requests) * 100).toFixed(1) : 0}%`],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 45 }, 2: { cellWidth: 50 } },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 0) {
                data.cell.styles.textColor = severityColor(String(data.cell.raw));
            }
        },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Latency Comparison by Endpoint
    if (latencyData.length > 0) {
        y = addSectionTitle(doc, y, 'Latency Comparison by Endpoint');
        autoTable(doc, {
            ...tableStyles, startY: y,
            head: [['Endpoint', 'Prod (ms)', 'Shadow (ms)', 'Delta (ms)']],
            body: latencyData.map(l => {
                const delta = l.shadow - l.prod;
                return [l.endpoint, String(l.prod), String(l.shadow), `${delta > 0 ? '+' : ''}${delta}`];
            }),
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 }, 3: { cellWidth: 35 } },
            didParseCell(data) {
                if (data.section === 'body' && data.column.index === 3) {
                    const delta = parseInt(String(data.cell.raw));
                    if (delta > 50) data.cell.styles.textColor = COLORS.red;
                    else if (delta > 20) data.cell.styles.textColor = COLORS.amber;
                    else data.cell.styles.textColor = COLORS.green;
                }
            },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Risk Trend Data
    if (trendData.length > 0) {
        doc.addPage(); initPage(doc); y = 20;
        y = addSectionTitle(doc, y, `Risk & Pass Rate Trend (Last ${trendRange} Days)`);
        autoTable(doc, {
            ...tableStyles, startY: y,
            head: [['Date', 'Risk Score', 'Pass Rate', 'Total Requests', 'Mismatches']],
            body: trendData.map(t => [
                t.date || t.bucket || '',
                typeof t.risk_score === 'number' ? t.risk_score.toFixed(1) : String(t.risk_score ?? ''),
                typeof t.pass_rate === 'number' ? `${t.pass_rate.toFixed(1)}%` : String(t.pass_rate ?? ''),
                String(t.total ?? t.total_requests ?? ''),
                String(t.mismatches ?? t.total_mismatches ?? ''),
            ]),
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
            didParseCell(data) {
                if (data.section === 'body') {
                    if (data.column.index === 1) {
                        const v = parseFloat(String(data.cell.raw));
                        if (!isNaN(v)) data.cell.styles.textColor = v < 4 ? COLORS.green : v < 7 ? COLORS.amber : COLORS.red;
                    }
                    if (data.column.index === 2) {
                        const v = parseFloat(String(data.cell.raw));
                        if (!isNaN(v)) data.cell.styles.textColor = v >= 90 ? COLORS.green : v >= 70 ? COLORS.amber : COLORS.red;
                    }
                }
            },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Recent Comparisons
    if (recentComparisons.length > 0) {
        y = addSectionTitle(doc, y, 'Recent Comparisons');
        autoTable(doc, {
            ...tableStyles, startY: y,
            head: [['Endpoint', 'Method', 'Status', 'Severity', 'Risk', 'Time']],
            body: recentComparisons.map(c => [
                c.endpoint || '',
                c.method || 'GET',
                c.status_match !== false ? 'Match' : 'Mismatch',
                c.severity || 'none',
                typeof c.risk_score === 'number' ? c.risk_score.toFixed(1) : String(c.risk_score ?? ''),
                (c.timestamp || c.created_at) ? new Date(c.timestamp || c.created_at).toLocaleString() : 'N/A',
            ]),
            columnStyles: { 0: { cellWidth: 55 } },
            didParseCell(data) {
                if (data.section === 'body') {
                    if (data.column.index === 2) data.cell.styles.textColor = String(data.cell.raw) === 'Match' ? COLORS.green : COLORS.red;
                    if (data.column.index === 3) data.cell.styles.textColor = severityColor(String(data.cell.raw));
                    if (data.column.index === 4) {
                        const v = parseFloat(String(data.cell.raw));
                        if (!isNaN(v)) data.cell.styles.textColor = v < 4 ? COLORS.green : v < 7 ? COLORS.amber : COLORS.red;
                    }
                }
            },
        });
    }

    addFooters(doc, 'Dashboard Overview Report');
    doc.save(filename);
};

/* ════════════════════════════════════════════════════════
   4. Endpoint Analysis PDF
   ════════════════════════════════════════════════════════ */

interface EndpointExportData {
    comparisons: any[];
    filters: { endpoint: string; severity: string; timeRange: string };
    totalResults: number;
}

export const exportEndpointAnalysisPdf = (data: EndpointExportData, filename: string) => {
    const { comparisons, filters, totalResults } = data;
    if (!comparisons || comparisons.length === 0) return;

    const doc = new jsPDF('l'); // landscape for wider table
    initPage(doc);
    addHeader(doc, 'Shadow Deploy', 'Endpoint Analysis Report', `${comparisons.length} of ${totalResults} results`);

    let y = 48;

    // Applied Filters
    y = addSectionTitle(doc, y, 'Report Filters');
    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Filter', 'Value']],
        body: [
            ['Endpoint Filter', filters.endpoint || '(all)'],
            ['Severity Filter', filters.severity === 'all' ? '(all)' : filters.severity],
            ['Time Range', filters.timeRange],
            ['Total Results', String(totalResults)],
            ['Exported Results', String(comparisons.length)],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 80 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Summary Statistics
    y = addSectionTitle(doc, y, 'Summary Statistics');
    const totalMismatches = comparisons.filter(c => c.body_match === false || c.status_match === false).length;
    const avgRisk = comparisons.reduce((s, c) => s + (c.risk_score || 0), 0) / comparisons.length;
    const avgLatency = comparisons.reduce((s, c) => s + (c.latency_delta_ms || 0), 0) / comparisons.length;
    const sevCounts = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };
    comparisons.forEach(c => { const s = (c.severity || 'none').toLowerCase(); if (s in sevCounts) (sevCounts as any)[s]++; });

    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['Metric', 'Value', 'Status']],
        body: [
            ['Total Comparisons', String(comparisons.length), ''],
            ['Mismatches', String(totalMismatches), totalMismatches === 0 ? 'PASS' : 'WARNING'],
            ['Mismatch Rate', `${((totalMismatches / comparisons.length) * 100).toFixed(1)}%`, totalMismatches / comparisons.length > 0.1 ? 'HIGH' : 'LOW'],
            ['Avg Risk Score', avgRisk.toFixed(1), avgRisk < 4 ? 'LOW' : avgRisk < 7 ? 'MEDIUM' : 'HIGH'],
            ['Avg Latency Delta', `${avgLatency.toFixed(0)}ms`, avgLatency > 50 ? 'HIGH' : avgLatency > 20 ? 'WARNING' : 'OK'],
            ['Critical', String(sevCounts.critical), sevCounts.critical > 0 ? 'FAIL' : 'PASS'],
            ['High', String(sevCounts.high), sevCounts.high > 0 ? 'WARNING' : 'PASS'],
            ['Medium', String(sevCounts.medium), ''],
            ['Low', String(sevCounts.low), 'PASS'],
        ],
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 }, 1: { cellWidth: 45 }, 2: { cellWidth: 40 } },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 2 && data.cell.raw)
                data.cell.styles.textColor = statusColor(String(data.cell.raw));
            if (data.section === 'body' && data.column.index === 0) {
                const val = String(data.cell.raw);
                if (['Critical', 'High', 'Medium', 'Low'].includes(val))
                    data.cell.styles.textColor = severityColor(val);
            }
        },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Full Comparison Table
    doc.addPage(); initPage(doc); y = 20;
    y = addSectionTitle(doc, y, 'Comparison Results');

    autoTable(doc, {
        ...tableStyles, startY: y,
        head: [['#', 'Endpoint', 'Method', 'Status\nMatch', 'Body\nMatch', 'Severity', 'Risk\nScore', 'Similarity', 'Latency\nDelta', 'Timestamp']],
        body: comparisons.map((item, idx) => {
            const sim = item.similarity_score !== undefined ? (item.similarity_score * 100).toFixed(0) + '%' : 'N/A';
            const ts = (item.timestamp || item.created_at) ? new Date(item.timestamp || item.created_at).toLocaleString() : 'N/A';
            return [
                String(idx + 1),
                item.endpoint || '',
                item.method || 'GET',
                item.status_match !== false ? 'Yes' : 'No',
                item.body_match !== false ? 'Yes' : 'No',
                (item.severity || 'none').toUpperCase(),
                Number(item.risk_score || 0).toFixed(1),
                sim,
                `+${item.latency_delta_ms || 0}ms`,
                ts,
            ];
        }),
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 55 },
            2: { cellWidth: 18 },
            3: { cellWidth: 18 },
            4: { cellWidth: 16 },
            5: { cellWidth: 22 },
            6: { cellWidth: 18 },
            7: { cellWidth: 22 },
            8: { cellWidth: 22 },
            9: { cellWidth: 45 },
        },
        styles: { ...tableStyles.styles, fontSize: 7 },
        didParseCell(data) {
            if (data.section !== 'body') return;
            // Status Match
            if (data.column.index === 3)
                data.cell.styles.textColor = String(data.cell.raw) === 'Yes' ? COLORS.green : COLORS.red;
            // Body Match
            if (data.column.index === 4)
                data.cell.styles.textColor = String(data.cell.raw) === 'Yes' ? COLORS.green : COLORS.red;
            // Severity
            if (data.column.index === 5)
                data.cell.styles.textColor = severityColor(String(data.cell.raw));
            // Risk Score
            if (data.column.index === 6) {
                const v = parseFloat(String(data.cell.raw));
                if (!isNaN(v)) data.cell.styles.textColor = v < 4 ? COLORS.green : v < 7 ? COLORS.amber : COLORS.red;
            }
            // Similarity
            if (data.column.index === 7) {
                const v = parseFloat(String(data.cell.raw));
                if (!isNaN(v)) data.cell.styles.textColor = v > 90 ? COLORS.green : v > 70 ? COLORS.amber : COLORS.red;
            }
            // Latency
            if (data.column.index === 8) {
                const v = parseInt(String(data.cell.raw).replace(/[^0-9-]/g, ''));
                if (!isNaN(v)) data.cell.styles.textColor = v > 50 ? COLORS.red : v > 20 ? COLORS.amber : COLORS.green;
            }
        },
    });

    addFooters(doc, 'Endpoint Analysis Report');
    doc.save(filename);
};
