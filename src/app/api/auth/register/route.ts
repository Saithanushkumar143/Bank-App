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
  return NextResponse.json(
    { error: "Registration is disabled. Please use the pre-configured static accounts.", code: "REGISTRATION_DISABLED" },
    { status: 403 }
  );
}
