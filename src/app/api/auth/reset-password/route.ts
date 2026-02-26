import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

  // Check if email is registered using admin client
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: userList, error: lookupError } = await adminClient.auth.admin.listUsers();
  if (lookupError) {
    console.error("[reset-password] Admin lookup error:", lookupError.message);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
  const userExists = userList.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!userExists) {
    return NextResponse.json(
      { error: "Diese E-Mail-Adresse ist nicht registriert." },
      { status: 404 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/update-password`,
  });

  if (resetError) {
    console.error("[reset-password] Supabase error:", resetError.message);
    return NextResponse.json(
      { error: "Fehler beim Senden der E-Mail. Bitte versuche es erneut." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
