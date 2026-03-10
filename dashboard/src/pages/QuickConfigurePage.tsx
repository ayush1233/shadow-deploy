import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configureProxy } from '../services/api';

export default function QuickConfigurePage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [prodUrl, setProdUrl] = useState('http://localhost:5001');
    const [shadowUrl, setShadowUrl] = useState('http://localhost:5002');
    const [mirrorPercent, setMirrorPercent] = useState(100);
    const [compMode, setCompMode] = useState('Full comparison');
    const [enableAi, setEnableAi] = useState(true);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleApply = async () => {
        setStatus('loading');
        try {
            const prompt = `Route production traffic to ${prodUrl} and mirror ${mirrorPercent}% of traffic to shadow at ${shadowUrl}. Modes: ${compMode}. AI Enabled: ${enableAi}`;
            const { data } = await configureProxy(prompt);
            setStatus('success');
            setMessage(data.message || 'Configuration applied successfully!');
            setStep(4);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.detail || error.message || 'Configuration failed');
        }
    };

    const renderProgressBar = () => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map(s => (
                <div key={s} style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: s <= step ? 'var(--accent-purple)' : 'var(--bg-surface)',
                    transition: 'all 0.3s'
                }} />
            ))}
        </div>
    );

    return (
        <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header" style={{ textAlign: 'center' }}>
                <h2>🚀 Quick Configure Wizard</h2>
                <p>Setup traffic routing and mirror configuration in seconds</p>
            </div>

            {renderProgressBar()}

            <div className="card" style={{ padding: '32px' }}>
                {step === 1 && (
                    <div>
                        <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-purple)',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                            }}>1</span>
                            Target URLs
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Enter the base URLs of your production and shadow APIs.</p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Production API URL</label>
                            <input type="text" className="ai-input" value={prodUrl} onChange={e => setProdUrl(e.target.value)} />
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Shadow API URL</label>
                            <input type="text" className="ai-input" value={shadowUrl} onChange={e => setShadowUrl(e.target.value)} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setStep(2)}>Next Step →</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-purple)',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                            }}>2</span>
                            Traffic Settings
                        </h3>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-primary)' }}>Traffic Mirror Percentage</span>
                                <span style={{ color: 'var(--accent-purple)' }}>{mirrorPercent}%</span>
                            </label>
                            <input type="range" min="1" max="100" value={mirrorPercent} onChange={e => setMirrorPercent(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Comparison Mode</label>
                            <select className="ai-input" value={compMode} onChange={e => setCompMode(e.target.value)}>
                                <option>Full comparison</option>
                                <option>Status code only</option>
                                <option>Headers + Body</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <label style={{ color: 'var(--text-primary)', flex: 1 }}>Enable AI Analysis</label>
                            <input type="checkbox" checked={enableAi} onChange={e => setEnableAi(e.target.checked)} style={{ transform: 'scale(1.5)', cursor: 'pointer' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>Review & Apply →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-purple)',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                            }}>3</span>
                            Review & Apply
                        </h3>

                        <div style={{ padding: 16, background: 'var(--bg-body)', borderRadius: 8, marginBottom: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Production URL</div>
                                    <div style={{ color: 'var(--accent-green)' }}>{prodUrl}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Shadow URL</div>
                                    <div style={{ color: 'var(--accent-yellow)' }}>{shadowUrl}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mirror Ratio</div>
                                    <div style={{ color: 'var(--text-primary)' }}>{mirrorPercent}%</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AI Analysis</div>
                                    <div style={{ color: enableAi ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>{enableAi ? 'Enabled' : 'Disabled'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Generated NGINX Intent:</label>
                            <pre style={{ background: '#000', padding: 16, borderRadius: 8, color: '#a1a1aa', fontSize: 13, border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap' }}>
                                Route production traffic to {prodUrl} and mirror {mirrorPercent}% of traffic to shadow at {shadowUrl}. Modes: {compMode}. AI Enabled: {enableAi}
                            </pre>
                        </div>

                        {status === 'error' && (
                            <div style={{ color: 'var(--accent-red)', marginBottom: 16, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                                ❌ {message}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn" style={{ background: 'var(--bg-surface)' }} onClick={() => setStep(2)}>← Back</button>
                            <button className="btn btn-primary btn-glow" onClick={handleApply} disabled={status === 'loading'}>
                                {status === 'loading' ? 'Applying...' : 'Apply Configuration'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
                        <h3 style={{ marginBottom: 16, color: 'var(--accent-green)' }}>Configuration Applied!</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{message}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto 32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-body)', borderRadius: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Proxy Port:</span>
                                <span style={{ color: 'var(--accent-cyan)' }}>8080</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-body)', borderRadius: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Dashboard:</span>
                                <span style={{ color: 'var(--accent-purple)' }}>3004</span>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-glow" onClick={() => navigate('/')}>Open Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
}
