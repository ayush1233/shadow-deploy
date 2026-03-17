import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'signup'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            navigate('/');
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.message || 'Failed to login');
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            setErrorMsg('Enter email and password first');
            setStatus('error');
            return;
        }
        setStatus('loading');
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setStatus('signup');
            setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.message || 'Sign up failed');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            fontFamily: 'var(--font-family)',
            padding: 24,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated gradient glow */}
            <div style={{
                position: 'absolute',
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%)',
                filter: 'blur(60px)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                animation: 'pulse-glow 4s ease-in-out infinite',
            }} />
            <div className="card" style={{ width: '100%', maxWidth: 400, padding: 40, position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="sidebar-logo-icon" style={{ margin: '0 auto 16px', width: 48, height: 48, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 2L4 9H8L7 14L12 7H8L9 2Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                        Shadow API Platform
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Enterprise-grade shadow traffic validation
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-inset-glass)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-inset-glass)'; }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-inset-glass)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-inset-glass)'; }}
                        />
                    </div>

                    {status === 'error' && (
                        <div style={{ color: 'var(--accent-red)', fontSize: 13, background: 'rgba(248, 113, 113, 0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(248, 113, 113, 0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.8" fill="currentColor"/></svg>
                            {errorMsg}
                        </div>
                    )}

                    {status === 'signup' && (
                        <div style={{ color: 'var(--accent-green)', fontSize: 13, background: 'rgba(52, 211, 153, 0.08)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(52, 211, 153, 0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M4 7l2.5 2.5L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '12px',
                            marginTop: 8,
                            opacity: status === 'loading' ? 0.7 : 1,
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            fontSize: 14
                        }}
                    >
                        {status === 'loading' ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={status === 'loading'}
                        className="btn btn-outline"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            padding: '10px',
                            fontSize: 13
                        }}
                    >
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
}
