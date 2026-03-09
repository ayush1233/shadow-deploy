import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComparison } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { exportCsv } from '../utils/exportCsv';
import { exportPdf } from '../utils/exportPdf';

export default function ComparisonDetailPage() {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
    const [data, setData] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');
    const [isDiffExpanded, setIsDiffExpanded] = useState(false);
    const [splitView, setSplitView] = useState(true);
    const [showDiffOnly, setShowDiffOnly] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchDetail = async () => {
            if (!requestId) return;
            setIsLoaded(false);
            try {
                const response = await getComparison(requestId);
                if (isMounted) {
                    setData(response.data);
                    setIsLoaded(true);
                }
            } catch (err: any) {
                console.error("Failed to fetch comparison detail", err);
                if (isMounted) {
                    setError('Failed to load comparison data. It may not exist.');
                    setIsLoaded(true);
                }
            }
        };

        fetchDetail();
        return () => { isMounted = false; };
    }, [requestId, navigate]);

    if (!isLoaded) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading comparison...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
                <div style={{ color: 'var(--accent-red)' }}>{error || 'Comparison not found'}</div>
                <button className="btn btn-secondary" onClick={() => navigate('/endpoints')}>
                    Go Back to Endpoints
                </button>
            </div>
        );
    }

    const comp = data.comparison;

    const getSeverityEmoji = (severity: string) => {
        switch (severity) {
            case 'none': return '✅';
            case 'low': return '🟢';
            case 'medium': return '🟡';
            case 'high': return '🟠';
            case 'critical': return '🔴';
            default: return '⚪';
        }
    };

    const getActionStyle = (action: string) => {
        switch (action) {
            case 'SAFE_TO_PROCEED':
            case 'SAFE_TO_PROMOTE':
                return { background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)', border: '1px solid rgba(16, 185, 129, 0.3)' };
            case 'REVIEW_RECOMMENDED':
                return { background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-yellow)', border: '1px solid rgba(245, 158, 11, 0.3)' };
            case 'MANUAL_REVIEW_REQUIRED':
                return { background: 'rgba(249, 115, 22, 0.12)', color: 'var(--accent-orange)', border: '1px solid rgba(249, 115, 22, 0.3)' };
            case 'BLOCK_DEPLOYMENT':
                return { background: 'rgba(239, 68, 68, 0.12)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)' };
            default:
                return {};
        }
    };

    let prodBodyRaw = typeof data.production.body === 'string' ? data.production.body : JSON.stringify(data.production.body, null, 2);
    let shadowBodyRaw = typeof data.shadow.body === 'string' ? data.shadow.body : JSON.stringify(data.shadow.body, null, 2);

    try {
        if (typeof data.production.body === 'string') prodBodyRaw = JSON.stringify(JSON.parse(data.production.body), null, 2);
        if (typeof data.shadow.body === 'string') shadowBodyRaw = JSON.stringify(JSON.parse(data.shadow.body), null, 2);
    } catch (e) { }

    return (
        <div style={{ animation: 'fade-in 0.3s ease-out' }}>
            <button className="back-btn" onClick={() => navigate('/endpoints')}>
                ← Back to Endpoint Analysis
            </button>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {getSeverityEmoji(comp.severity)}
                        Comparison Detail
                    </h2>
                    <p>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{data.endpoint}</span>
                        {' '}&middot;{' '}
                        <span style={{ color: 'var(--text-muted)' }}>Request ID: {requestId || data.request_id}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={() => exportCsv([comp], `comparison-${requestId}.csv`)}>⬇ CSV</button>
                    <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={() => exportPdf([comp], 'Comparison Detail', `comparison-${requestId}.pdf`)}>⬇ PDF</button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="stat-card blue">
                    <div className="stat-label">Status Codes</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                        <span style={{ color: 'var(--accent-green)' }}>{data.production.status_code}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                        <span style={{ color: comp.status_match ? 'var(--accent-green)' : 'var(--accent-red)' }}>{data.shadow.status_code}</span>
                    </div>
                </div>

                <div className={`stat-card ${comp.similarity_score > 0.9 ? 'green' : comp.similarity_score > 0.7 ? 'yellow' : 'red'}`}>
                    <div className="stat-label">Similarity</div>
                    <div className="stat-value" style={{ fontSize: 24, color: comp.similarity_score > 0.9 ? 'var(--accent-green)' : comp.similarity_score > 0.7 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                        {(comp.similarity_score * 100).toFixed(0)}%
                    </div>
                </div>

                <div className={`stat-card ${comp.latency_delta_ms > 50 ? 'red' : comp.latency_delta_ms > 20 ? 'yellow' : 'cyan'}`}>
                    <div className="stat-label">Latency Diff</div>
                    <div className="stat-value" style={{ fontSize: 24, color: comp.latency_delta_ms > 50 ? 'var(--accent-red)' : comp.latency_delta_ms > 20 ? 'var(--accent-yellow)' : 'var(--accent-cyan)' }}>
                        +{comp.latency_delta_ms}ms
                    </div>
                </div>

                <div className={`stat-card ${comp.risk_score > 6 ? 'red' : comp.risk_score > 3 ? 'orange' : 'green'}`}>
                    <div className="stat-label">Risk Score</div>
                    <div className="stat-value" style={{ fontSize: 24, color: comp.risk_score > 6 ? 'var(--accent-red)' : comp.risk_score > 3 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                        {Number(comp.risk_score).toFixed(1)}
                    </div>
                </div>

                <div className="stat-card purple" style={getActionStyle(comp.recommended_action)}>
                    <div className="stat-label" style={{ color: 'inherit', opacity: 0.8 }}>Recommendation</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>
                        {comp.recommended_action?.replace(/_/g, ' ') || 'NONE'}
                    </div>
                </div>
            </div>

            {/* AI Explanation Panel */}
            {comp.explanation && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="chart-card gradient-border glow-border ai-panel border-glow"
                    style={{
                        marginBottom: 24,
                        padding: 24,
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'rgba(30, 41, 59, 0.45)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                >
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03, fontSize: 120, pointerEvents: 'none' }}>✨</div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>🧠</span>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                                AI Analysis
                            </h3>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{
                                fontSize: 13,
                                fontWeight: 600,
                                background: comp.explanation.impact?.toLowerCase().includes('high') ? 'rgba(239, 68, 68, 0.15)' :
                                    comp.explanation.impact?.toLowerCase().includes('medium') ? 'rgba(245, 158, 11, 0.15)' :
                                        'rgba(16, 185, 129, 0.15)',
                                color: comp.explanation.impact?.toLowerCase().includes('high') ? 'var(--accent-red)' :
                                    comp.explanation.impact?.toLowerCase().includes('medium') ? 'var(--accent-yellow)' :
                                        'var(--accent-green)',
                                padding: '4px 12px',
                                borderRadius: 16,
                                border: comp.explanation.impact?.toLowerCase().includes('high') ? '1px solid rgba(239, 68, 68, 0.3)' :
                                    comp.explanation.impact?.toLowerCase().includes('medium') ? '1px solid rgba(245, 158, 11, 0.3)' :
                                        '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                {comp.explanation.impact || 'Unknown Impact'}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Confidence: {(comp.explanation.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Summary</h4>
                            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16, fontWeight: 500 }}>{comp.explanation.summary}</p>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Details</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{comp.explanation.details}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Expandable Diff Viewer Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>Raw Payloads</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isDiffExpanded && (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSplitView(!splitView)}
                                style={{ background: splitView ? 'var(--accent-purple)' : 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: 12, padding: '6px 12px', color: splitView ? '#fff' : 'var(--text-secondary)' }}
                            >
                                {splitView ? 'Side-by-Side' : 'Unified'}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDiffOnly(!showDiffOnly)}
                                style={{ background: showDiffOnly ? 'var(--accent-purple)' : 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: 12, padding: '6px 12px', color: showDiffOnly ? '#fff' : 'var(--text-secondary)' }}
                            >
                                {showDiffOnly ? 'Changes Only' : 'Full Content'}
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsDiffExpanded(!isDiffExpanded)}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                        {isDiffExpanded ? 'Hide Full Diff' : 'View Full Diff'}
                        <motion.div animate={{ rotate: isDiffExpanded ? 180 : 0 }}>▼</motion.div>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isDiffExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >

                        <div style={{ padding: 16, background: 'rgba(30, 41, 59, 0.45)', borderRadius: 8, marginTop: 16, border: '1px solid var(--border-color)', backdropFilter: 'blur(16px)' }}>
                            <ReactDiffViewer
                                oldValue={prodBodyRaw}
                                newValue={shadowBodyRaw}
                                splitView={splitView}
                                leftTitle="Production (v1)"
                                rightTitle="Shadow (v2 candidate)"
                                useDarkTheme={true}
                                showDiffOnly={showDiffOnly}
                                styles={{
                                    variables: {
                                        dark: {
                                            diffViewerBackground: 'transparent',
                                            diffViewerColor: 'var(--text-primary)',
                                            addedBackground: 'rgba(16, 185, 129, 0.15)',
                                            addedColor: '#fff',
                                            removedBackground: 'rgba(239, 68, 68, 0.15)',
                                            removedColor: '#fff',
                                            wordAddedBackground: 'rgba(16, 185, 129, 0.4)',
                                            wordRemovedBackground: 'rgba(239, 68, 68, 0.4)',
                                            addedGutterBackground: 'rgba(16, 185, 129, 0.05)',
                                            removedGutterBackground: 'rgba(239, 68, 68, 0.05)',
                                            gutterBackground: 'transparent',
                                            gutterBackgroundDark: 'transparent',
                                            emptyLineBackground: 'transparent',
                                            diffViewerTitleBackground: 'rgba(0,0,0,0.2)',
                                            diffViewerTitleColor: 'var(--text-secondary)',
                                            diffViewerTitleBorderColor: 'var(--border-color)'
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Field Level Diffs Summary */}
                        {comp.field_diffs && comp.field_diffs.length > 0 && (
                            <div className="chart-card" style={{ marginTop: 24 }}>
                                <div className="card-header"><span className="card-title">Structured Field Differences</span></div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Path</th>
                                            <th>Type</th>
                                            <th>Production Value</th>
                                            <th>Shadow Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comp.field_diffs.map((diff: any, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{diff.path}</td>
                                                <td>
                                                    <span className={`diff-badge diff-${diff.diff_type === 'ADDED' ? 'success' : diff.diff_type === 'REMOVED' ? 'danger' : 'warning'}`}>
                                                        {diff.diff_type}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{String(diff.prod_value)}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{String(diff.shadow_value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
