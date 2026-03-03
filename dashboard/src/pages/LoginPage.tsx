import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('shadow-admin');
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const { data } = await login(username, password);
            localStorage.setItem('shadow_token', data.token);
            navigate('/');
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to login');
            localStorage.removeItem('shadow_token');
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
            padding: 24
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 400, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="sidebar-logo-icon" style={{ margin: '0 auto 16px', width: 48, height: 48, fontSize: 24 }}>⚡</div>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                        Shadow API Platform
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Sign in to access deployment analytics
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>USERNAME</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
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
                            onFocus={(e) => { e.target.style.borderColor = 'var(--text-secondary)'; e.target.style.boxShadow = '0 0 0 1px var(--text-secondary)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-inset-glass)'; }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
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
                            onFocus={(e) => { e.target.style.borderColor = 'var(--text-secondary)'; e.target.style.boxShadow = '0 0 0 1px var(--text-secondary)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'var(--shadow-inset-glass)'; }}
                        />
                    </div>

                    {status === 'error' && (
                        <div style={{ color: 'var(--accent-red)', fontSize: 13, textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {errorMsg}
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
                </form>
            </div>
        </div>
    );
}
