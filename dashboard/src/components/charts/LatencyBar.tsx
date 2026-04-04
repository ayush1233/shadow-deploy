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
    fontSize: 13,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    padding: '10px 14px',
};

/** Shorten long endpoint paths into readable labels */
function shortenEndpoint(ep: string): string {
    if (!ep) return '';
    // Remove leading domain / protocol if present
    const path = ep.replace(/^https?:\/\/[^/]+/, '');
    // Take last 2 segments for readability
    const segments = path.split('/').filter(Boolean);
    if (segments.length <= 2) return '/' + segments.join('/');
    return '/…/' + segments.slice(-2).join('/');
}

export default function LatencyBar({ data, height }: LatencyBarProps) {
    // Dynamic height: scale with the number of endpoints, minimum 350px
    const barCount = data.length;
    const dynamicHeight = height ?? Math.max(400, barCount * 45);
    const useHorizontal = barCount > 6;

    // Prepare data with shortened labels
    const chartData = data.map(d => ({
        ...d,
        shortEndpoint: shortenEndpoint(d.endpoint),
    }));

    if (useHorizontal) {
        // Horizontal bar chart for many endpoints — much more readable
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <div style={{ overflowY: 'auto', maxHeight: 600 }}>
                    <ResponsiveContainer width="100%" height={dynamicHeight}>
                        <BarChart data={chartData} layout="vertical" barCategoryGap="25%" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" stroke="#71717a" fontSize={12} unit="ms" tickLine={false} axisLine={false} />
                            <YAxis
                                type="category"
                                dataKey="shortEndpoint"
                                stroke="#a1a1aa"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={160}
                                tick={{ fill: '#a1a1aa' }}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: '#f4f4f5' }}
                                labelStyle={{ color: '#d4d4d8', fontWeight: 600, marginBottom: 4 }}
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                formatter={(value: number) => [`${value} ms`]}
                                labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.endpoint || ''}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 12 }} />
                            <Bar dataKey="prod" fill="#22c55e" name="Production" radius={[0, 4, 4, 0]} barSize={18} />
                            <Bar dataKey="shadow" fill="#6366f1" name="Shadow" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        );
    }

    // Vertical bar chart for few endpoints
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} barCategoryGap="25%" margin={{ left: 10, right: 10, top: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                        dataKey="shortEndpoint"
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={70}
                        tick={{ fill: '#a1a1aa' }}
                    />
                    <YAxis stroke="#71717a" fontSize={12} unit="ms" tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: '#f4f4f5' }}
                        labelStyle={{ color: '#d4d4d8', fontWeight: 600, marginBottom: 4 }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        formatter={(value: number) => [`${value} ms`]}
                        labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.endpoint || ''}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa', paddingTop: 12 }} />
                    <Bar dataKey="prod" fill="#22c55e" name="Production" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="shadow" fill="#6366f1" name="Shadow" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
