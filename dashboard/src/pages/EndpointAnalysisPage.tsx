import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listComparisons, getEndpointTags, createEndpointTag, deleteEndpointTag } from '../services/api';
import { exportCsv } from '../utils/exportCsv';
import { exportPdf } from '../utils/exportPdf';

export default function EndpointAnalysisPage() {
    const navigate = useNavigate();
    const [comparisons, setComparisons] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [totalResults, setTotalResults] = useState(0);

    const [endpointFilter, setEndpointFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('1h');
    const [tags, setTags] = useState<any[]>([]);
    const [tagFilter, setTagFilter] = useState('');
    const [showTagModal, setShowTagModal] = useState(false);
    const [newTagPattern, setNewTagPattern] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');

    useEffect(() => {
        let isMounted = true;

        const fetchComparisons = async () => {
            setIsLoaded(false);
            try {
                // Pass filters to the backend
                const params: any = { size: 100, timeRange };
                if (endpointFilter) params.endpoint = endpointFilter;
                if (severityFilter !== 'all') params.severity = severityFilter;

                const { data } = await listComparisons(params);
                const tagsData = await getEndpointTags();

                if (isMounted) {
                    setComparisons(data.data || []);
                    setTotalResults(data.total || 0);
                    setTags(tagsData || []);
                    setIsLoaded(true);
                }
            } catch (err: any) {
                console.error("Failed to fetch comparisons", err);
                if (isMounted) setIsLoaded(true);
            }
        };

        // Debounce fetching when typing in endpoint filter
        const timeoutId = setTimeout(() => {
            fetchComparisons();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [endpointFilter, severityFilter, timeRange, navigate]);

    const handleExportCsv = () => {
        if (!comparisons || comparisons.length === 0) return;
        exportCsv(comparisons, 'endpoint-analysis.csv');
    };

    const handleExportPdf = () => {
        if (!comparisons || comparisons.length === 0) return;
        exportPdf(comparisons, 'Endpoint Analysis', 'endpoint-analysis.pdf');
    };

    const getScoreBarColor = (score: number) => {
        if (score <= 3) return 'var(--accent-green)';
        if (score <= 6) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    const filteredComparisons = tagFilter
        ? comparisons.filter(item => item.endpoint?.includes(tagFilter))
        : comparisons;

    return (
        <div>
            <div className="page-header">
                <h2>Endpoint Analysis</h2>
                <p>Filter and analyze live API endpoint comparison results</p>
            </div>

            <div className="data-table-container">
                <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <span className="card-title">Comparison Results</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                            {isLoaded ? `Showing ${filteredComparisons.length} of ${totalResults} results` : 'Loading...'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={handleExportCsv}>⬇ CSV</button>
                        <button className="btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={handleExportPdf}>⬇ PDF</button>
                    </div>
                </div>

                {/* Tag Filter Chips */}
                {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Tags:</span>
                        <button
                            className="btn"
                            onClick={() => setTagFilter('')}
                            style={{ padding: '3px 10px', fontSize: 11, background: tagFilter === '' ? 'var(--accent-purple)' : 'var(--bg-surface)', color: tagFilter === '' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 12 }}
                        >All</button>
                        {tags.map((t: any) => (
                            <button
                                key={t.id}
                                className="btn"
                                onClick={() => setTagFilter(t.endpoint_pattern)}
                                style={{ padding: '3px 10px', fontSize: 11, background: tagFilter === t.endpoint_pattern ? t.color : 'var(--bg-surface)', color: tagFilter === t.endpoint_pattern ? '#fff' : 'var(--text-secondary)', border: `1px solid ${t.color}`, borderRadius: 12 }}
                            >{t.tag}</button>
                        ))}
                        <button className="btn" onClick={() => setShowTagModal(true)} style={{ padding: '3px 10px', fontSize: 11, background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 12, marginLeft: 'auto' }}>
                            + Manage Tags
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="table-filters">
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Filter by endpoint..."
                        value={endpointFilter}
                        onChange={e => setEndpointFilter(e.target.value)}
                        style={{ minWidth: 220 }}
                    />
                    <select className="filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                        <option value="all">All Severities</option>
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                    <select className="filter-select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                        <option value="15m">Last 15 min</option>
                        <option value="1h">Last 1 hour</option>
                        <option value="6h">Last 6 hours</option>
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                    </select>
                    {(endpointFilter || severityFilter !== 'all' || tagFilter) && (
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => { setEndpointFilter(''); setSeverityFilter('all'); setTagFilter(''); }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Table */}
                <table className="data-table" style={{ opacity: isLoaded ? 1 : 0.5, transition: 'opacity 0.2s ease' }}>
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Status (Prod → Shadow)</th>
                            <th>Similarity</th>
                            <th>Latency Δ</th>
                            <th>Risk Score</th>
                            <th>Severity</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComparisons.length === 0 && isLoaded ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No matching comparisons found.
                                </td>
                            </tr>
                        ) : (
                            filteredComparisons.map(item => {
                                // Fallbacks for backend properties since list API might vary from full detail
                                const statusString = item.status || `${item.prod_status_code || 200} → ${item.shadow_status_code || 200}`;
                                const latencyDelta = item.latency_delta_ms || item.latencyDelta || 0;
                                const simScore = item.similarity_score !== undefined ? item.similarity_score : item.similarity || 1.0;
                                const riskScore = item.risk_score || item.riskScore || 0;
                                const severity = item.severity || 'low';

                                return (
                                    <tr key={item.request_id || item.requestId} onClick={() => navigate(`/comparison/${item.request_id || item.requestId}`)}>
                                        <td className="endpoint-cell">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span className={`badge badge-${(item.method || 'GET').toLowerCase()}`}>
                                                    {item.method || 'GET'}
                                                </span>
                                                <span>{item.endpoint}</span>
                                            </div>
                                            {tags.filter(t => item.endpoint.includes(t.endpoint_pattern)).map((t: any) => (
                                                <span key={t.id} style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, fontSize: 10, background: t.color, color: '#fff' }}>
                                                    {t.tag}
                                                </span>
                                            ))}
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{statusString}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: simScore > 0.9 ? 'var(--accent-green)' : simScore > 0.7 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                                                {(simScore * 100).toFixed(0)}%
                                            </span>
                                            <div className="score-bar">
                                                <div className="score-bar-fill" style={{
                                                    width: `${simScore * 100}%`,
                                                    background: simScore > 0.9 ? 'var(--accent-green)' : simScore > 0.7 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                                                }} />
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: latencyDelta > 50 ? 'var(--accent-red)' : latencyDelta > 20 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>
                                                +{latencyDelta}ms
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: getScoreBarColor(riskScore) }}>
                                                {Number(riskScore).toFixed(1)}
                                            </span>
                                            <div className="score-bar">
                                                <div className="score-bar-fill" style={{
                                                    width: `${riskScore * 10}%`,
                                                    background: getScoreBarColor(riskScore)
                                                }} />
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`severity-badge ${severity}`}>
                                                <span className={`severity-dot ${severity}`} />
                                                {severity}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                            {(item.created_at || item.timestamp) ? new Date(item.created_at || item.timestamp).toLocaleTimeString() : 'N/A'}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manage Tags Modal */}
            {showTagModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowTagModal(false)}>
                    <div className="card" style={{ width: 480, maxHeight: '80vh', overflow: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0 }}>Manage Endpoint Tags</h3>
                            <button className="btn" onClick={() => setShowTagModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Add new tag */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                            <input className="filter-input" placeholder="Pattern (e.g. /api/users)" value={newTagPattern} onChange={e => setNewTagPattern(e.target.value)} style={{ flex: 2 }} />
                            <input className="filter-input" placeholder="Tag name" value={newTagName} onChange={e => setNewTagName(e.target.value)} style={{ flex: 1 }} />
                            <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'transparent' }} />
                            <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={async () => {
                                if (!newTagPattern || !newTagName) return;
                                try {
                                    await createEndpointTag(newTagPattern, newTagName, newTagColor);
                                    const updated = await getEndpointTags();
                                    setTags(updated);
                                    setNewTagPattern('');
                                    setNewTagName('');
                                    setNewTagColor('#6366f1');
                                } catch (err) { console.error('Failed to create tag', err); }
                            }}>Add</button>
                        </div>

                        {/* Existing tags */}
                        {tags.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No tags yet. Add one above.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {tags.map((t: any) => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{t.tag}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.endpoint_pattern}</span>
                                        <button className="btn" style={{ padding: '2px 8px', fontSize: 11, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={async () => {
                                            try {
                                                await deleteEndpointTag(t.id);
                                                setTags(tags.filter((tag: any) => tag.id !== t.id));
                                            } catch (err) { console.error('Failed to delete tag', err); }
                                        }}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
