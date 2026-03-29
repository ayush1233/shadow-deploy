import { useEffect, useState } from 'react';

interface RiskGaugeProps {
    score: number; // 0–10
    size?: number;
}

export default function RiskGauge({ score, size = 160 }: RiskGaugeProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(animatedScore / 10, 1);
    const offset = circumference * (1 - progress);
    const center = size / 2;

    const getColor = (s: number) => {
        if (s <= 3) return '#22c55e';
        if (s <= 6) return '#f59e0b';
        return '#ef4444';
    };

    const color = getColor(score);

    return (
        <div className="risk-gauge-wrapper">
            <svg width={size} height={size} className="risk-gauge-svg">
                {/* Background circle */}
                <circle
                    cx={center} cy={center} r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                />
                {/* Animated gradient stroke */}
                <circle
                    cx={center} cy={center} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                        filter: `drop-shadow(0 0 8px ${color}50)`,
                    }}
                />
                {/* Inner glow */}
                <circle
                    cx={center} cy={center} r={radius - 16}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.15"
                />
                {/* Center text */}
                <text x={center} y={center - 4} className="risk-gauge-center-text" textAnchor="middle" dominantBaseline="middle" style={{ fill: color }}>
                    {score.toFixed(1)}
                </text>
                <text x={center} y={center + 18} className="risk-gauge-label-text" textAnchor="middle">
                    out of 10
                </text>
            </svg>
        </div>
    );
}
