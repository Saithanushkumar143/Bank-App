import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().default('development-secret-key-at-least-32-chars'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  GEMINI_API_KEY_SECONDARY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

// Since NextAuth looks for NEXTAUTH_URL and we are on Next.js, 
// let's ensure we parse process.env.
export const env = typeof window === 'undefined'
  ? envSchema.parse({
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      GEMINI_API_KEY_SECONDARY: process.env.GEMINI_API_KEY_SECONDARY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    })
  : {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    } as any;
