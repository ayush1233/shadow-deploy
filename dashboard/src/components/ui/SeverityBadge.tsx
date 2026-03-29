interface SeverityBadgeProps {
    severity: string;
    size?: 'sm' | 'md';
}

export default function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
    const s = (severity || 'none').toLowerCase();
    return (
        <span className={`severity-badge ${s}`} style={size === 'md' ? { padding: '4px 14px', fontSize: 12 } : undefined}>
            <span className={`severity-dot ${s}`} />
            {s}
        </span>
    );
}
