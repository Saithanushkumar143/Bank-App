import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from './env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null as any;

export function createServerSupabaseClient(accessToken?: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
}
