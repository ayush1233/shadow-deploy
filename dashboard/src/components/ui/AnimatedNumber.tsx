import { useCountUp } from '../../hooks/useCountUp';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    formatFn?: (n: number) => string;
}

export default function AnimatedNumber({ value, duration = 800, decimals = 0, prefix = '', suffix = '', formatFn }: AnimatedNumberProps) {
    const animated = useCountUp(value, duration, decimals);
    const display = formatFn ? formatFn(animated) : animated.toString();
    return <>{prefix}{display}{suffix}</>;
}
