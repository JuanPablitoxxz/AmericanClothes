import { createClient } from '@supabase/supabase-js';

// Project Supabase Credentials (nnpoxdeufvwlfygsknaa)
const DEFAULT_SUPABASE_URL = 'https://nnpoxdeufvwlfygsknaa.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucG94ZGV1ZnZ3bGZ5Z3NrbmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMjExNTIsImV4cCI6MjEwODc5NzE1Mn0.06aigNbzwSjnDf2HY0NrcOAZcv-GM0-_-jCP_OVx2ck';

const envUrl =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)
    : undefined;

const envKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : undefined;

export const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = envKey || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('tu-proyecto')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
