import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration: number = 800, decimals: number = 0): number {
    const [value, setValue] = useState(0);
    const startRef = useRef<number>(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        if (end === 0) { setValue(0); return; }
        const startVal = startRef.current;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startVal + (end - startVal) * eased;
            setValue(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                startRef.current = end;
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [end, duration]);

    return Number(value.toFixed(decimals));
}
