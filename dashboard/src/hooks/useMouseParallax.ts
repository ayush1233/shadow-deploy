import { useState, useEffect, useCallback, RefObject } from 'react';

export function useMouseParallax(ref: RefObject<HTMLElement | null>, intensity: number = 5) {
    const [transform, setTransform] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = ((e.clientX - centerX) / rect.width) * intensity;
        const y = ((e.clientY - centerY) / rect.height) * intensity;
        setTransform({ x, y });
    }, [ref, intensity]);

    const handleMouseLeave = useCallback(() => {
        setTransform({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [ref, handleMouseMove, handleMouseLeave]);

    return transform;
}
