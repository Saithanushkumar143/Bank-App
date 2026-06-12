import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { supabase } from "@/lib/supabase"
import { headers } from "next/headers"

// Helper to generate a stable, secure password for Google/OAuth users
async function getGeneratedPassword(email: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || 'default-secret-for-oauth-bridge-32-chars';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(email.toLowerCase());

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        // Rate limiting: max 5 attempts per IP per 15 minutes
        let ip = "127.0.0.1"
        try {
          const headerList = await headers()
          ip = headerList.get("x-forwarded-for")?.split(',')[0].trim() || headerList.get("x-real-ip") || "127.0.0.1"
        } catch (e) {
          console.warn("Failed to retrieve client IP from headers:", e)
        }

        const rateLimitKey = `login_attempts:${ip}`
        const windowDuration = 15 * 60 * 1000 // 15 minutes
        const now = new Date()

        const { data: limit } = await supabase
          .from("rate_limits")
          .select("*")
          .eq("key", rateLimitKey)
          .maybeSingle()

        if (limit) {
          const windowStart = new Date(limit.window_start)
          if (now.getTime() - windowStart.getTime() < windowDuration) {
            if (limit.count >= 5) {
              throw new Error("Too many login attempts. Please try again in 15 minutes.")
            }
            // Increment attempt count
            await supabase
              .from("rate_limits")
              .update({ count: limit.count + 1 })
              .eq("key", rateLimitKey)
          } else {
            // Reset the window
            await supabase
              .from("rate_limits")
              .update({ count: 1, window_start: now.toISOString() })
              .eq("key", rateLimitKey)
          }
        } else {
          // Initialize rate limit row
          await supabase
            .from("rate_limits")
            .insert({ key: rateLimitKey, count: 1, window_start: now.toISOString() })
        }

        // Sign in using Supabase Auth to verify credentials and obtain a valid session access token
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error || !data.user || !data.session) {
          console.error("Supabase credentials login error:", error?.message)
          // Keep rate limit count going up
          return null
        }

        // Reset rate limit count on successful login
        await supabase
          .from("rate_limits")
          .delete()
          .eq("key", rateLimitKey)

        // Fetch detailed profile from public.users table
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single()

        return {
          id: data.user.id,
          email: data.user.email,
          name: dbUser?.name || data.user.user_metadata?.name || email.split('@')[0],
          role: dbUser?.role || "student",
          supabaseAccessToken: data.session.access_token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // For Credentials provider sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "student"
        token.supabaseAccessToken = (user as any).supabaseAccessToken || null
      }

      // For Google OAuth sign in
      if (account?.provider === "google" && token.email) {
        const email = token.email.toLowerCase()
        const name = token.name || email.split('@')[0]
        const securePassword = await getGeneratedPassword(email)

        // Try to log in the Google user to Supabase Auth first
        let { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: securePassword
        })

        // If user does not exist in Supabase Auth, register them
        if (error && error.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: securePassword,
            options: {
              data: {
                name,
                role: "student",
                avatar_url: token.picture || null
              }
            }
          })

          if (!signUpError && signUpData.user) {
            // Immediately sign in to get the access token
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: securePassword
            })
            if (!signInError && signInData.session) {
              data = signInData
              error = null
            }
          } else {
            console.error("Supabase Auth registration error for Google OAuth:", signUpError?.message)
          }
        }

        if (!error && data?.user && data?.session) {
          token.id = data.user.id
          token.supabaseAccessToken = data.session.access_token
          
          // Get public profile details
          const { data: dbUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single()
            
          token.role = dbUser?.role || "student"
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).supabaseAccessToken = token.supabaseAccessToken;
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  }
})
