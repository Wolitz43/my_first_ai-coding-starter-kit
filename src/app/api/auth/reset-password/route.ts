import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Rate limit: max 3 password reset requests per 15 minutes per email
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const resetPasswordSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const rateKey = email.toLowerCase();
  const now = Date.now();

  // Check rate limit
  const rateInfo = rateLimitStore.get(rateKey);
  if (rateInfo && now < rateInfo.resetAt && rateInfo.count >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((rateInfo.resetAt - now) / 60000);
    return NextResponse.json(
      {
        error: `Zu viele Anfragen. Bitte warte ${waitMinutes} Minute(n).`,
        rateLimited: true,
      },
      { status: 429 }
    );
  }

  // Increment counter before sending (prevents email flooding)
  const current = rateLimitStore.get(rateKey);
  if (current && now < current.resetAt) {
    rateLimitStore.set(rateKey, { count: current.count + 1, resetAt: current.resetAt });
  } else {
    rateLimitStore.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  });

  // Always return success to prevent account enumeration
  return NextResponse.json({ success: true });
}
