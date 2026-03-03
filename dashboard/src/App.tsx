import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import OverviewPage from './pages/OverviewPage';
import EndpointAnalysisPage from './pages/EndpointAnalysisPage';
import ComparisonDetailPage from './pages/ComparisonDetailPage';
import LoginPage from './pages/LoginPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('shadow_token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

function ProtectedLayout() {
    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">⚡</div>
                        <div>
                            <h1>Shadow API</h1>
                            <span>Validation Platform</span>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📊</span> Overview
                    </NavLink>
                    <NavLink to="/endpoints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🔍</span> Endpoint Analysis
                    </NavLink>
                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                        <div className="nav-link" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => { localStorage.removeItem('shadow_token'); window.location.href = '/login'; }}>
                            <span className="nav-icon">🚪</span> Sign Out
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/endpoints" element={<EndpointAnalysisPage />} />
                    <Route path="/comparison/:requestId" element={<ComparisonDetailPage />} />
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
