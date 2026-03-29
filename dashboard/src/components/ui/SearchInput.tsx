import { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
    placeholder?: string;
    value: string;
    onChange: (val: string) => void;
    debounceMs?: number;
    style?: React.CSSProperties;
}

export default function SearchInput({ placeholder = 'Search...', value, onChange, debounceMs = 300, style }: SearchInputProps) {
    const [local, setLocal] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => { setLocal(value); }, [value]);

    const handleChange = (val: string) => {
        setLocal(val);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(val), debounceMs);
    };

    return (
        <div className="search-input-wrapper" style={style}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
                className="input"
                type="text"
                placeholder={placeholder}
                value={local}
                onChange={e => handleChange(e.target.value)}
            />
            {local && (
                <button className="search-clear" onClick={() => handleChange('')} aria-label="Clear search">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
            )}
        </div>
    );
}
