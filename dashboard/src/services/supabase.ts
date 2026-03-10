import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const msg = 'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in dashboard/.env.local (see .env.example).';
    console.error(msg);
    // Show visible error in development so misconfiguration is immediately obvious
    if (import.meta.env.DEV) {
        document.addEventListener('DOMContentLoaded', () => {
            const el = document.createElement('div');
            el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:#fff;padding:12px;text-align:center;font-family:monospace';
            el.textContent = msg;
            document.body.prepend(el);
        });
    }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
