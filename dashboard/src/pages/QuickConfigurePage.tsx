import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { configureProxy } from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';

const steps = [
    { num: 1, label: 'Target URLs' },
    { num: 2, label: 'Traffic Settings' },
    { num: 3, label: 'Review & Apply' },
    { num: 4, label: 'Complete' },
];

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ maxWidth: 800, margin: '0 auto' }}
        >
            <PageHeader
                title="Quick Configure"
                description="Setup traffic routing and mirror configuration in seconds"
            />

            {/* Stepper */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 32, position: 'relative' }}>
                {steps.map((s, i) => (
                    <div key={s.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: s.num <= step ? 'var(--accent)' : 'var(--surface-2)',
                            border: s.num === step ? '2px solid var(--accent)' : '2px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600,
                            color: s.num <= step ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.3s ease',
                            boxShadow: s.num === step ? '0 0 16px rgba(99,102,241,0.4)' : 'none',
                        }}>
                            {s.num < step ? (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : s.num}
                        </div>
                        <span style={{ fontSize: 11, color: s.num <= step ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: 6, fontWeight: s.num === step ? 600 : 400 }}>{s.label}</span>
                        {i < steps.length - 1 && (
                            <div style={{
                                position: 'absolute', top: 18, left: '50%', width: '100%', height: 2,
                                background: s.num < step ? 'var(--accent)' : 'var(--border)',
                                transition: 'background 0.3s ease',
                                zIndex: -1,
                            }} />
                        )}
                    </div>
                ))}
            </div>

            <GlassCard style={{ padding: 32 }}>
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>1</span>
                                Target URLs
                            </h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>Enter the base URLs of your production and shadow APIs.</p>

                            <div style={{ marginBottom: 20 }}>
                                <label className="input-label">Production API URL</label>
                                <input type="text" className="input" value={prodUrl} onChange={e => setProdUrl(e.target.value)} />
                            </div>
                            <div style={{ marginBottom: 32 }}>
                                <label className="input-label">Shadow API URL</label>
                                <input type="text" className="input" value={shadowUrl} onChange={e => setShadowUrl(e.target.value)} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={() => setStep(2)}>Next Step
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6 4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>2</span>
                                Traffic Settings
                            </h3>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span className="input-label" style={{ marginBottom: 0 }}>Traffic Mirror Percentage</span>
                                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>{mirrorPercent}%</span>
                                </label>
                                <input type="range" min="1" max="100" value={mirrorPercent} onChange={e => setMirrorPercent(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label className="input-label">Comparison Mode</label>
                                <select className="input" value={compMode} onChange={e => setCompMode(e.target.value)}>
                                    <option>Full comparison</option>
                                    <option>Status code only</option>
                                    <option>Headers + Body</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Enable AI Analysis</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Use Gemini to semantically compare responses</div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={enableAi} onChange={e => setEnableAi(e.target.checked)} />
                                    <span className="toggle-slider" />
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Back
                                </button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Review & Apply
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6 4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>3</span>
                                Review & Apply
                            </h3>

                            <div style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Production URL</div>
                                        <div style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{prodUrl}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Shadow URL</div>
                                        <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{shadowUrl}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mirror Ratio</div>
                                        <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{mirrorPercent}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>AI Analysis</div>
                                        <div style={{ color: enableAi ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13 }}>{enableAi ? 'Enabled' : 'Disabled'}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <label className="input-label">Generated NGINX Intent</label>
                                <pre style={{
                                    background: 'var(--surface-0)', padding: 16, borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)',
                                    border: '1px solid var(--border)', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                                }}>
                                    Route production traffic to {prodUrl} and mirror {mirrorPercent}% of traffic to shadow at {shadowUrl}. Modes: {compMode}. AI Enabled: {enableAi}
                                </pre>
                            </div>

                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        color: 'var(--red)', marginBottom: 16, padding: '12px 16px',
                                        background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgba(239,68,68,0.2)', fontSize: 13,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10" r="0.8" fill="currentColor"/></svg>
                                    {message}
                                </motion.div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Back
                                </button>
                                <button className="btn btn-primary btn-glow" onClick={handleApply} disabled={status === 'loading'}>
                                    {status === 'loading' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                            Applying...
                                        </span>
                                    ) : 'Apply Configuration'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                                background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--green)' }}>Configuration Applied!</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 13 }}>{message}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300, margin: '0 auto 32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Proxy Port</span>
                                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>8080</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Dashboard</span>
                                    <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>3004</span>
                                </div>
                            </div>

                            <button className="btn btn-primary btn-glow" onClick={() => navigate('/')}>Open Dashboard</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </motion.div>
    );
}
