import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface DonutData {
    name: string;
    value: number;
    color: string;
}

interface SeverityDonutProps {
    data: DonutData[];
    height?: number;
}

const tooltipStyle = {
    background: '#0c0c0f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
};

export default function SeverityDonut({ data, height = 250 }: SeverityDonutProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="85%"
                        dataKey="value"
                        paddingAngle={3}
                        stroke="none"
                        animationBegin={200}
                        animationDuration={800}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f4f4f5' }} />
                </PieChart>
            </ResponsiveContainer>
            {/* Legend below */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: -8 }}>
                {data.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                        {d.name} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
