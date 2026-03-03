import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listComparisons } from '../services/api';

export default function EndpointAnalysisPage() {
    const navigate = useNavigate();
    const [comparisons, setComparisons] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [totalResults, setTotalResults] = useState(0);

    const [endpointFilter, setEndpointFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('1h');

    useEffect(() => {
        let isMounted = true;

        const fetchComparisons = async () => {
            setIsLoaded(false);
            try {
                // Pass filters to the backend
                const params: any = { size: 100 };
                if (endpointFilter) params.endpoint = endpointFilter;
                if (severityFilter !== 'all') params.severity = severityFilter;

                const { data } = await listComparisons(params);
                if (isMounted) {
                    setComparisons(data.data || []);
                    setTotalResults(data.total || 0);
                    setIsLoaded(true);
                }
            } catch (err: any) {
                console.error("Failed to fetch comparisons", err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
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

    const getScoreBarColor = (score: number) => {
        if (score <= 3) return 'var(--accent-green)';
        if (score <= 6) return 'var(--accent-yellow)';
        return 'var(--accent-red)';
    };

    return (
        <div>
            <div className="page-header">
                <h2>Endpoint Analysis</h2>
                <p>Filter and analyze live API endpoint comparison results</p>
            </div>

            <div className="data-table-container">
                <div className="table-header">
                    <span className="card-title">Comparison Results</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {isLoaded ? `${totalResults} results` : 'Loading...'}
                    </span>
                </div>

                {/* Filters */}
                <div className="table-filters">
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="🔍 Filter by endpoint..."
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
                        {comparisons.length === 0 && isLoaded ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No matching comparisons found.
                                </td>
                            </tr>
                        ) : (
                            comparisons.map(item => {
                                // Fallbacks for backend properties since list API might vary from full detail
                                const statusString = item.status || '200 → 200';
                                const latencyDelta = item.latency_delta_ms || item.latencyDelta || 0;
                                const simScore = item.similarity_score !== undefined ? item.similarity_score : item.similarity || 1.0;
                                const riskScore = item.risk_score || item.riskScore || 0;
                                const severity = item.severity || 'low';

                                return (
                                    <tr key={item.request_id || item.requestId} onClick={() => navigate(`/comparison/${item.request_id || item.requestId}`)}>
                                        <td className="endpoint-cell">{item.endpoint}</td>
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
                                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
