import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Rate limit: max 5 signup attempts per email per hour
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const signupSchema = z.object({
  displayName: z
    .string()
    .min(3, "Anzeigename muss mindestens 3 Zeichen lang sein")
    .max(30, "Anzeigename darf maximal 30 Zeichen lang sein")
    .regex(
      /^[a-zA-ZäöüÄÖÜß0-9_-]+$/,
      "Nur Buchstaben, Zahlen, Unterstriche und Bindestriche erlaubt"
    ),
  email: z.string().email("Ungueltige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungueltige Eingabe" },
      { status: 400 }
    );
  }

  const { email, password, displayName } = parsed.data;
  const rateKey = email.toLowerCase();
  const now = Date.now();

  // Check rate limit
  const rateInfo = rateLimitStore.get(rateKey);
  if (rateInfo && now < rateInfo.resetAt && rateInfo.count >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((rateInfo.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `Zu viele Versuche. Bitte warte ${waitMinutes} Minute(n).` },
      { status: 429 }
    );
  }

  // Increment counter
  const current = rateLimitStore.get(rateKey);
  if (current && now < current.resetAt) {
    rateLimitStore.set(rateKey, { count: current.count + 1, resetAt: current.resetAt });
  } else {
    rateLimitStore.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[signup] Supabase error:", error.message);
    return NextResponse.json(
      { error: `[DEBUG] ${error.message}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
