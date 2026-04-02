import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { listComparisons, getEndpointTags, createEndpointTag, deleteEndpointTag } from '../services/api';
import { exportEndpointAnalysisCsv } from '../utils/exportCsv';
import { exportEndpointAnalysisPdf } from '../utils/exportPdf';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import MethodBadge from '../components/ui/MethodBadge';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

export default function EndpointAnalysisPage() {
    const navigate = useNavigate();
    const [comparisons, setComparisons] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    const [endpointFilter, setEndpointFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('7d');
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
                const params: any = { size: pageSize, page, timeRange };
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
                console.error('Failed to fetch comparisons', err);
                if (isMounted) setIsLoaded(true);
            }
        };
        const timeoutId = setTimeout(fetchComparisons, 300);
        return () => { isMounted = false; clearTimeout(timeoutId); };
    }, [endpointFilter, severityFilter, timeRange, page]);

    const filteredComparisons = tagFilter ? comparisons.filter(item => item.endpoint?.includes(tagFilter)) : comparisons;

    const getScoreColor = (s: number) => s <= 3 ? 'var(--green)' : s <= 6 ? 'var(--amber)' : 'var(--red)';

    const timeAgo = (ts: string) => {
        if (!ts) return 'N/A';
        const diff = Date.now() - new Date(ts).getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    const totalPages = Math.ceil(totalResults / pageSize);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <PageHeader
                title="Endpoint Analysis"
                description="Filter and analyze live API endpoint comparison results"
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={() => { if (comparisons.length > 0) exportEndpointAnalysisCsv({ comparisons, filters: { endpoint: endpointFilter, severity: severityFilter, timeRange }, totalResults }, 'endpoint-analysis.csv'); }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5L6 8.5 9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            CSV
                        </button>
                        <button className="btn btn-secondary" onClick={() => { if (comparisons.length > 0) exportEndpointAnalysisPdf({ comparisons, filters: { endpoint: endpointFilter, severity: severityFilter, timeRange }, totalResults }, 'endpoint-analysis.pdf'); }}>PDF</button>
                    </div>
                }
            />

            {/* Tags */}
            {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tags:</span>
                    <button className={`tag-chip ${tagFilter === '' ? 'active' : ''}`} onClick={() => setTagFilter('')}>All</button>
                    {tags.map((t: any) => (
                        <button key={t.id} className={`tag-chip ${tagFilter === t.endpoint_pattern ? 'active' : ''}`} onClick={() => setTagFilter(t.endpoint_pattern)} style={tagFilter === t.endpoint_pattern ? { background: t.color, borderColor: t.color } : { borderColor: t.color + '60' }}>{t.tag}</button>
                    ))}
                    <button className="tag-chip" onClick={() => setShowTagModal(true)} style={{ borderStyle: 'dashed' }}>+ Manage</button>
                </div>
            )}

            <div className="data-table-container">
                <div className="table-header">
                    <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Comparison Results</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                            {isLoaded ? `${filteredComparisons.length} of ${totalResults}` : 'Loading...'}
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="table-filters">
                    <SearchInput value={endpointFilter} onChange={setEndpointFilter} placeholder="Filter by endpoint..." style={{ minWidth: 220 }} />
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
                        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setEndpointFilter(''); setSeverityFilter('all'); setTagFilter(''); }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            Clear
                        </button>
                    )}
                </div>

                {/* Table */}
                <table className="data-table" style={{ opacity: isLoaded ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Method</th>
                            <th>Status Match</th>
                            <th>Body Match</th>
                            <th>Severity</th>
                            <th>Risk</th>
                            <th>Latency</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComparisons.length === 0 && isLoaded ? (
                            <tr><td colSpan={8}>
                                <EmptyState
                                    icon={<svg width="24" height="24" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="var(--accent)" strokeWidth="1.5" fill="none"/><path d="M11 11L14 14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                                    title="No comparisons found"
                                    description="Adjust your filters or wait for traffic to flow through the proxy."
                                />
                            </td></tr>
                        ) : filteredComparisons.map(item => {
                            const latency = item.latency_delta_ms || 0;
                            const risk = item.risk_score || 0;
                            const sim = item.similarity_score !== undefined ? item.similarity_score : 1.0;
                            return (
                                <tr key={item.request_id || item.requestId} onClick={() => navigate(`/comparison/${item.request_id || item.requestId}`)}>
                                    <td>
                                        <span className="mono" style={{ fontSize: 12 }}>{item.endpoint}</span>
                                        {tags.filter((t: any) => item.endpoint?.includes(t.endpoint_pattern)).map((t: any) => (
                                            <span key={t.id} style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 10, fontSize: 9, background: t.color, color: '#fff' }}>{t.tag}</span>
                                        ))}
                                    </td>
                                    <td><MethodBadge method={item.method || 'GET'} /></td>
                                    <td>{item.status_match !== false ? <span style={{ color: 'var(--green)' }}>&#10003;</span> : <span style={{ color: 'var(--red)' }}>&#10007;</span>}</td>
                                    <td>{item.body_match !== false ? <span style={{ color: 'var(--green)' }}>&#10003;</span> : <span style={{ color: 'var(--red)' }}>&#10007;</span>}</td>
                                    <td><SeverityBadge severity={item.severity || 'none'} /></td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: getScoreColor(risk), fontSize: 13 }}>{Number(risk).toFixed(1)}</span>
                                        <div className="score-bar"><div className="score-bar-fill" style={{ width: `${risk * 10}%`, background: getScoreColor(risk) }} /></div>
                                    </td>
                                    <td style={{ color: latency > 50 ? 'var(--red)' : latency > 20 ? 'var(--amber)' : 'var(--text-muted)', fontSize: 12 }}>+{latency}ms</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(item.timestamp || item.created_at)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalResults)} of {totalResults}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ fontSize: 12 }}>Prev</button>
                            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                                <button key={i} className={`pill ${page === i ? 'active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
                            ))}
                            <button className="btn btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} style={{ fontSize: 12 }}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tag Management Modal */}
            <AnimatePresence>
                {showTagModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTagModal(false)}>
                        <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Manage Endpoint Tags</h3>
                                <button className="btn btn-ghost" onClick={() => setShowTagModal(false)} aria-label="Close">
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                <input className="input" placeholder="Pattern" value={newTagPattern} onChange={e => setNewTagPattern(e.target.value)} style={{ flex: 2 }} />
                                <input className="input" placeholder="Tag name" value={newTagName} onChange={e => setNewTagName(e.target.value)} style={{ flex: 1 }} />
                                <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'transparent' }} />
                                <button className="btn btn-primary" style={{ padding: '8px 14px' }} onClick={async () => {
                                    if (!newTagPattern || !newTagName) return;
                                    await createEndpointTag(newTagPattern, newTagName, newTagColor);
                                    setTags(await getEndpointTags());
                                    setNewTagPattern(''); setNewTagName(''); setNewTagColor('#6366f1');
                                }}>Add</button>
                            </div>
                            {tags.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No tags yet</p> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {tags.map((t: any) => (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                                            <span style={{ flex: 1, fontSize: 13 }}>{t.tag}</span>
                                            <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.endpoint_pattern}</span>
                                            <button className="btn btn-danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={async () => {
                                                await deleteEndpointTag(t.id);
                                                setTags(tags.filter((tag: any) => tag.id !== t.id));
                                            }}>Delete</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
