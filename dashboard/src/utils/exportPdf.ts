import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ────────────────────────────────────────────────────────
   Generic table-based PDF (used by Overview & Endpoint pages)
   ──────────────────────────────────────────────────────── */
export const exportPdf = (data: any[], title: string, filename: string) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
    }));

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(filename);
};

/* ────────────────────────────────────────────────────────
   Detailed Comparison PDF — full report with all sections
   ──────────────────────────────────────────────────────── */

const COLORS = {
    brand:   [99, 102, 241] as [number, number, number],   // indigo
    dark:    [30, 41, 59]   as [number, number, number],    // slate-800
    green:   [34, 197, 94]  as [number, number, number],
    red:     [239, 68, 68]  as [number, number, number],
    amber:   [245, 158, 11] as [number, number, number],
    muted:   [120, 120, 130] as [number, number, number],
    bg:      [15, 15, 20]   as [number, number, number],
    cardBg:  [24, 24, 32]   as [number, number, number],
    white:   [255, 255, 255] as [number, number, number],
    lightGray: [200, 200, 210] as [number, number, number],
};

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

function severityColor(severity: string): [number, number, number] {
    switch (severity?.toLowerCase()) {
        case 'critical': return COLORS.red;
        case 'high': return [251, 146, 60];
        case 'medium': return COLORS.amber;
        case 'low': return COLORS.green;
        default: return COLORS.muted;
    }
}

function riskColor(score: number): [number, number, number] {
    if (score >= 7) return COLORS.red;
    if (score >= 4) return COLORS.amber;
    return COLORS.green;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
    if (y > 260) { doc.addPage(); y = 20; }
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
    if (y > 275) { doc.addPage(); y = 20; }
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
        if (y > 278) { doc.addPage(); y = 20; }
        doc.text(line, 16, y);
        y += 4.5;
    }
    return y;
}

function addCodeBlock(doc: jsPDF, y: number, code: string, label: string, maxLines: number = 50): number {
    if (y > 240) { doc.addPage(); y = 20; }

    // Label
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, 16, y);
    y += 6;

    const lines = code.split('\n').slice(0, maxLines);
    const lineHeight = 3.8;
    const blockHeight = Math.min(lines.length * lineHeight + 8, 200);

    // Check if block fits on current page
    if (y + blockHeight > 278) { doc.addPage(); y = 20; }

    // Background rect
    doc.setFillColor(10, 10, 14);
    doc.setDrawColor(50, 50, 60);
    doc.roundedRect(14, y - 2, 182, blockHeight, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.lightGray);
    let lineY = y + 4;
    for (const line of lines) {
        if (lineY > 278) { doc.addPage(); lineY = 20; }
        // Truncate very long lines
        const truncated = line.length > 120 ? line.substring(0, 117) + '...' : line;
        doc.text(truncated, 17, lineY);
        lineY += lineHeight;
    }

    if (lines.length < code.split('\n').length) {
        doc.setTextColor(...COLORS.muted);
        doc.text(`... (${code.split('\n').length - maxLines} more lines)`, 17, lineY);
        lineY += lineHeight;
    }

    return lineY + 6;
}

