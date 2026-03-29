import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    trend?: string;
    trendType?: 'positive' | 'negative' | 'neutral';
    color?: string;
    formatFn?: (n: number) => string;
    delay?: number;
}

export default function StatCard({ icon, label, value, decimals = 0, prefix = '', suffix = '', trend, trendType = 'neutral', color, formatFn, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, scale: 1.01 }}
        >
            <div className="stat-card-icon" style={{ background: color ? `${color}15` : 'var(--accent-subtle)', color: color || 'var(--accent)' }}>
                {icon}
            </div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{ color: color || 'var(--text-primary)' }}>
                <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} formatFn={formatFn} />
            </div>
            {trend && (
                <div className={`stat-card-trend ${trendType}`}>
                    {trendType === 'positive' && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {trendType === 'negative' && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {trend}
                </div>
            )}
        </motion.div>
    );
}
