import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { signOut } from './services/api';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import { PageSkeleton } from './components/ui/SkeletonLoader';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const EndpointAnalysisPage = lazy(() => import('./pages/EndpointAnalysisPage'));
const ComparisonDetailPage = lazy(() => import('./pages/ComparisonDetailPage'));
const TopologyPage = lazy(() => import('./pages/TopologyPage'));
const QuickConfigurePage = lazy(() => import('./pages/QuickConfigurePage'));
const WebsiteTestPage = lazy(() => import('./pages/WebsiteTestPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

function ProtectedLayout() {
    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <div className="app-container">
            <Sidebar onSignOut={handleSignOut} />
            <main className="main-content">
                <Suspense fallback={<PageSkeleton />}>
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/" element={<OverviewPage />} />
                            <Route path="/endpoints" element={<EndpointAnalysisPage />} />
                            <Route path="/topology" element={<TopologyPage />} />
                            <Route path="/comparison/:requestId" element={<ComparisonDetailPage />} />
                            <Route path="/setup" element={<QuickConfigurePage />} />
                            <Route path="/website-test" element={<WebsiteTestPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                        </Routes>
                    </AnimatePresence>
                </Suspense>
            </main>
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <Router>
                <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <ProtectedLayout />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Suspense>
            </Router>
        </ToastProvider>
    );
}

export default App;
