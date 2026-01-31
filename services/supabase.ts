import { createClient } from '@supabase/supabase-js';

// Use Vite's standard `import.meta.env` for VITE_ prefixed variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase config is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

// Using ?? '' prevents new URL('') error if variables are undefined at build time.
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
