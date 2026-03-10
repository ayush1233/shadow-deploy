import { useState } from 'react';
import { runWebsiteTest } from '../services/api';

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
        if (score <= 3) return 'var(--accent-green)';
        if (score <= 6) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    const stats = results.length > 0 ? {
        total: results.length,
        passRate: Math.round((results.filter(r => r.risk_score <= 3).length / results.length) * 100),
        avgRisk: (results.reduce((acc, curr) => acc + curr.risk_score, 0) / results.length).toFixed(1),
        highestRisk: results.reduce((prev, curr) => (prev.risk_score > curr.risk_score) ? prev : curr).path
    } : null;

    return (
        <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <h2>🌐 Website Testing Mode</h2>
                <p>Compare production and shadow environments directly via URLs</p>
            </div>

            {stats && (
                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card blue">
                        <div className="stat-label">Total Tests</div>
                        <div className="stat-value blue">{stats.total}</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-label">Pass Rate</div>
                        <div className="stat-value green">{stats.passRate}%</div>
                    </div>
                    <div className="stat-card yellow">
                        <div className="stat-label">Avg Risk Score</div>
                        <div className="stat-value yellow">{stats.avgRisk}</div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-label">Highest Risk Endpoint</div>
                        <div className="stat-value red" style={{ fontSize: 16, marginTop: 12 }}>{stats.highestRisk}</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '24px', marginBottom: 32 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Production Base URL</label>
                        <input type="text" className="ai-input" value={prodUrl} onChange={e => setProdUrl(e.target.value)} disabled={isTesting} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Shadow Base URL</label>
                        <input type="text" className="ai-input" value={shadowUrl} onChange={e => setShadowUrl(e.target.value)} disabled={isTesting} />
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Paths to Test</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        {paths.map(path => (
                            <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-body)', padding: '6px 12px', borderRadius: 16, fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{path}</span>
                                <button onClick={() => handleRemovePath(path)} disabled={isTesting} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <input type="text" className="ai-input" value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="e.g., /api/users" disabled={isTesting} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleAddPath()} />
                        <button className="btn" style={{ background: 'var(--bg-body)' }} onClick={handleAddPath} disabled={isTesting || !newPath}>Add Path</button>
                    </div>
                </div>

                <button className="btn btn-primary btn-glow" style={{ width: '100%' }} onClick={handleRunTest} disabled={isTesting || paths.length === 0}>
                    {isTesting ? 'Testing...' : 'Run Tests'}
                </button>
                {isTesting && (
                    <div style={{ width: '100%', height: 4, background: 'var(--bg-body)', marginTop: 16, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: '50%', height: '100%', background: 'var(--accent-cyan)', animation: 'pulse 1s infinite alternate' }} />
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Path</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Prod Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Shadow Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Body Match</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Latency Δ</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13 }}>Risk Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-card)' }}>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>
                                        {res.path}
                                        {res.error && (
                                            <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>
                                                {res.prod_error && <div>Prod: {res.prod_error}</div>}
                                                {res.shadow_error && <div>Shadow: {res.shadow_error}</div>}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: res.error ? 'var(--accent-red)' : res.prod_status === 200 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{res.error && res.prod_status === 0 ? 'ERR' : res.prod_status}</td>
                                    <td style={{ padding: '16px 24px', color: res.error ? 'var(--accent-red)' : res.shadow_status === 200 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{res.error && res.shadow_status === 0 ? 'ERR' : res.shadow_status}</td>
                                    <td style={{ padding: '16px 24px', color: res.body_match ? 'var(--accent-green)' : 'var(--accent-red)' }}>{res.error ? '⚠️' : res.body_match ? '✅' : '❌'}</td>
                                    <td style={{ padding: '16px 24px', color: res.latency_delta_ms > 100 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{res.latency_delta_ms > 0 ? '+' : ''}{res.latency_delta_ms}ms</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getRiskColor(res.risk_score) }} />
                                            <span style={{ color: getRiskColor(res.risk_score), fontWeight: 500 }}>{res.risk_score.toFixed(1)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
