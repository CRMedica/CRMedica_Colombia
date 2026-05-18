import { createClient } from '@supabase/supabase-js';

// Access variables safely for both client (Vite) and server (Node)
const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') || '';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Auth features might not work until configured in the environment.');
}

// Only create client if URL is present to avoid immediate crash on module load
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null as any; // Cast as any to avoid type errors in components, but logic should guard usage
