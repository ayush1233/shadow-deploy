import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { configureProxy, getMetricsSummary, getRiskTrend } from '../services/api';
import { exportCsv } from '../utils/exportCsv';
import { exportPdf } from '../utils/exportPdf';

export default function OverviewPage() {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const [metrics, setMetrics] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);

    // AI Configurator State
    const [configPrompt, setConfigPrompt] = useState('');
    const [configStatus, setConfigStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [configMessage, setConfigMessage] = useState('');
    const [trendRange, setTrendRange] = useState(7);

    const handleConfigure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configPrompt.trim()) return;

        setConfigStatus('loading');
        try {
            const { data } = await configureProxy(configPrompt);
            setConfigStatus('success');
            setConfigMessage(data.message);
            setConfigPrompt('');
        } catch (error: any) {
            setConfigStatus('error');
            setConfigMessage(error.response?.data?.detail || error.message || 'Configuration failed');
        }
    };

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const [summaryRes, trendRes] = await Promise.all([
                    getMetricsSummary(),
                    getRiskTrend(trendRange)
                ]);
                setMetrics(summaryRes.data);
                setTrendData(trendRes);
                setIsLoaded(true);
            } catch (err: any) {
                console.error("Failed to fetch metrics", err);
                setIsLoaded(true); // show empty state instead of infinite loading
            }
        };
        fetchMetrics();
    }, [navigate, trendRange]);

    const handleExportCsv = () => {
        if (!trendData || trendData.length === 0) return;
        exportCsv(trendData, 'shadow-risk-trend.csv');
    };

    const handleExportPdf = () => {
        if (!trendData || trendData.length === 0) return;
        exportPdf(trendData, '7-Day Risk & Pass Rate Trend', 'shadow-risk-trend.pdf');
    };

    if (!isLoaded || !metrics) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading live metrics...</div>
            </div>
        );
    }

    const formatNum = (num: number) => num > 1000 ? (num / 1000).toFixed(1) + 'K' : num;

    const riskScore = metrics.overview.deployment_risk_score;

    const getRiskColor = (score: number) => {
        if (score <= 3) return 'var(--accent-green)';
        if (score <= 6) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    const getRiskStatus = (score: number) => {
        if (score <= 3) return { text: 'Safe to Deploy', cls: 'safe' };
        if (score <= 6) return { text: 'Review Required', cls: 'warning' };
        return { text: 'Deployment Blocked', cls: 'danger' };
    };

    const status = getRiskStatus(riskScore);

    // Map Backend Data to Charts
    const severityData = [
        { name: 'Low', value: metrics.severity_breakdown.low, color: 'var(--accent-blue)' },
        { name: 'Medium', value: metrics.severity_breakdown.medium, color: 'var(--accent-yellow)' },
        { name: 'High', value: metrics.severity_breakdown.high, color: 'var(--accent-orange)' },
        { name: 'Critical', value: metrics.severity_breakdown.critical, color: 'var(--accent-red)' },
    ];

    const endpointMismatchData = Object.entries(metrics.top_endpoints).map(([endpoint, data]: any) => ({
        endpoint,
        mismatches: data.mismatches,
        total: data.requests
    })).sort((a, b) => b.mismatches - a.mismatches);

    // Build latency comparison from real comparison data
    const latencyData = Object.entries(metrics.top_endpoints).map(([endpoint, data]: any) => ({
        endpoint: endpoint.length > 20 ? '...' + endpoint.slice(-18) : endpoint,
        prod: Math.round(data.avg_prod_latency || 0),
        shadow: Math.round(data.avg_shadow_latency || 0),
    }));

    return (
        <div style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Deployment Overview</h2>
                    <p>Live Shadow API validation metrics</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={handleExportCsv}>⬇ CSV Report</button>
                    <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={handleExportPdf}>⬇ PDF Report</button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-label">Total Requests</div>
                    <div className="stat-value blue">{formatNum(metrics.overview.total_requests)}</div>
                    <div className="stat-change positive">Active traffic mirroring</div>
                </div>

                <div className="stat-card green">
                    <div className="stat-label">Comparisons</div>
                    <div className="stat-value green">{formatNum(metrics.overview.total_comparisons)}</div>
                    <div className="stat-change positive">{((metrics.overview.total_comparisons / metrics.overview.total_requests) * 100).toFixed(1)}% coverage</div>
                </div>

                <div className="stat-card yellow">
                    <div className="stat-label">Mismatches</div>
                    <div className="stat-value yellow">{formatNum(metrics.overview.total_mismatches)}</div>
                    <div className="stat-change neutral">Pending review</div>
                </div>

                <div className="stat-card red">
                    <div className="stat-label">Critical</div>
                    <div className="stat-value red">{metrics.severity_breakdown.critical}</div>
                    <div className="stat-change negative">Requires attention</div>
                </div>

                <div className="stat-card purple">
                    <div className="stat-label">Mismatch Rate</div>
                    <div className="stat-value purple">{metrics.overview.mismatch_rate_percent}%</div>
                    <div className="stat-change positive">Healthy threshold</div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-label">Avg Latency Δ</div>
                    <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>+{metrics.latency.p50_delta_ms}ms</div>
                    <div className="stat-change positive">Within threshold</div>
                </div>
            </div>

            {/* Risk Score + Latency Chart */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Deployment Risk Score</span>
                        <span className={`risk-status ${status.cls}`}>{status.text}</span>
                    </div>
                    <div className="risk-gauge-container">
                        <div className="risk-gauge-value" style={{ color: getRiskColor(riskScore) }}>
                            {riskScore.toFixed(1)}
                        </div>
                        <div className="risk-gauge-label">out of 10.0</div>
                        <div style={{ width: '100%', height: 12, background: 'var(--bg-surface)', borderRadius: 6, marginTop: 16, overflow: 'hidden' }}>
                            <div style={{
                                width: `${riskScore * 10}%`,
                                height: '100%',
                                background: riskScore <= 3 ? 'var(--gradient-risk-low)' : riskScore <= 6 ? 'var(--gradient-risk-med)' : 'var(--gradient-risk-high)',
                                borderRadius: 6,
                                transition: 'width 1s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
                            <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>Safe</span>
                            <span style={{ fontSize: 10, color: 'var(--accent-yellow)' }}>Review</span>
                            <span style={{ fontSize: 10, color: 'var(--accent-red)' }}>Blocked</span>
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Latency Comparison</span>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={latencyData}>
                            <defs>
                                <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradShadow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="endpoint" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} unit="ms" tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#ededed' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                            <Area type="monotone" dataKey="prod" stroke="#34d399" fill="url(#gradProd)"
                                name="Production" strokeWidth={2} activeDot={{ r: 4, fill: '#34d399', stroke: '#000' }} />
                            <Area type="monotone" dataKey="shadow" stroke="#a78bfa" fill="url(#gradShadow)"
                                name="Shadow" strokeWidth={2} activeDot={{ r: 4, fill: '#a78bfa', stroke: '#000' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Severity Distribution + Top Endpoints */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Severity Distribution</span>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={severityData} cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                                dataKey="value" paddingAngle={4} stroke="none">
                                {severityData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#ededed' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Top Mismatched Endpoints</span>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={endpointMismatchData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="endpoint" stroke="#71717a" fontSize={10} width={120} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#ededed' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <Bar dataKey="mismatches" fill="var(--accent-orange)" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Trend Chart */}
            {trendData && trendData.length > 0 && (
                <div className="charts-grid" style={{ gridTemplateColumns: '1fr', marginBottom: 24 }}>
                    <div className="chart-card glow-border" style={{ position: 'relative' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="card-title">Risk vs Pass Rate Trend</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[
                                    { label: '24h', value: 1 },
                                    { label: '7d', value: 7 },
                                    { label: '30d', value: 30 },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        className="btn"
                                        onClick={() => setTrendRange(opt.value)}
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: 12,
                                            background: trendRange === opt.value ? 'var(--accent-purple)' : 'var(--bg-surface)',
                                            color: trendRange === opt.value ? '#fff' : 'var(--text-secondary)',
                                            border: trendRange === opt.value ? 'none' : '1px solid var(--border-color)',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={10} unit="%" tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                                <Area yAxisId="left" type="monotone" dataKey="avg_risk" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRisk)" name="Avg Risk Score" strokeWidth={2} />
                                <Area yAxisId="right" type="monotone" dataKey="pass_rate" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPass)" name="Pass Rate" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* AI Configurator */}
            <div className="chart-card" style={{ marginBottom: 24, border: '1px solid var(--accent-purple)' }}>
                <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ Dynamic AI Configurator
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Powered by Gemini
                    </span>
                </div>
                <div style={{ padding: '4px 0' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                        Type a natural language instruction to automatically reconfigure routing and mirror traffic:
                    </p>
                    <form onSubmit={handleConfigure} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={configPrompt}
                                onChange={e => setConfigPrompt(e.target.value)}
                                placeholder="e.g., Route production traffic to port 3000 and mirror shadow traffic to port 4000"
                                className="ai-input"
                                disabled={configStatus === 'loading'}
                            />
                            {configMessage && (
                                <p style={{
                                    marginTop: '8px',
                                    fontSize: '13px',
                                    color: configStatus === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'
                                }}>
                                    {configStatus === 'error' ? '❌' : '✅'} {configMessage}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={configStatus === 'loading' || !configPrompt.trim()}
                            className="btn btn-primary btn-glow"
                            style={{ padding: '10px 20px' }}
                        >
                            {configStatus === 'loading' ? 'Applying...' : 'Apply Config'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
