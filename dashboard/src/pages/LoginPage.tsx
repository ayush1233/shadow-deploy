import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../services/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('shadow-admin');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        try {
            await login(username, password);
            navigate('/');
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || error.message || 'Failed to login');
        }
    };

    return (
        <div className="login-container">
            {/* Brand Panel (Left) */}
            <div className="login-brand">
                <div className="login-brand-bg">
                    <div className="login-brand-orb orb-1" />
                    <div className="login-brand-orb orb-2" />
                    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <motion.div
                    className="login-brand-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div style={{ marginBottom: 32 }}>
                        <div className="sidebar-logo-icon" style={{ width: 56, height: 56, margin: '0 auto 24px', fontSize: 24 }}>
                            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                                <path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                    <h1>
                        <span>Shadow API</span><br />
                        Validation Platform
                    </h1>
                    <p>
                        Mirror production traffic to your new API version,
                        compare every response with AI, and get a deployment
                        risk score before you ship.
                    </p>
                    <div className="login-social-proof">
                        <div style={{ display: 'flex' }}>
                            {[1,2,3,4].map(i => (
                                <div key={i} style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: `hsl(${i * 60 + 200}, 50%, 40%)`,
                                    border: '2px solid var(--bg-base)',
                                    marginLeft: i > 1 ? -8 : 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, color: 'white', fontWeight: 600,
                                }} />
                            ))}
                        </div>
                        Trusted by 200+ engineering teams
                    </div>
                </motion.div>
            </div>

            {/* Auth Form (Right) */}
            <motion.div
                className="login-form-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
                <h2>Welcome back</h2>
                <p className="login-subtitle">Sign in to your account to continue</p>

                <form className="login-form" onSubmit={handleLogin}>
                    <div>
                        <label className="input-label">Username</label>
                        <input
                            className="input"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                            disabled={status === 'loading'}
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label className="input-label">Password</label>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={status === 'loading'}
                            autoComplete="current-password"
                        />
                    </div>

                    {status === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                color: 'var(--red)', fontSize: 13,
                                background: 'rgba(239,68,68,0.08)',
                                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.8" fill="currentColor"/></svg>
                            {errorMsg}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn btn-primary btn-glow"
                        style={{
                            width: '100%', justifyContent: 'center',
                            padding: '12px', fontSize: 14,
                            opacity: status === 'loading' ? 0.7 : 1,
                        }}
                    >
                        {status === 'loading' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Authenticating...
                            </span>
                        ) : 'Sign In'}
                    </button>

                    <div className="login-divider">Or continue with</div>

                    <div className="login-oauth-row">
                        <button type="button" className="login-oauth-btn" disabled aria-label="Sign in with GitHub">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                            GitHub
                        </button>
                        <button type="button" className="login-oauth-btn" disabled aria-label="Sign in with Google">
                            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8V6.558h7.545z" fill="currentColor"/></svg>
                            Google
                        </button>
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        Default: admin / shadow-admin
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
