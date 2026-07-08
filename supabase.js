import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing. Copy .env.example to .env and fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url, anonKey);

// The single shared workspace this deployment talks to.
export const WORKSPACE_ID = import.meta.env.VITE_WORKSPACE_ID;