export const exportComparisonPdf = (exportData: ComparisonExportData, filename: string) => {
    const { requestId, endpoint, method, comparison: comp, production, shadow, prodBody, shadowBody } = exportData;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Page background ──
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    // ── Header banner ──
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setFillColor(...COLORS.brand);
    doc.rect(0, 38, pageWidth, 1.5, 'F');

    doc.setFontSize(20);
    doc.setTextColor(...COLORS.white);
    doc.text('Shadow Deploy', 14, 16);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.lightGray);
    doc.text('Comparison Report', 14, 24);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
    doc.text(`Report ID: ${requestId}`, pageWidth - 14, 33, { align: 'right' });

    let y = 48;

    // ── Section 1: Request Summary ──
    y = addSectionTitle(doc, y, 'Request Summary');

    autoTable(doc, {
        startY: y,
        head: [['Request ID', 'Endpoint', 'Method', 'Timestamp']],
        body: [[
            requestId,
            endpoint,
            method || 'GET',
            new Date().toLocaleString(),
        ]],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, textColor: COLORS.lightGray, lineColor: [50, 50, 60], lineWidth: 0.3 },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' },
        bodyStyles: { fillColor: COLORS.cardBg },
        margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Section 2: Key Metrics ──
    y = addSectionTitle(doc, y, 'Key Metrics');

    const simScore = comp.similarity_score || 0;
    const simPct = (simScore * 100).toFixed(1);
    const riskScore = Number(comp.risk_score || 0).toFixed(1);
    const latencyDelta = comp.latency_delta_ms || 0;
    const severity = comp.severity || 'unknown';

    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value', 'Status']],
        body: [
            ['Similarity', `${simPct}%`, simScore > 0.9 ? 'PASS' : simScore > 0.7 ? 'WARNING' : 'FAIL'],
            ['Risk Score', riskScore, Number(riskScore) < 4 ? 'LOW' : Number(riskScore) < 7 ? 'MEDIUM' : 'HIGH'],
            ['Severity', severity.toUpperCase(), severity],
            ['Status Match', comp.status_match ? 'YES' : 'NO', comp.status_match ? 'PASS' : 'FAIL'],
            ['Body Match', comp.body_match ? 'YES' : 'NO', comp.body_match ? 'PASS' : 'FAIL'],
            ['Latency Delta', `${latencyDelta > 0 ? '+' : ''}${latencyDelta}ms`, latencyDelta > 50 ? 'HIGH' : latencyDelta > 20 ? 'WARNING' : 'OK'],
            ['Prod Status Code', String(production.status_code ?? 'N/A'), ''],
            ['Shadow Status Code', String(shadow.status_code ?? 'N/A'), ''],
            ['Prod Response Time', `${production.response_time_ms ?? 'N/A'}ms`, ''],
            ['Shadow Response Time', `${shadow.response_time_ms ?? 'N/A'}ms`, ''],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3.5, textColor: COLORS.lightGray, lineColor: [50, 50, 60], lineWidth: 0.3 },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' },
        bodyStyles: { fillColor: COLORS.cardBg },
        margin: { left: 14, right: 14 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 60 },
            2: { cellWidth: 40 },
        },
        didParseCell(data) {
            if (data.section === 'body' && data.column.index === 2) {
                const val = String(data.cell.raw).toLowerCase();
                if (val === 'pass' || val === 'low' || val === 'ok' || val === 'yes')
                    data.cell.styles.textColor = COLORS.green;
                else if (val === 'fail' || val === 'high' || val === 'no')
                    data.cell.styles.textColor = COLORS.red;
                else if (val === 'warning' || val === 'medium')
                    data.cell.styles.textColor = COLORS.amber;
            }
        },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Section 3: Recommendation ──
    y = addSectionTitle(doc, y, 'Recommendation');
    const action = comp.recommended_action?.replace(/_/g, ' ') || 'NONE';
    const actionColor = action.includes('BLOCK') ? COLORS.red
        : action.includes('MANUAL') ? [251, 146, 60] as [number, number, number]
        : action.includes('REVIEW') ? COLORS.amber
        : COLORS.green;
    y = addKeyValue(doc, y, 'Action:', action, actionColor);
    if (comp.ai_compared) {
        y = addKeyValue(doc, y, 'AI Compared:', 'Yes', COLORS.brand);
        if (comp.explanation?.confidence) {
            y = addKeyValue(doc, y, 'Confidence:', `${(comp.explanation.confidence * 100).toFixed(0)}%`);
        }
    }
    y += 4;

    // ── Section 4: AI Analysis ──
    if (comp.explanation) {
        y = addSectionTitle(doc, y, 'AI Analysis');
        if (comp.explanation.impact) {
            const impactColor = comp.explanation.impact.toLowerCase().includes('high') ? COLORS.red : COLORS.green;
            y = addKeyValue(doc, y, 'Impact:', comp.explanation.impact, impactColor);
        }
        if (comp.explanation.summary) {
            y = addKeyValue(doc, y, 'Summary:', '', COLORS.muted);
            y = addWrappedText(doc, y, comp.explanation.summary);
            y += 3;
        }
        if (comp.explanation.details) {
            y = addKeyValue(doc, y, 'Details:', '', COLORS.muted);
            y = addWrappedText(doc, y, comp.explanation.details);
            y += 3;
        }
        y += 4;
    }

    // ── Section 5: Field Differences ──
    if (comp.field_diffs && comp.field_diffs.length > 0) {
        y = addSectionTitle(doc, y, `Field Differences (${comp.field_diffs.length})`);

        autoTable(doc, {
            startY: y,
            head: [['Path', 'Type', 'Production Value', 'Shadow Value']],
            body: comp.field_diffs.map((d: any) => [
                d.path || 'unknown',
                d.diff_type || '',
                d.prod_value != null ? String(d.prod_value).substring(0, 80) : '(none)',
                d.shadow_value != null ? String(d.shadow_value).substring(0, 80) : '(none)',
            ]),
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 3, textColor: COLORS.lightGray, lineColor: [50, 50, 60], lineWidth: 0.3, overflow: 'linebreak' },
            headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold' },
            bodyStyles: { fillColor: COLORS.cardBg },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { cellWidth: 45, fontStyle: 'bold' },
                1: { cellWidth: 22 },
                2: { cellWidth: 55 },
                3: { cellWidth: 55 },
            },
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

    // ── Section 6: Production Response Body ──
    doc.addPage();
    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    y = 20;

    y = addSectionTitle(doc, y, `Production Response (v1) — Status ${production.status_code ?? 'N/A'}`);
    if (prodBody && prodBody.trim() !== '{}') {
        y = addCodeBlock(doc, y, prodBody, `Response Body  |  ${production.response_time_ms ?? '?'}ms`, 60);
    } else {
        y = addKeyValue(doc, y, 'Body:', '(empty or not captured)', COLORS.muted);
        y += 4;
    }

    // ── Section 7: Shadow Response Body ──
    y = addSectionTitle(doc, y, `Shadow Response (v2) — Status ${shadow.status_code ?? 'N/A'}`);
    if (shadowBody && shadowBody.trim() !== '{}') {
        y = addCodeBlock(doc, y, shadowBody, `Response Body  |  ${shadow.response_time_ms ?? '?'}ms`, 60);
    } else {
        y = addKeyValue(doc, y, 'Body:', '(empty or not captured)', COLORS.muted);
    }

    // ── Footer on every page ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Background for pages added after the first
        if (i > 1) {
            doc.setFillColor(...COLORS.bg);
            doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
        }
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, pageH - 12, pageWidth, 12, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.muted);
        doc.text('Shadow Deploy - Comparison Report', 14, pageH - 4.5);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageH - 4.5, { align: 'right' });
    }

    doc.save(filename);
};
