import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface SidebarProps {
    onSignOut: () => void;
}

const navItems = [
    { to: '/', end: true, label: 'Overview', icon: <><rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor"/><rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/><rect x="11" y="2" width="3" height="13" rx="1" fill="currentColor"/></> },
    { to: '/endpoints', label: 'Endpoints', icon: <><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></> },
    { to: '/topology', label: 'Topology', icon: <><circle cx="8" cy="3" r="2" fill="currentColor"/><circle cx="3" cy="13" r="2" fill="currentColor"/><circle cx="13" cy="13" r="2" fill="currentColor"/><path d="M8 5L3 11M8 5L13 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></> },
    { to: '/setup', label: 'Quick Setup', icon: <><path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor"/></> },
    { to: '/website-test', label: 'Website Test', icon: <><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 1.5C8 1.5 5.5 4 5.5 8C5.5 12 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.5C8 1.5 10.5 4 10.5 8C10.5 12 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 8H14.5" stroke="currentColor" strokeWidth="1.2"/></> },
    { to: '/notifications', label: 'Alerts', icon: <><path d="M8 2C5.8 2 4 3.8 4 6V10L2.5 11.5V12H13.5V11.5L12 10V6C12 3.8 10.2 2 8 2Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/><path d="M6.5 12.5C6.5 13.3 7.2 14 8 14C8.8 14 9.5 13.3 9.5 12.5" stroke="currentColor" strokeWidth="1.3"/></> },
];

export default function Sidebar({ onSignOut }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor" opacity="0.9"/>
                        </svg>
                    </div>
                    <div className="nav-label">
                        <h1>Shadow API</h1>
                        <span>Validation Platform</span>
                    </div>
                </div>
            </div>

            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        {collapsed
                            ? <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            : <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        className="nav-active-indicator"
                                        layoutId="sidebar-indicator"
                                        style={{ height: 24, top: '50%', marginTop: -12 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span className="nav-icon">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{item.icon}</svg>
                                </span>
                                <span className="nav-label">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <button className="nav-link" onClick={onSignOut} aria-label="Sign out" style={{ opacity: 0.7 }}>
                        <span className="nav-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6 2H3C2.4 2 2 2.4 2 3V13C2 13.6 2.4 14 3 14H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                <path d="M10 11L14 8L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                        </span>
                        <span className="nav-label">Sign Out</span>
                    </button>
                </div>
            </nav>

            <div className="nav-label" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                v2.0.0 &mdash; Professional
            </div>
        </aside>
    );
}
