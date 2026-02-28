import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

// BUG-2: In-memory rate limiter (resets on server restart; sufficient for hobby project)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;
  const rateKey = email.toLowerCase();
  const now = Date.now();

  // Check rate limit
  const rateInfo = rateLimitStore.get(rateKey);
  if (rateInfo && now < rateInfo.resetAt && rateInfo.count >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((rateInfo.resetAt - now) / 60000);
    return NextResponse.json(
      {
        error: `Zu viele Fehlversuche. Bitte warte ${waitMinutes} Minute(n).`,
        rateLimited: true,
      },
      { status: 429 }
    );
  }

  // Build response so we can attach cookies
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // BUG-1: When rememberMe is false, omit maxAge → session cookie (expires on browser close)
            const cookieOptions = rememberMe
              ? options
              : { ...options, maxAge: undefined };
            response.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // E-Mail noch nicht bestätigt – kein Rate-Limit erhöhen
    if (error.code === "email_not_confirmed") {
      return NextResponse.json(
        { error: "E-Mail noch nicht bestätigt.", emailNotConfirmed: true },
        { status: 403 }
      );
    }

    // Increment rate limit counter
    const current = rateLimitStore.get(rateKey);
    if (current && now < current.resetAt) {
      rateLimitStore.set(rateKey, { count: current.count + 1, resetAt: current.resetAt });
    } else {
      rateLimitStore.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }

    return NextResponse.json(
      { error: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut." },
      { status: 401 }
    );
  }

  // Successful login: clear rate limit
  rateLimitStore.delete(rateKey);

  return response;
}
