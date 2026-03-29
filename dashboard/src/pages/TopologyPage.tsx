import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import topoConfig from '../topology-config.json';
import { useMouseParallax } from '../hooks/useMouseParallax';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';

// ── Types ──
interface ServiceNode {
    id: string; label: string; port: number; icon: string; type: string;
    desc: string; x: number; y: number;
}
interface Connection {
    from: string; to: string; label: string; type: string;
}

// ── Colors ──
const lineColors: Record<string, string> = {
    primary: '#10b981', mirror: '#f59e0b', async: '#6366f1', data: '#8b5cf6',
};
const nodeStyles: Record<string, { bg: string; border: string; glow: string }> = {
    client: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.5)', glow: '0 0 20px rgba(99,102,241,0.2)' },
    proxy: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)', glow: '0 0 20px rgba(245,158,11,0.2)' },
    production: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.5)', glow: '0 0 20px rgba(16,185,129,0.2)' },
    shadow: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)', glow: '0 0 20px rgba(245,158,11,0.2)' },
    infra: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.5)', glow: '0 0 20px rgba(139,92,246,0.2)' },
    engine: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.5)', glow: '0 0 20px rgba(236,72,153,0.2)' },
    ai: { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.5)', glow: '0 0 20px rgba(14,165,233,0.2)' },
    database: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.5)', glow: '0 0 20px rgba(16,185,129,0.2)' },
    dashboard: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.5)', glow: '0 0 20px rgba(99,102,241,0.2)' },
    monitoring: { bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.5)', glow: '0 0 20px rgba(34,211,238,0.2)' },
    cache: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.5)', glow: '0 0 20px rgba(251,146,60,0.2)' },
};
const fallback = { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.4)', glow: 'none' };

// ── SVG helpers ──
const ctr = (n: ServiceNode) => ({ x: n.x + 80, y: n.y + 35 });
const curve = (a: ServiceNode, b: ServiceNode) => {
    const s = ctr(a), e = ctr(b), dx = e.x - s.x;
    return `M ${s.x} ${s.y} C ${s.x + dx * 0.5} ${s.y}, ${e.x - dx * 0.5} ${e.y}, ${e.x} ${e.y}`;
};

// ═════════════════════════════════════════════════
// Build the architecture from extracted config
// ═════════════════════════════════════════════════
const nodes: ServiceNode[] = [
    { id: 'client', label: 'User Browser', port: 0, icon: '🌐', type: 'client', desc: 'End users making requests', x: 40, y: 180 },
    { id: 'nginx', label: 'NGINX Proxy', port: topoConfig.proxyPort, icon: '🔀', type: 'proxy', desc: 'Reverse proxy & traffic mirror', x: 350, y: 180 },
    { id: 'prod', label: 'Production (v1)', port: topoConfig.prodPort, icon: '🟢', type: 'production', desc: 'Stable version users interact with', x: 700, y: 50 },
    { id: 'shadow', label: 'Shadow (v2)', port: topoConfig.shadowPort, icon: '👻', type: 'shadow', desc: 'New version being tested', x: 700, y: 310 },
    { id: 'ingestion', label: 'Ingestion Service', port: topoConfig.ingestionPort, icon: '📥', type: 'infra', desc: 'Captures & normalizes traffic', x: 500, y: 470 },
    { id: 'kafka', label: 'Apache Kafka', port: topoConfig.kafkaPort, icon: '📨', type: 'infra', desc: 'Event streaming broker', x: 40, y: 470 },
    { id: 'comparison', label: 'Comparison Engine', port: topoConfig.comparisonPort, icon: '⚖️', type: 'engine', desc: 'Joins & compares v1 vs v2', x: 40, y: 650 },
    { id: 'ai', label: 'AI Service', port: topoConfig.aiServicePort, icon: '🧠', type: 'ai', desc: 'Gemini semantic analysis', x: 420, y: 650 },
    { id: 'supabase', label: 'Supabase DB', port: 5432, icon: '🗄️', type: 'database', desc: 'PostgreSQL + Auth', x: 700, y: 560 },
    { id: 'dashboard', label: 'Dashboard UI', port: topoConfig.dashboardPort, icon: '📊', type: 'dashboard', desc: 'React monitoring dashboard', x: 700, y: 800 },
    { id: 'api', label: 'API Service', port: topoConfig.apiServicePort, icon: '🔌', type: 'infra', desc: 'REST API for dashboard', x: 370, y: 860 },
];

const extraServices: ServiceNode[] = [];
if (topoConfig.services.includes('redis')) {
    extraServices.push({ id: 'redis', label: 'Redis', port: 6379, icon: '⚡', type: 'cache', desc: 'In-memory cache', x: 40, y: 860 });
}

const allNodes = [...nodes, ...extraServices];

