import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComparison } from '../services/api';
import { motion } from 'framer-motion';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { exportCsv } from '../utils/exportCsv';
import { exportPdf } from '../utils/exportPdf';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import RiskGauge from '../components/ui/RiskGauge';
import { PageSkeleton } from '../components/ui/SkeletonLoader';

export default function ComparisonDetailPage() {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
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
                if (isMounted) { setData(response.data); setIsLoaded(true); }
            } catch (err: any) {
                if (isMounted) { setError('Failed to load comparison data.'); setIsLoaded(true); }
            }
        };
        fetchDetail();
        return () => { isMounted = false; };
    }, [requestId]);

    if (!isLoaded) return <PageSkeleton />;
    if (error || !data) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
                <div style={{ color: 'var(--red)', fontSize: 14 }}>{error || 'Comparison not found'}</div>
                <button className="btn btn-secondary" onClick={() => navigate('/endpoints')}>Back to Endpoints</button>
            </motion.div>
        );
    }

    const comp = data.comparison;
    const getActionStyle = (action: string) => {
        switch (action) {
            case 'SAFE_TO_PROCEED': case 'SAFE_TO_PROMOTE': return { background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.25)' };
            case 'REVIEW_RECOMMENDED': return { background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' };
            case 'MANUAL_REVIEW_REQUIRED': return { background: 'rgba(251,146,60,0.1)', color: 'var(--orange)', border: '1px solid rgba(251,146,60,0.25)' };
            case 'BLOCK_DEPLOYMENT': return { background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' };
            default: return {};
        }
    };

    let prodBodyRaw = typeof data.production.body === 'string' ? data.production.body : JSON.stringify(data.production.body, null, 2);
    let shadowBodyRaw = typeof data.shadow.body === 'string' ? data.shadow.body : JSON.stringify(data.shadow.body, null, 2);
    try { if (typeof data.production.body === 'string') prodBodyRaw = JSON.stringify(JSON.parse(data.production.body), null, 2); if (typeof data.shadow.body === 'string') shadowBodyRaw = JSON.stringify(JSON.parse(data.shadow.body), null, 2); } catch (e) {}
    const bodiesEmpty = prodBodyRaw.trim() === '{}' && shadowBodyRaw.trim() === '{}';
    const bodiesIdentical = prodBodyRaw === shadowBodyRaw;
    const hasFieldDiffs = comp.field_diffs && comp.field_diffs.length > 0;
    if ((bodiesEmpty || bodiesIdentical) && hasFieldDiffs) {
        const prodObj: Record<string, any> = {}, shadowObj: Record<string, any> = {};
        comp.field_diffs.forEach((d: any) => { const k = d.path || 'unknown'; if (d.diff_type === 'ADDED') shadowObj[k] = d.shadow_value ?? '(added)'; else if (d.diff_type === 'REMOVED') prodObj[k] = d.prod_value ?? '(removed)'; else { prodObj[k] = d.prod_value; shadowObj[k] = d.shadow_value; } });
        prodBodyRaw = JSON.stringify(prodObj, null, 2); shadowBodyRaw = JSON.stringify(shadowObj, null, 2);
    }
    const latencyDiff = comp.latency_delta_ms || 0;
    const simScore = comp.similarity_score || 1;
    const handlePdfExport = () => exportPdf([{ 'Request ID': requestId, Endpoint: data.endpoint, Method: data.method, Similarity: `${(simScore * 100).toFixed(1)}%`, 'Risk Score': Number(comp.risk_score).toFixed(1), Severity: comp.severity }], 'Comparison Detail', `comparison-${requestId}.pdf`);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <button className="back-btn" onClick={() => navigate('/endpoints')}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Endpoint Analysis
            </button>
            <PageHeader title="Comparison Detail" description={`${data.method || 'GET'} ${data.endpoint} \u2014 ${requestId}`} actions={<div style={{ display: 'flex', gap: 8 }}><SeverityBadge severity={comp.severity} size="md" /><button className="btn btn-secondary" onClick={() => exportCsv([comp], `comparison-${requestId}.csv`)}>CSV</button><button className="btn btn-secondary" onClick={handlePdfExport}>PDF</button></div>} />

            {/* Metrics Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <GlassCard delay={0}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Status Match</div><div style={{ fontSize: 28, color: comp.status_match ? 'var(--green)' : 'var(--red)' }}>{comp.status_match ? '\u2713' : '\u2717'}</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data.production.status_code} &rarr; {data.shadow.status_code}</div></div></GlassCard>
                <GlassCard delay={0.05}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Body Match</div><div style={{ fontSize: 28, color: comp.body_match ? 'var(--green)' : 'var(--red)' }}>{comp.body_match ? '\u2713' : '\u2717'}</div></div></GlassCard>
                <GlassCard delay={0.1}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Similarity</div><div style={{ fontSize: 28, fontWeight: 600, color: simScore > 0.9 ? 'var(--green)' : simScore > 0.7 ? 'var(--amber)' : 'var(--red)' }}>{(simScore * 100).toFixed(0)}%</div></div></GlassCard>
                <GlassCard delay={0.15}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Latency Delta</div><div style={{ fontSize: 28, fontWeight: 600, color: latencyDiff > 50 ? 'var(--red)' : latencyDiff > 20 ? 'var(--amber)' : 'var(--cyan)' }}>+{latencyDiff}ms</div></div></GlassCard>
            </div>

            {/* Risk + Recommendation */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 24 }}>
                <GlassCard delay={0.2}><RiskGauge score={comp.risk_score || 0} size={140} /></GlassCard>
                <GlassCard delay={0.25}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Recommendation</div>
                    <div style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, ...getActionStyle(comp.recommended_action) }}>{comp.recommended_action?.replace(/_/g, ' ') || 'NONE'}</div>
                    {comp.ai_compared && <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>AI compared &middot; Confidence: {comp.explanation?.confidence ? (comp.explanation.confidence * 100).toFixed(0) + '%' : 'N/A'}</div>}
                </GlassCard>
            </div>

            {/* AI Explanation */}
            {comp.explanation && (
                <GlassCard style={{ marginBottom: 24, borderColor: 'rgba(99,102,241,0.15)' }} delay={0.3}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z" fill="var(--accent)"/></svg>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>AI Analysis</h3>
                        {comp.explanation.impact && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: comp.explanation.impact.toLowerCase().includes('high') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: comp.explanation.impact.toLowerCase().includes('high') ? 'var(--red)' : 'var(--green)' }}>{comp.explanation.impact}</span>}
                    </div>
                    {comp.explanation.summary && <><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Summary</div><p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5, marginBottom: 16 }}>{comp.explanation.summary}</p></>}
                    {comp.explanation.details && <><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Details</div><p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{comp.explanation.details}</p></>}
                </GlassCard>
            )}

            {/* Response Comparison Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 24 }}>
                <GlassCard delay={0.35}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} /> Production (v1)</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}>{data.production.status_code}</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.production.response_time_ms || '?'}ms</span></div>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{prodBodyRaw}</pre>
                </GlassCard>
                <div style={{ display: 'flex', alignItems: 'center' }}><div style={{ padding: '6px 10px', background: latencyDiff > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)', fontSize: 11, fontWeight: 600, color: latencyDiff > 0 ? 'var(--red)' : 'var(--green)', whiteSpace: 'nowrap' }}>{latencyDiff > 0 ? '+' : ''}{latencyDiff}ms</div></div>
                <GlassCard delay={0.35}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Shadow (v2)</div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>{data.shadow.status_code}</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.shadow.response_time_ms || '?'}ms</span></div>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{shadowBodyRaw}</pre>
                </GlassCard>
            </div>

            {/* Diff Viewer Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>JSON Diff</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isDiffExpanded && <><button className={`pill ${splitView ? 'active' : ''}`} onClick={() => setSplitView(!splitView)}>{splitView ? 'Side-by-Side' : 'Unified'}</button><button className={`pill ${showDiffOnly ? 'active' : ''}`} onClick={() => setShowDiffOnly(!showDiffOnly)}>{showDiffOnly ? 'Changes Only' : 'Full'}</button></>}
                    <button className="btn btn-secondary" onClick={() => setIsDiffExpanded(!isDiffExpanded)} style={{ fontSize: 12 }}>{isDiffExpanded ? 'Hide Diff' : 'Show Full Diff'} <motion.span animate={{ rotate: isDiffExpanded ? 180 : 0 }} style={{ display: 'inline-block', marginLeft: 4 }}>&#9660;</motion.span></button>
                </div>
            </div>

            {isDiffExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {(bodiesEmpty || bodiesIdentical) && hasFieldDiffs && <div style={{ padding: '8px 16px', marginBottom: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--amber)', fontSize: 12 }}>Response bodies not stored &mdash; showing reconstructed diff.</div>}
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <ReactDiffViewer oldValue={prodBodyRaw} newValue={shadowBodyRaw} splitView={splitView} leftTitle="Production (v1)" rightTitle="Shadow (v2)" useDarkTheme={true} showDiffOnly={false} extraLinesSurroundingDiff={showDiffOnly ? 3 : undefined} styles={{ variables: { dark: { diffViewerBackground: '#0c0c0f', diffViewerColor: '#f4f4f5', addedBackground: 'rgba(34,197,94,0.12)', addedColor: '#fff', removedBackground: 'rgba(239,68,68,0.12)', removedColor: '#fff', wordAddedBackground: 'rgba(34,197,94,0.35)', wordRemovedBackground: 'rgba(239,68,68,0.35)', addedGutterBackground: 'rgba(34,197,94,0.05)', removedGutterBackground: 'rgba(239,68,68,0.05)', gutterBackground: '#09090b', gutterBackgroundDark: '#09090b', emptyLineBackground: 'transparent', diffViewerTitleBackground: '#111116', diffViewerTitleColor: '#a1a1aa', diffViewerTitleBorderColor: 'rgba(255,255,255,0.06)' } } }} />
                    </div>
                    {hasFieldDiffs && (
                        <GlassCard style={{ marginTop: 16 }}>
                            <div className="card-header"><span className="card-title">Field Differences</span></div>
                            <table className="data-table"><thead><tr><th>Path</th><th>Type</th><th>Production</th><th>Shadow</th></tr></thead><tbody>
                                {comp.field_diffs.map((diff: any, idx: number) => (<tr key={idx}><td className="mono" style={{ fontSize: 12 }}>{diff.path}</td><td><span className={`diff-badge diff-${diff.diff_type === 'ADDED' ? 'success' : diff.diff_type === 'REMOVED' ? 'danger' : 'warning'}`}>{diff.diff_type}</span></td><td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(diff.prod_value)}</td><td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(diff.shadow_value)}</td></tr>))}
                            </tbody></table>
                        </GlassCard>
                    )}
                </motion.div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" onClick={() => navigate('/endpoints')}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Back to Analysis</button>
                <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary" onClick={handlePdfExport}>Export PDF</button><button className="btn btn-outline" disabled style={{ opacity: 0.5 }}>Mark as Reviewed</button></div>
            </div>
        </motion.div>
    );
}
