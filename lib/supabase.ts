import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser-safe client — uses anon/publishable key, respects RLS
export const supabase = createClient(url, anonKey);

// Server-only client — uses service role key, bypasses RLS
// Only import this in server components / API routes / scripts
export const supabaseAdmin = createClient(url, serviceKey ?? anonKey);
