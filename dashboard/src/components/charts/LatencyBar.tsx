import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface LatencyBarProps {
    data: any[];
    height?: number;
}

const tooltipStyle = {
    background: '#0c0c0f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
};

export default function LatencyBar({ data, height = 250 }: LatencyBarProps) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={data} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="endpoint" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} unit="ms" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f4f4f5' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }} />
                    <Bar dataKey="prod" fill="#22c55e" name="Production" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="shadow" fill="#6366f1" name="Shadow" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
