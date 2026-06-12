import { supabase } from "@/lib/supabase";

export async function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60 * 60 * 1000): Promise<{ success: boolean; currentCount: number; timeLeftMinutes: number }> {
  const now = new Date();
  const { data: limit, error } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("Rate limit query error:", error.message);
    // Safe fallback: allow request if rate limit check fails due to DB issue
    return { success: true, currentCount: 1, timeLeftMinutes: 0 };
  }

  if (limit) {
    const windowStart = new Date(limit.window_start);
    const timePassed = now.getTime() - windowStart.getTime();

    if (timePassed < windowMs) {
      if (limit.count >= maxRequests) {
        const timeLeftMs = windowMs - timePassed;
        const timeLeftMinutes = Math.ceil(timeLeftMs / (60 * 1000));
        return { success: false, currentCount: limit.count, timeLeftMinutes };
      }

      // Increment count
      await supabase
        .from("rate_limits")
        .update({ count: limit.count + 1 })
        .eq("key", key);

      return { success: true, currentCount: limit.count + 1, timeLeftMinutes: 0 };
    } else {
      // Reset window
      await supabase
        .from("rate_limits")
        .update({ count: 1, window_start: now.toISOString() })
        .eq("key", key);

      return { success: true, currentCount: 1, timeLeftMinutes: 0 };
    }
  } else {
    // Create new rate limit entry
    await supabase
      .from("rate_limits")
      .insert({ key, count: 1, window_start: now.toISOString() });

    return { success: true, currentCount: 1, timeLeftMinutes: 0 };
  }
}
