import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import OverviewPage from './pages/OverviewPage';
import EndpointAnalysisPage from './pages/EndpointAnalysisPage';
import ComparisonDetailPage from './pages/ComparisonDetailPage';
import TopologyPage from './pages/TopologyPage';
import LoginPage from './pages/LoginPage';
import QuickConfigurePage from './pages/QuickConfigurePage';
import WebsiteTestPage from './pages/WebsiteTestPage';
import NotificationsPage from './pages/NotificationsPage';

// Protected Route Wrapper — checks Supabase session
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthenticated(!!session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

function ProtectedLayout() {
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor" opacity="0.9"/>
                            </svg>
                        </div>
                        <div>
                            <h1>Shadow API</h1>
                            <span>Validation Platform</span>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor"/>
                                <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/>
                                <rect x="11" y="2" width="3" height="13" rx="1" fill="currentColor"/>
                            </svg>
                        </span> Overview
                    </NavLink>
                    <NavLink to="/endpoints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </span> Endpoint Analysis
                    </NavLink>
                    <NavLink to="/topology" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="3" r="2" fill="currentColor"/>
                                <circle cx="3" cy="13" r="2" fill="currentColor"/>
                                <circle cx="13" cy="13" r="2" fill="currentColor"/>
                                <path d="M8 5L3 11M8 5L13 11M3 13H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                        </span> Network Topology
                    </NavLink>
                    <NavLink to="/setup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor"/>
                            </svg>
                        </span> Quick Setup
                    </NavLink>
                    <NavLink to="/website-test" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                <path d="M8 1.5C8 1.5 5.5 4 5.5 8C5.5 12 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M8 1.5C8 1.5 10.5 4 10.5 8C10.5 12 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M1.5 8H14.5" stroke="currentColor" strokeWidth="1.2"/>
                            </svg>
                        </span> Website Test
                    </NavLink>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 2C5.8 2 4 3.8 4 6V10L2.5 11.5V12H13.5V11.5L12 10V6C12 3.8 10.2 2 8 2Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
                                <path d="M6.5 12.5C6.5 13.3 7.2 14 8 14C8.8 14 9.5 13.3 9.5 12.5" stroke="currentColor" strokeWidth="1.3"/>
                            </svg>
                        </span> Alerts
                    </NavLink>
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                        <button className="nav-link btn-outline" style={{ opacity: 0.8 }} onClick={handleSignOut} aria-label="Sign out">
                            <span className="nav-icon">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 2H3C2.4 2 2 2.4 2 3V13C2 13.6 2.4 14 3 14H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                    <path d="M10 11L14 8L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                            </span> Sign Out
                        </button>
                    </div>
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontSize: 11, color: 'var(--text-muted)' }}>
                    v2.0.0 — Professional
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/endpoints" element={<EndpointAnalysisPage />} />
                    <Route path="/topology" element={<TopologyPage />} />
                    <Route path="/comparison/:requestId" element={<ComparisonDetailPage />} />
                    <Route path="/setup" element={<QuickConfigurePage />} />
                    <Route path="/website-test" element={<WebsiteTestPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <ProtectedLayout />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
