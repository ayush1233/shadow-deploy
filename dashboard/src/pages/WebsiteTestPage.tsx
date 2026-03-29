import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { runWebsiteTest } from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';

export default function WebsiteTestPage() {
    const [prodUrl, setProdUrl] = useState('http://host.docker.internal:3000');
    const [shadowUrl, setShadowUrl] = useState('http://host.docker.internal:4000');
    const [paths, setPaths] = useState<string[]>(['/api/tickets/', '/api/tickets/1/', '/api/tickets/stats/']);
    const [newPath, setNewPath] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const handleAddPath = () => {
        if (newPath.trim() && !paths.includes(newPath.trim())) {
            setPaths([...paths, newPath.trim().startsWith('/') ? newPath.trim() : '/' + newPath.trim()]);
            setNewPath('');
        }
    };

    const handleRemovePath = (pathToRemove: string) => {
        setPaths(paths.filter(p => p !== pathToRemove));
    };

    const handleRunTest = async () => {
        if (paths.length === 0) return;
        setIsTesting(true);
        setResults([]);

        try {
            const { data } = await runWebsiteTest({ production_url: prodUrl, shadow_url: shadowUrl, paths });
            setResults(data);
        } catch (error) {
            console.error('Test failed:', error);
            alert('Test failed. Make sure AI service is running.');
        } finally {
            setIsTesting(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score <= 3) return 'var(--green)';
        if (score <= 6) return 'var(--amber)';
        return 'var(--red)';
    };

    const stats = results.length > 0 ? {
        total: results.length,
        passRate: Math.round((results.filter(r => r.risk_score <= 3).length / results.length) * 100),
        avgRisk: (results.reduce((acc, curr) => acc + curr.risk_score, 0) / results.length).toFixed(1),
        highestRisk: results.reduce((prev, curr) => (prev.risk_score > curr.risk_score) ? prev : curr).path
    } : null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <PageHeader
                title="Website Testing"
                description="Compare production and shadow environments directly via URLs"
            />

            {stats && (
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <StatCard
                        label="Total Tests"
                        value={stats.total}
                        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2v12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                        color="var(--accent)"
                    />
                    <StatCard
                        label="Pass Rate"
                        value={stats.passRate}
                        suffix="%"
                        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-6" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        color="var(--green)"
                    />
                    <StatCard
                        label="Avg Risk Score"
                        value={Number(stats.avgRisk)}
                        decimals={1}
                        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 12v1" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                        color="var(--amber)"
                    />
                    <StatCard
                        label="Highest Risk"
                        value={0}
                        formatFn={() => stats.highestRisk}
                        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 14h14L8 1z" stroke="var(--red)" strokeWidth="1.3" strokeLinejoin="round" fill="none"/></svg>}
                        color="var(--red)"
                    />
                </div>
            )}

            <GlassCard style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div>
                        <label className="input-label">Production Base URL</label>
                        <input type="text" className="input" value={prodUrl} onChange={e => setProdUrl(e.target.value)} disabled={isTesting} />
                    </div>
                    <div>
                        <label className="input-label">Shadow Base URL</label>
                        <input type="text" className="input" value={shadowUrl} onChange={e => setShadowUrl(e.target.value)} disabled={isTesting} />
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label className="input-label">Paths to Test</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <AnimatePresence>
                            {paths.map(path => (
                                <motion.div
                                    key={path}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: 'rgba(99,102,241,0.08)', padding: '5px 12px',
                                        borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-mono)',
                                        border: '1px solid rgba(99,102,241,0.15)',
                                    }}
                                >
                                    <span style={{ color: 'var(--text-secondary)' }}>{path}</span>
                                    <button
                                        onClick={() => handleRemovePath(path)}
                                        disabled={isTesting}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--red)',
                                            cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1,
                                            opacity: isTesting ? 0.4 : 0.7,
                                        }}
                                    >&times;</button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text" className="input" value={newPath}
                            onChange={e => setNewPath(e.target.value)}
                            placeholder="e.g., /api/users"
                            disabled={isTesting}
                            style={{ flex: 1 }}
                            onKeyDown={e => e.key === 'Enter' && handleAddPath()}
                        />
                        <button className="btn btn-secondary" onClick={handleAddPath} disabled={isTesting || !newPath}>Add Path</button>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-glow"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                    onClick={handleRunTest}
                    disabled={isTesting || paths.length === 0}
                >
                    {isTesting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                            Running Tests...
                        </span>
                    ) : 'Run Tests'}
                </button>

                {isTesting && (
                    <div style={{ width: '100%', height: 3, background: 'var(--surface-2)', marginTop: 16, borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 3, ease: 'easeOut' }}
                            style={{ height: '100%', background: 'var(--accent)', borderRadius: 2 }}
                        />
                    </div>
                )}
            </GlassCard>

            {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div className="data-table-container">
                        <div className="table-header">
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Test Results</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{results.length} endpoints tested</span>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Path</th>
                                    <th>Prod Status</th>
                                    <th>Shadow Status</th>
                                    <th>Body Match</th>
                                    <th>Latency Delta</th>
                                    <th>Risk Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td>
                                            <span className="mono" style={{ fontSize: 12 }}>{res.path}</span>
                                            {res.error && (
                                                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                                                    {res.prod_error && <div>Prod: {res.prod_error}</div>}
                                                    {res.shadow_error && <div>Shadow: {res.shadow_error}</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ color: res.error ? 'var(--red)' : res.prod_status === 200 ? 'var(--green)' : 'var(--amber)' }}>
                                            {res.error && res.prod_status === 0 ? 'ERR' : res.prod_status}
                                        </td>
                                        <td style={{ color: res.error ? 'var(--red)' : res.shadow_status === 200 ? 'var(--green)' : 'var(--amber)' }}>
                                            {res.error && res.shadow_status === 0 ? 'ERR' : res.shadow_status}
                                        </td>
                                        <td>
                                            {res.error ? (
                                                <span style={{ color: 'var(--amber)' }}>&#9888;</span>
                                            ) : res.body_match ? (
                                                <span style={{ color: 'var(--green)' }}>&#10003;</span>
                                            ) : (
                                                <span style={{ color: 'var(--red)' }}>&#10007;</span>
                                            )}
                                        </td>
                                        <td style={{ color: res.latency_delta_ms > 100 ? 'var(--red)' : 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                                            {res.latency_delta_ms > 0 ? '+' : ''}{res.latency_delta_ms}ms
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: getRiskColor(res.risk_score) }} />
                                                <span style={{ color: getRiskColor(res.risk_score), fontWeight: 600, fontSize: 13 }}>{res.risk_score.toFixed(1)}</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
