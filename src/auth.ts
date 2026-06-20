import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase"
import { headers } from "next/headers"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)
        const requestedRole = credentials.role ? String(credentials.role).toLowerCase().trim() : undefined

        // Predefined static user credentials
        const user1Email = 'yegotisaithanushkumar143@gmail.com'
        const user2Email = 'vyshnavirayapudi86@gmail.com'
        const user1Password = process.env.NEXT_PUBLIC_USER_1_PASSWORD || 'bankpass123'
        const user2Password = process.env.NEXT_PUBLIC_USER_2_PASSWORD || 'vyshnavi123'

        if (email !== user1Email && email !== user2Email) {
          throw new Error("Access restricted. Only pre-configured static users can log in.")
        }

        const isUser1 = email === user1Email
        const expectedPassword = isUser1 ? user1Password : user2Password

        if (password !== expectedPassword) {
          throw new Error("Invalid password.")
        }

        // Determine target role (Thanush can log in as admin or student)
        let targetRole = "student"
        if (isUser1) {
          targetRole = requestedRole === "student" ? "student" : "admin"
        }

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
        let { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        // If user does not exist in Supabase Auth, register them automatically
        if (error && error.message.includes("Invalid login credentials")) {
          console.log(`User ${email} not found in Supabase Auth. Attempting auto-registration...`)
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: isUser1 ? "Thanush" : "Vyshnavi Rayapudi",
                role: targetRole,
              }
            }
          })

          if (signUpError) {
            console.error("Auto-registration failed:", signUpError.message)
            if (signUpError.message.includes("rate limit") || signUpError.status === 429) {
              throw new Error("Email rate limit exceeded. Please create this user manually in the Supabase Dashboard and check 'Auto-confirm user', or disable 'Confirm email' under Providers -> Email.")
            } else {
              throw new Error(`Auto-registration failed: ${signUpError.message}. Please configure this user in your Supabase Auth dashboard.`)
            }
          }

          // Registration succeeded or email sent. Try to sign in again.
          const retry = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (retry.error) {
            console.error("Sign in failed after auto-registration:", retry.error.message)
            if (retry.error.message.includes("Email not confirmed")) {
              throw new Error("User created, but email confirmation is required. Please disable 'Confirm email' in your Supabase Dashboard under Authentication -> Providers -> Email, or click the confirmation link sent to your email.")
            }
            throw new Error(`Auto-registration succeeded, but login failed: ${retry.error.message}. Please verify the user in the Supabase Dashboard.`)
          }

          data = retry.data
          error = null
        }

        if (error || !data.user || !data.session) {
          console.error("Supabase credentials login error:", error?.message)
          throw new Error(error?.message || "Authentication failed.")
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

        // Sync local requested role (Thanush admin/student toggling) to public.users table if different
        if (dbUser && dbUser.role !== targetRole) {
          await supabase
            .from("users")
            .update({ role: targetRole })
            .eq("id", data.user.id)
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: isUser1 ? "Thanush" : "Vyshnavi Rayapudi",
          role: targetRole,
          supabaseAccessToken: data.session.access_token,
          supabaseRefreshToken: data.session.refresh_token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "student"
        token.supabaseAccessToken = (user as any).supabaseAccessToken || null
        token.supabaseRefreshToken = (user as any).supabaseRefreshToken || null
        token.expiresAt = Math.floor(Date.now() / 1000) + 3600
      }

      // Check if Supabase access token is close to expiring (e.g. within 5 minutes)
      const nowInSeconds = Math.floor(Date.now() / 1000)
      if (token.expiresAt && nowInSeconds > (token.expiresAt as number) - 300) {
        if (token.supabaseRefreshToken) {
          try {
            console.log("Refreshing expired Supabase access token...")
            const { data, error } = await supabase.auth.refreshSession({
              refresh_token: token.supabaseRefreshToken as string
            })
            if (error) throw error
            token.supabaseAccessToken = data.session?.access_token || null
            token.supabaseRefreshToken = data.session?.refresh_token || null
            token.expiresAt = Math.floor(Date.now() / 1000) + (data.session?.expires_in || 3600)
            console.log("Supabase access token refreshed successfully.")
          } catch (e) {
            console.error("Failed to refresh Supabase access token:", (e as any).message || e)
          }
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
