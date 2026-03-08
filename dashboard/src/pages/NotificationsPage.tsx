import { useState, useEffect } from 'react';
import { getNotificationConfig, configureNotifications } from '../services/api';

export default function NotificationsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

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
            setMessage('✅ Configuration saved successfully!');
        } catch (err) {
            setMessage('❌ Failed to save configuration');
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (isLoading) {
        return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading configuration...</div>;
    }

    return (
        <div style={{ padding: 32, maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <h2>🔔 Alert Configuration</h2>
                <p>Configure automated notifications for high-risk deployments</p>
            </div>

            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
                <h3 style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>Trigger Conditions</h3>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-primary)' }}>Minimum Risk Score Threshold</span>
                        <span style={{ color: 'var(--accent-red)' }}>{threshold.toFixed(1)}</span>
                    </label>
                    <input
                        type="range" min="0" max="10" step="0.5"
                        value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                        <span>Alert on any issue</span>
                        <span>Only critical issues (10)</span>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Minimum Severity</label>
                    <select className="ai-input" value={severity} onChange={e => setSeverity(e.target.value)}>
                        <option value="critical">Critical</option>
                        <option value="high">High & above</option>
                        <option value="medium">Medium & above</option>
                        <option value="low">Low & above (All)</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
                <h3 style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>Channels</h3>

                {/* Slack */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E01E5A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>S</div>
                            <div>
                                <h4 style={{ margin: 0 }}>Slack Webhook</h4>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Send alerts to a Slack channel</div>
                            </div>
                        </div>
                        <input type="checkbox" checked={enableSlack} onChange={e => setEnableSlack(e.target.checked)} style={{ transform: 'scale(1.5)', cursor: 'pointer' }} />
                    </div>
                    {enableSlack && (
                        <div style={{ paddingLeft: 44 }}>
                            <input
                                type="text" className="ai-input"
                                placeholder="https://hooks.slack.com/services/..."
                                value={slackUrl} onChange={e => setSlackUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Generic Webhook */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>W</div>
                            <div>
                                <h4 style={{ margin: 0 }}>Generic Webhook</h4>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>POST JSON payload to any URL</div>
                            </div>
                        </div>
                        <input type="checkbox" checked={enableWebhook} onChange={e => setEnableWebhook(e.target.checked)} style={{ transform: 'scale(1.5)', cursor: 'pointer' }} />
                    </div>
                    {enableWebhook && (
                        <div style={{ paddingLeft: 44 }}>
                            <input
                                type="text" className="ai-input"
                                placeholder="https://your-domain.com/webhook"
                                value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    {message && <span style={{ color: message.includes('✅') ? 'var(--accent-green)' : 'var(--accent-red)' }}>{message}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn" style={{ background: 'var(--bg-surface)' }}>Send Test Alert</button>
                    <button className="btn btn-primary btn-glow" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
