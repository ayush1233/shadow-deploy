import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { configureProxy, getMetricsSummary, getRiskTrend, listComparisons } from '../services/api';
import { exportOverviewCsv } from '../utils/exportCsv';
import { exportOverviewPdf } from '../utils/exportPdf';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import RiskGauge from '../components/ui/RiskGauge';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import MethodBadge from '../components/ui/MethodBadge';
import { PageSkeleton } from '../components/ui/SkeletonLoader';
import TrendChart from '../components/charts/TrendChart';
import SeverityDonut from '../components/charts/SeverityDonut';
import LatencyBar from '../components/charts/LatencyBar';
import { useToast } from '../components/ui/Toast';

export default function OverviewPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isLoaded, setIsLoaded] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [recentComparisons, setRecentComparisons] = useState<any[]>([]);
    const [configPrompt, setConfigPrompt] = useState('');
    const [configStatus, setConfigStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [configMessage, setConfigMessage] = useState('');
    const [trendRange, setTrendRange] = useState(7);
    const [showExport, setShowExport] = useState(false);

    const handleConfigure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configPrompt.trim()) return;
        setConfigStatus('loading');
        try {
            const { data } = await configureProxy(configPrompt);
            setConfigStatus('success');
            setConfigMessage(data.message);
            setConfigPrompt('');
            addToast('success', 'Configuration applied successfully');
        } catch (error: any) {
            setConfigStatus('error');
            setConfigMessage(error.response?.data?.detail || error.message || 'Configuration failed');
            addToast('error', 'Configuration failed');
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [summaryRes, trendRes, recentRes] = await Promise.all([
                    getMetricsSummary(),
                    getRiskTrend(trendRange),
                    listComparisons({ size: 5 }),
                ]);
                setMetrics(summaryRes.data);
                setTrendData(trendRes);
                setRecentComparisons(recentRes.data.data || []);
                setIsLoaded(true);
            } catch (err: any) {
                console.error('Failed to fetch metrics', err);
                setIsLoaded(true);
            }
        };
        fetchAll();
    }, [trendRange]);

    if (!isLoaded) return <PageSkeleton />;

    if (!metrics) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="3" height="7" rx="1" fill="var(--accent)"/><rect x="6" y="5" width="3" height="10" rx="1" fill="var(--accent)" opacity="0.6"/><rect x="11" y="2" width="3" height="13" rx="1" fill="var(--accent)" opacity="0.3"/></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>No data available yet</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Start sending traffic through the proxy to see metrics here.</p>
            </motion.div>
        );
    }

    const riskScore = metrics.overview.deployment_risk_score;
    const getRiskVerdict = (s: number) => {
        if (s <= 3) return { text: 'Safe to Deploy', color: 'var(--green)' };
        if (s <= 6) return { text: 'Review Recommended', color: 'var(--amber)' };
        return { text: 'High Risk \u2014 Do Not Deploy', color: 'var(--red)' };
    };
    const verdict = getRiskVerdict(riskScore);
    const severityData = [
        { name: 'Low', value: metrics.severity_breakdown.low, color: '#60a5fa' },
        { name: 'Medium', value: metrics.severity_breakdown.medium, color: '#f59e0b' },
        { name: 'High', value: metrics.severity_breakdown.high, color: '#fb923c' },
        { name: 'Critical', value: metrics.severity_breakdown.critical, color: '#ef4444' },
    ];
    const latencyData = Object.entries(metrics.top_endpoints).map(([endpoint, data]: any) => ({
        endpoint: endpoint.length > 20 ? '...' + endpoint.slice(-18) : endpoint,
        prod: Math.round(data.avg_prod_latency || 0),
        shadow: Math.round(data.avg_shadow_latency || 0),
    }));
    const formatNum = (num: number) => num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
    const exportData = { metrics, trendData, recentComparisons, severityData, latencyData, trendRange };
    const handleExportCsv = () => { if (metrics) exportOverviewCsv(exportData, 'shadow-dashboard-report.csv'); };
    const handleExportPdf = () => { if (metrics) exportOverviewPdf(exportData, 'shadow-dashboard-report.pdf'); };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <PageHeader
                title="Dashboard"
                description={`Live shadow API validation metrics \u2014 ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                actions={
                    <div className="pill-group">
                        {[{ label: '7d', value: 7 }, { label: '14d', value: 14 }, { label: '30d', value: 30 }].map(opt => (
                            <button key={opt.value} className={`pill ${trendRange === opt.value ? 'active' : ''}`} onClick={() => setTrendRange(opt.value)}>{opt.label}</button>
                        ))}
                    </div>
                }
            />

            {/* KPI Strip */}
            <div className="stats-grid">
                <StatCard icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2v12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 10l3-4 3 2 3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} label="Total Requests" value={metrics.overview.total_requests} formatFn={formatNum} trend="Active mirroring" trendType="positive" color="#60a5fa" delay={0} />
                <StatCard icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} label="Mismatch Rate" value={Number(metrics.overview.mismatch_rate_percent)} decimals={1} suffix="%" trend={`${metrics.overview.total_mismatches} total`} trendType={Number(metrics.overview.mismatch_rate_percent) > 10 ? 'negative' : 'positive'} color="#f59e0b" delay={0.05} />
                <StatCard icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5l2-5z" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>} label="Risk Score" value={riskScore} decimals={1} suffix="/10" trend={verdict.text} trendType={riskScore <= 3 ? 'positive' : riskScore <= 6 ? 'neutral' : 'negative'} color={verdict.color} delay={0.1} />
                <StatCard icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8h3l2-5 3 10 2-5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} label="Avg Latency Delta" value={metrics.latency.p50_delta_ms} prefix="+" suffix="ms" trend={`P95: ${metrics.latency.p95_delta_ms}ms`} trendType="neutral" color="#06b6d4" delay={0.15} />
            </div>

            {/* Risk Score Hero */}
            <GlassCard style={{ marginBottom: 24 }} delay={0.2}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
                    <RiskGauge score={riskScore} size={160} />
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 600, color: verdict.color, marginBottom: 8 }}>{verdict.text}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                            {riskScore <= 3 ? 'All comparisons are within acceptable thresholds. Your shadow deployment matches production behavior closely.'
                                : riskScore <= 6 ? 'Some mismatches detected. Review the endpoint analysis for details before promoting.'
                                : 'Significant behavioral differences detected. Manual review required before deployment.'}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => navigate('/endpoints')}>View Details <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
                            <div style={{ position: 'relative' }}>
                                <button className="btn btn-secondary" onClick={() => setShowExport(!showExport)}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5L6 8.5 9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> Export
                                </button>
                                <AnimatePresence>{showExport && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4, zIndex: 10, minWidth: 120 }}>
                                        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }} onClick={() => { handleExportCsv(); setShowExport(false); }}>CSV</button>
                                        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }} onClick={() => { handleExportPdf(); setShowExport(false); }}>PDF</button>
                                    </motion.div>
                                )}</AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Charts */}
            <div className="charts-grid">
                <GlassCard delay={0.25}><div className="card-header"><span className="card-title">Risk & Pass Rate Trend</span></div>{trendData.length > 0 ? <TrendChart data={trendData} /> : <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No trend data yet</div>}</GlassCard>
                <GlassCard delay={0.3}><div className="card-header"><span className="card-title">Severity Distribution</span></div><SeverityDonut data={severityData} /></GlassCard>
            </div>

            {latencyData.length > 0 && (<GlassCard style={{ marginBottom: 24 }} delay={0.35}><div className="card-header"><span className="card-title">Latency Comparison</span></div><LatencyBar data={latencyData} /></GlassCard>)}

            {/* AI Configurator */}
            <GlassCard style={{ marginBottom: 24, borderColor: 'rgba(99,102,241,0.2)' }} delay={0.4}>
                <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1z" fill="var(--accent)"/><path d="M12 9l.75 1.75L14.5 11.5l-1.75.75L12 14l-.75-1.75L9.5 11.5l1.75-.75L12 9z" fill="var(--accent)" opacity="0.5"/></svg>
                        AI Configurator
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by Gemini</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>Describe your proxy configuration in plain English:</p>
                <form onSubmit={handleConfigure} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <input className="input" type="text" value={configPrompt} onChange={e => setConfigPrompt(e.target.value)} placeholder="e.g., Mirror 50% of /api/users traffic to shadow v2..." disabled={configStatus === 'loading'} />
                        {configMessage && <p style={{ marginTop: 8, fontSize: 12, color: configStatus === 'error' ? 'var(--red)' : 'var(--green)' }}>{configMessage}</p>}
                    </div>
                    <button type="submit" disabled={configStatus === 'loading' || !configPrompt.trim()} className="btn btn-primary" style={{ padding: '10px 20px' }}>{configStatus === 'loading' ? 'Applying...' : 'Apply'}</button>
                </form>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {['Route 50% traffic to shadow', 'Add /api/v2 as shadow upstream', 'Enable request logging'].map(chip => (
                        <button key={chip} className="tag-chip" onClick={() => setConfigPrompt(chip)} style={{ fontSize: 11 }}>{chip}</button>
                    ))}
                </div>
            </GlassCard>

            {/* Recent Comparisons */}
            {recentComparisons.length > 0 && (
                <GlassCard delay={0.45}>
                    <div className="card-header"><span className="card-title">Recent Comparisons</span><button className="btn btn-ghost" onClick={() => navigate('/endpoints')} style={{ fontSize: 12 }}>View All</button></div>
                    <table className="data-table">
                        <thead><tr><th>Endpoint</th><th>Status</th><th>Severity</th><th>Time</th></tr></thead>
                        <tbody>
                            {recentComparisons.slice(0, 5).map((item: any) => (
                                <tr key={item.request_id} onClick={() => navigate(`/comparison/${item.request_id}`)}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MethodBadge method={item.method || 'GET'} /><span className="mono" style={{ fontSize: 12 }}>{item.endpoint}</span></td>
                                    <td>{item.status_match !== false ? <span style={{ color: 'var(--green)' }}>Match</span> : <span style={{ color: 'var(--red)' }}>Mismatch</span>}</td>
                                    <td><SeverityBadge severity={item.severity || 'none'} /></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(item.timestamp || item.created_at) ? new Date(item.timestamp || item.created_at).toLocaleTimeString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>
            )}
        </motion.div>
    );
}
