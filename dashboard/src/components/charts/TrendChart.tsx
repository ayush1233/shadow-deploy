import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface TrendChartProps {
    data: any[];
    height?: number;
}

const tooltipStyle = {
    background: '#0c0c0f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    padding: '8px 12px',
};

export default function TrendChart({ data, height = 280 }: TrendChartProps) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#52525b" fontSize={10} unit="%" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f4f4f5' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }} />
                    <Area yAxisId="left" type="monotone" dataKey="avg_risk" stroke="#ef4444" fillOpacity={1} fill="url(#riskGrad)" name="Avg Risk" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Area yAxisId="right" type="monotone" dataKey="pass_rate" stroke="#6366f1" fillOpacity={1} fill="url(#passGrad)" name="Pass Rate" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
