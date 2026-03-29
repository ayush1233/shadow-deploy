interface SkeletonProps {
    variant?: 'text' | 'title' | 'card' | 'circle' | 'chart';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export default function SkeletonLoader({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
    const getClass = () => {
        switch (variant) {
            case 'title': return 'skeleton skeleton-title';
            case 'card': return 'skeleton skeleton-card';
            case 'circle': return 'skeleton skeleton-circle';
            case 'chart': return 'skeleton skeleton-card';
            default: return 'skeleton skeleton-text';
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={getClass()}
                    style={{
                        width: width || undefined,
                        height: height || undefined,
                    }}
                />
            ))}
        </>
    );
}

export function PageSkeleton() {
    return (
        <div style={{ padding: '32px 40px' }}>
            <SkeletonLoader variant="title" width="200px" />
            <SkeletonLoader variant="text" width="300px" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 32 }}>
                {[1, 2, 3, 4].map(i => <SkeletonLoader key={i} variant="card" height="120px" />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <SkeletonLoader variant="chart" height="280px" />
                <SkeletonLoader variant="chart" height="280px" />
            </div>
        </div>
    );
}
