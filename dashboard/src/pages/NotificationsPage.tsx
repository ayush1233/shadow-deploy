import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getNotificationConfig, configureNotifications } from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import { PageSkeleton } from '../components/ui/SkeletonLoader';

export default function NotificationsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const [slackUrl, setSlackUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [threshold, setThreshold] = useState(7);
    const [severity, setSeverity] = useState('high');

    const [enableSlack, setEnableSlack] = useState(false);
    const [enableWebhook, setEnableWebhook] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await getNotificationConfig();
                if (data) {
                    setSlackUrl(data.slack_webhook_url || '');
                    setWebhookUrl(data.generic_webhook_url || '');
                    setThreshold(data.risk_threshold || 7);
                    setSeverity(data.severity_threshold || 'high');
                    setEnableSlack(data.enable_slack || false);
                    setEnableWebhook(data.enable_webhook || false);
                }
            } catch (err) {
                console.error("Failed to load notification config", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const showMsg = (text: string, type: 'success' | 'error') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            await configureNotifications({
                slack_webhook_url: slackUrl,
                generic_webhook_url: webhookUrl,
                risk_threshold: threshold,
                severity_threshold: severity,
                enable_slack: enableSlack,
                enable_webhook: enableWebhook
            });
            showMsg('Configuration saved successfully!', 'success');
        } catch (err) {
            showMsg('Failed to save configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <PageSkeleton />;

    const channels = [
        {
            key: 'slack',
            name: 'Slack',
            desc: 'Send alerts to a Slack channel',
            icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 11.5a1.5 1.5 0 110-3h3.5v3a1.5 1.5 0 01-3 0h-.5zM7.5 4a1.5 1.5 0 113 0v3.5h-3V4zM14 7.5a1.5 1.5 0 110 3h-3.5v-3H14zM10.5 14a1.5 1.5 0 11-3 0v-3.5h3V14z" fill="currentColor"/>
                </svg>
            ),
            color: '#E01E5A',
            enabled: enableSlack,
            setEnabled: setEnableSlack,
            url: slackUrl,
            setUrl: setSlackUrl,
            placeholder: 'https://hooks.slack.com/services/...',
        },
        {
            key: 'webhook',
            name: 'Generic Webhook',
            desc: 'POST JSON payload to any URL',
            icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2v5M6 4l3 3 3-3M2 9h5M4 12l3-3-3-3M16 9h-5M14 6l-3 3 3 3M9 16v-5M12 14l-3-3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            color: 'var(--accent)',
            enabled: enableWebhook,
            setEnabled: setEnableWebhook,
            url: webhookUrl,
            setUrl: setWebhookUrl,
            placeholder: 'https://your-domain.com/webhook',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ maxWidth: 800, margin: '0 auto' }}
        >
            <PageHeader
                title="Alert Configuration"
                description="Configure automated notifications for high-risk deployments"
            />

            {/* Trigger Conditions */}
            <GlassCard style={{ padding: 28, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    Trigger Conditions
                </h3>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="input-label" style={{ marginBottom: 0 }}>Minimum Risk Score Threshold</span>
                        <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{threshold.toFixed(1)}</span>
                    </label>
                    <input
                        type="range" min="0" max="10" step="0.5"
                        value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--red)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        <span>Alert on any issue</span>
                        <span>Only critical issues (10)</span>
                    </div>
                </div>

                <div>
                    <label className="input-label">Minimum Severity</label>
                    <select className="input" value={severity} onChange={e => setSeverity(e.target.value)}>
                        <option value="critical">Critical</option>
                        <option value="high">High & above</option>
                        <option value="medium">Medium & above</option>
                        <option value="low">Low & above (All)</option>
                    </select>
                </div>
            </GlassCard>

            {/* Channels */}
            <GlassCard style={{ padding: 28, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    Notification Channels
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {channels.map(ch => (
                        <div key={ch.key} style={{
                            padding: '18px 20px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: ch.enabled ? 'rgba(99,102,241,0.03)' : 'transparent',
                            transition: 'all 0.2s ease',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10,
                                        background: typeof ch.color === 'string' && ch.color.startsWith('#') ? ch.color : undefined,
                                        backgroundColor: typeof ch.color === 'string' && ch.color.startsWith('var') ? ch.color : undefined,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                                    }}>{ch.icon}</div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{ch.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ch.desc}</div>
                                    </div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={ch.enabled} onChange={e => ch.setEnabled(e.target.checked)} />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                            {ch.enabled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ marginTop: 14, paddingLeft: 52 }}
                                >
                                    <input
                                        type="text" className="input"
                                        placeholder={ch.placeholder}
                                        value={ch.url} onChange={e => ch.setUrl(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    {message && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                color: messageType === 'success' ? 'var(--green)' : 'var(--red)',
                                fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            {messageType === 'success' ? (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/></svg>
                            )}
                            {message}
                        </motion.span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={async () => {
                        try {
                            await configureNotifications({
                                slack_webhook_url: slackUrl,
                                generic_webhook_url: webhookUrl,
                                risk_threshold: 0,
                                severity_threshold: 'low',
                                enable_slack: enableSlack,
                                enable_webhook: enableWebhook
                            });
                            showMsg('Test alert sent successfully!', 'success');
                        } catch {
                            showMsg('Failed to send test alert', 'error');
                        }
                    }}>Send Test Alert</button>
                    <button className="btn btn-primary btn-glow" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                                Saving...
                            </span>
                        ) : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
