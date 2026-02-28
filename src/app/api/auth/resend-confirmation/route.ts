import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Rate limit: max 3 resend requests per 15 minutes per email
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
  }

  const { email } = parsed.data;
  const rateKey = email.toLowerCase();
  const now = Date.now();

  const rateInfo = rateLimitStore.get(rateKey);
  if (rateInfo && now < rateInfo.resetAt && rateInfo.count >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((rateInfo.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `Zu viele Anfragen. Bitte warte ${waitMinutes} Minute(n).`, rateLimited: true },
      { status: 429 }
    );
  }

  const current = rateLimitStore.get(rateKey);
  if (current && now < current.resetAt) {
    rateLimitStore.set(rateKey, { count: current.count + 1, resetAt: current.resetAt });
  } else {
    rateLimitStore.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[resend-confirmation] Error:", error.message);
    return NextResponse.json(
      { error: "Bestätigungsmail konnte nicht gesendet werden. Bitte versuche es später erneut." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
