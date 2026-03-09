import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://likjiuylgndoedpkzxhb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa2ppdXlsZ25kb2VkcGt6eGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODQ5NzUsImV4cCI6MjA4Nzk2MDk3NX0.y6yvFLWpLWkRPYoi-PpPa645SEBjwWZnd6c-ExZJBHU';

if (SUPABASE_URL === 'https://your-project.supabase.co') {
    console.warn('Supabase URL not configured. Run `./setup.sh` or set VITE_SUPABASE_URL in dashboard/.env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