const connections: Connection[] = [
    { from: 'client', to: 'nginx', label: 'HTTP Request', type: 'primary' },
    { from: 'nginx', to: 'prod', label: `Forward → :${topoConfig.prodPort}`, type: 'primary' },
    { from: 'nginx', to: 'shadow', label: `Mirror → :${topoConfig.shadowPort}`, type: 'mirror' },
    { from: 'nginx', to: 'ingestion', label: 'Capture responses', type: 'async' },
    { from: 'ingestion', to: 'kafka', label: 'Publish events', type: 'async' },
    { from: 'kafka', to: 'comparison', label: 'Consume streams', type: 'async' },
    { from: 'comparison', to: 'ai', label: 'Analyze mismatches', type: 'data' },
    { from: 'comparison', to: 'supabase', label: 'Store results', type: 'data' },
    { from: 'supabase', to: 'dashboard', label: 'Fetch data', type: 'data' },
    { from: 'api', to: 'supabase', label: 'Query DB', type: 'data' },
];

if (topoConfig.services.includes('redis')) {
    connections.push({ from: 'comparison', to: 'redis', label: 'Cache pairs', type: 'data' });
}

// ═════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════
export default function TopologyPage() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [hoveredConn, setHoveredConn] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    useMouseParallax(containerRef, 3);

    const svgW = 920, svgH = 960;

    const legendItems = [
        { color: lineColors.primary, label: 'Production Traffic', dash: false },
        { color: lineColors.mirror, label: 'Mirror (Shadow) Traffic', dash: true },
        { color: lineColors.async, label: 'Async Event Stream', dash: true },
        { color: lineColors.data, label: 'Data / Query', dash: false },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <PageHeader
                title="System Topology"
                description={<>Architecture auto-detected from <code style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-mono)' }}>nginx.conf</code> and <code style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-mono)' }}>docker-compose.yml</code></>}
            />

            {/* Source info banner */}
            <GlassCard style={{ padding: '14px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Detected <strong style={{ color: 'var(--text-primary)' }}>{topoConfig.services.length} services</strong> from your Docker setup
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 }}>|</span>
                    <span style={{ fontSize: 12, color: '#10b981' }}>
                        Production <strong>:{topoConfig.prodPort}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 }}>|</span>
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>
                        Shadow <strong>:{topoConfig.shadowPort}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 }}>|</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Proxy <strong>:{topoConfig.proxyPort}</strong>
                    </span>
                </div>
            </GlassCard>

            {/* Legend bar */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
                {legendItems.map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 24, height: 3, borderRadius: 2,
                            background: l.dash ? 'transparent' : l.color,
                            ...(l.dash ? { backgroundImage: `repeating-linear-gradient(90deg, ${l.color} 0 6px, transparent 6px 10px)` } : {}),
                        }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                ))}
            </div>

            {/* ── 3D SVG Diagram ── */}
            <div
                ref={containerRef}
                style={{
                    perspective: '1200px',
                    marginBottom: 20,
                }}
            >
                <GlassCard style={{
                    padding: 0, overflow: 'hidden', position: 'relative',
                    transform: 'rotateX(8deg) rotateY(-5deg)',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.3s ease',
                }}>
                    {/* Floating legend panel */}
                    <div style={{
                        position: 'absolute', top: 16, right: 16, zIndex: 10,
                        background: 'rgba(10, 10, 10, 0.92)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        backdropFilter: 'blur(8px)',
                        minWidth: 160,
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Legend</div>
                        {legendItems.map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{
                                    width: 20, height: 2, borderRadius: 1,
                                    background: l.dash ? 'transparent' : l.color,
                                    ...(l.dash ? { backgroundImage: `repeating-linear-gradient(90deg, ${l.color} 0 5px, transparent 5px 8px)` } : {}),
                                    flexShrink: 0,
                                }} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>

                    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block' }}>
                        <defs>
                            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            {connections.map((c, i) => (
                                <marker key={`m${i}`} id={`m${i}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                                    <path d="M0,0 L8,4 L0,8 Z" fill={lineColors[c.type] || '#666'} opacity="0.7" />
                                </marker>
                            ))}
                        </defs>

                        {/* Connections */}
                        {connections.map((conn, i) => {
                            const fromN = allNodes.find(n => n.id === conn.from);
                            const toN = allNodes.find(n => n.id === conn.to);
                            if (!fromN || !toN) return null;
                            const path = curve(fromN, toN);
                            const color = lineColors[conn.type] || '#666';
                            const isH = hoveredConn === i || hoveredNode === conn.from || hoveredNode === conn.to;
                            const op = hoveredNode ? (isH ? 1 : 0.12) : hoveredConn === i ? 1 : 0.5;

                            return (
                                <g key={`c${i}`} onMouseEnter={() => setHoveredConn(i)} onMouseLeave={() => setHoveredConn(null)}
                                    style={{ cursor: 'pointer' }} opacity={op}>
                                    <path d={path} fill="none" stroke={color} strokeWidth={isH ? 3 : 2}
                                        strokeDasharray={conn.type === 'mirror' ? '8,4' : conn.type === 'async' ? '4,4' : 'none'}
                                        markerEnd={`url(#m${i})`} filter={isH ? 'url(#glow)' : undefined}
                                        style={{ transition: 'all 0.3s ease' }} />
                                    <circle r={isH ? 5 : 3.5} fill={color} filter="url(#glow)">
                                        <animateMotion dur={conn.type === 'mirror' ? '2.5s' : '2s'} repeatCount="indefinite" path={path} />
                                    </circle>
                                    {isH && (() => {
                                        const s = ctr(fromN), e = ctr(toN);
                                        const mx = (s.x + e.x) / 2, my = (s.y + e.y) / 2;
                                        const perpX = -(e.y - s.y), perpY = e.x - s.x;
                                        const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                                        const off = 28;
                                        const lx = mx + (perpX / len) * off;
                                        const ly = my + (perpY / len) * off - 4;
                                        return (
                                            <g>
                                                <rect x={lx - conn.label.length * 3.5 - 8} y={ly - 11}
                                                    width={conn.label.length * 7 + 16} height={24} rx={6}
                                                    fill="rgba(0,0,0,0.95)" stroke={color} strokeWidth={1} />
                                                <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fill="#fff"
                                                    fontFamily="var(--font-family)">{conn.label}</text>
                                            </g>
                                        );
                                    })()}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {allNodes.map(node => {
                            const s = nodeStyles[node.type] || fallback;
                            const isH = hoveredNode === node.id;
                            const isRel = hoveredNode
                                ? connections.some(c => (c.from === hoveredNode && c.to === node.id) || (c.to === hoveredNode && c.from === node.id))
                                : false;
                            const dim = hoveredNode && hoveredNode !== node.id && !isRel;

                            return (
                                <g key={node.id}
                                    onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}
                                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    opacity={dim ? 0.12 : 1} transform={isH ? 'translate(0,-4)' : ''}>
                                    {isH && <rect x={node.x - 4} y={node.y - 4} width={168} height={78} rx={14}
                                        fill="none" stroke={s.border} strokeWidth={1.5} opacity={0.5}>
                                        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                                    </rect>}
                                    <rect x={node.x} y={node.y} width={160} height={70} rx={12}
                                        fill={s.bg} stroke={isH ? s.border : 'rgba(255,255,255,0.06)'}
                                        strokeWidth={isH ? 2 : 1}
                                        style={{ transition: 'all 0.3s ease', filter: isH ? s.glow : 'none' }} />
                                    <text x={node.x + 16} y={node.y + 30} fontSize={18}>{node.icon}</text>
                                    <text x={node.x + 40} y={node.y + 28} fontSize={12} fontWeight={500}
                                        fill="#e0e0e0" fontFamily="var(--font-family)">{node.label}</text>
                                    {node.port > 0 && (
                                        <>
                                            <rect x={node.x + 40} y={node.y + 38}
                                                width={node.port.toString().length * 8 + 24} height={20} rx={10}
                                                fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                                            <text x={node.x + 52} y={node.y + 52} fontSize={11}
                                                fill="var(--text-muted)" fontFamily="var(--font-family)">:{node.port}</text>
                                        </>
                                    )}
                                    <circle cx={node.x + 148} cy={node.y + 12} r={4} fill="#10b981" />
                                    {isH && (
                                        <g>
                                            <rect x={node.x} y={node.y + 74} width={160} height={24} rx={6}
                                                fill="rgba(0,0,0,0.85)" stroke={s.border} strokeWidth={0.5} />
                                            <text x={node.x + 80} y={node.y + 90} textAnchor="middle" fontSize={10}
                                                fill="var(--text-muted)" fontFamily="var(--font-family)">{node.desc}</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </GlassCard>
            </div>

            {/* Service Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
                {allNodes.filter(n => n.port > 0).map((node, i) => {
                    const s = nodeStyles[node.type] || fallback;
                    const isH = hoveredNode === node.id;
                    return (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                        >
                            <GlassCard style={{
                                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                                opacity: hoveredNode ? (isH ? 1 : 0.35) : 1, transition: 'all 0.3s ease',
                                transform: isH ? 'scale(1.03)' : 'scale(1)',
                                borderColor: isH ? s.border : undefined, boxShadow: isH ? s.glow : undefined, cursor: 'pointer',
                            }}
                                onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                                <div style={{ fontSize: 18 }}>{node.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>localhost:{node.port}</div>
                                </div>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                    background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)',
                                }} />
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* Source footer */}
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', opacity: 0.5, textAlign: 'center' }}>
                Auto-generated from project config &bull; {topoConfig.services.length} services detected &bull; Last extracted: {new Date(topoConfig._generatedAt).toLocaleString()}
            </div>
        </motion.div>
    );
}
