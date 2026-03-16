import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'dfhsftgh';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'ml;';

if (SUPABASE_URL === 'https://your-project.supabase.co') {
    console.warn('Supabase URL not configured. Run ./setup.sh or set VITE_SUPABASE_URL in dashboard/.env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
