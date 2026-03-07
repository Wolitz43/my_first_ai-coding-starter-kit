import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchMeetupEvents, mapMeetupCategory } from "@/lib/meetup";

// This route is called by Vercel Cron — protected via CRON_SECRET header.
// It uses the Supabase service role key to bypass RLS for server-side inserts.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetupApiKey = process.env.MEETUP_API_KEY;
  if (!meetupApiKey) {
    return NextResponse.json({ error: "MEETUP_API_KEY not configured" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Service role client bypasses RLS — only use server-side
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let meetupEvents;
  try {
    meetupEvents = await fetchMeetupEvents(meetupApiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/meetup] Meetup API fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const now = new Date();
  const results = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (const event of meetupEvents) {
    // Skip events without a start time or already in the past
    if (!event.dateTime) {
      results.skipped++;
      continue;
    }
    const startsAt = new Date(event.dateTime);
    if (startsAt <= now) {
      results.skipped++;
      continue;
    }

    // Skip events without a usable location
    const venue = event.venue;
    const lat = venue?.lat ?? null;
    const lng = venue?.lng ?? null;
    if (lat === null || lng === null) {
      results.skipped++;
      continue;
    }

    const address = [venue?.name, venue?.address].filter(Boolean).join(", ") || "Unbekannt";
    const city = venue?.city ?? "Regensburg";
    const category = mapMeetupCategory(event.group.category?.name);
    const title = event.title.slice(0, 100);
    const description = event.description ? event.description.slice(0, 1000) : null;

    const row = {
      source: "meetup",
      external_id: event.id,
      title,
      description,
      category,
      starts_at: startsAt.toISOString(),
      ends_at: event.endTime ? new Date(event.endTime).toISOString() : null,
      address,
      lat,
      lng,
      city,
      url: event.eventUrl,
      creator_id: null, // imported events have no user creator
    };

    const { error } = await supabase
      .from("events")
      .upsert(row, {
        onConflict: "source,external_id",
        ignoreDuplicates: false, // update existing records (e.g. time changes)
      });

    if (error) {
      console.error("[cron/meetup] Upsert error for event", event.id, error.message);
      results.errors++;
    } else {
      results.inserted++;
    }
  }

  console.log("[cron/meetup] Done:", results);
  return NextResponse.json({
    ok: true,
    fetched: meetupEvents.length,
    ...results,
  });
}
