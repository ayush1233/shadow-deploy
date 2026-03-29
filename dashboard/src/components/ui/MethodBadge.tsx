interface MethodBadgeProps {
    method: string;
}

export default function MethodBadge({ method }: MethodBadgeProps) {
    const m = (method || 'GET').toUpperCase();
    return <span className={`method-badge ${m}`}>{m}</span>;
}
