import { createClient } from '@supabase/supabase-js';

// Access variables safely for both client (Vite) and server (Node)
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || '';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase URL or Key is missing. Follow these steps to fix:\n1. Open Settings > Secrets\n2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n3. Restart the dev server.');
}

// Only create client if URL is present to avoid immediate crash on module load
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null as any; 
