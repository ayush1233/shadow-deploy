import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../../services/api';
import { PageSkeleton } from '../ui/SkeletonLoader';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        getSession().then((session) => {
            setAuthenticated(!!session);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
                {/* Sidebar skeleton */}
                <div style={{ width: 260, background: 'rgba(12,12,15,0.8)', borderRight: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ width: '80%', height: 30, marginBottom: 24 }} />
                    {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ width: '70%', height: 16 }} />)}
                </div>
                {/* Content skeleton */}
                <div style={{ flex: 1 }}>
                    <PageSkeleton />
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
