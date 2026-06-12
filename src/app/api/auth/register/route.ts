import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  name: z.string().min(2, "Name must be at least 2 characters long").trim(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { email, name, password } = parsed.data;

    // Check if email already exists in public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered", code: "EMAIL_EXISTS" },
        { status: 400 }
      );
    }

    // Call Supabase auth to sign up the user.
    // This will trigger email verification and copy the row to public.users via DB trigger.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/login`,
        data: {
          name,
          role: "student"
        }
      }
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email for verification.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });
  } catch (error: any) {
    console.error("Registration endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
