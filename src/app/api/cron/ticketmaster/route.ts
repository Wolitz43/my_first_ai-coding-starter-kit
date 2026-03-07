import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchTicketmasterEvents,
  mapTicketmasterCategory,
  resolveEventDates,
} from "@/lib/ticketmaster";

export const maxDuration = 60;

// Regensburg city center — override via query params for other cities
const DEFAULT_LAT = 49.0134;
const DEFAULT_LNG = 12.1016;
const DEFAULT_RADIUS_KM = 10;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TICKETMASTER_API_KEY not configured" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Allow optional lat/lng/radius override via query params (for future multi-city support)
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? String(DEFAULT_LAT));
  const lng = parseFloat(searchParams.get("lng") ?? String(DEFAULT_LNG));
  const radius = parseInt(searchParams.get("radius") ?? String(DEFAULT_RADIUS_KM), 10);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let tmEvents;
  try {
    tmEvents = await fetchTicketmasterEvents(apiKey, lat, lng, radius);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/ticketmaster] API fetch failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const now = new Date();
  const results = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (const event of tmEvents) {
    const { starts_at, ends_at } = resolveEventDates(event);

    if (!starts_at) {
      results.skipped++;
      continue;
    }
    if (new Date(starts_at) <= now) {
      results.skipped++;
      continue;
    }

    const venue = event._embedded?.venues?.[0];
    const lat_venue = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
    const lng_venue = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;

    if (lat_venue === null || lng_venue === null) {
      results.skipped++;
      continue;
    }

    const addressParts = [venue?.name, venue?.address?.line1].filter(Boolean);
    const address = addressParts.join(", ") || "Unbekannt";
    const city = venue?.city?.name ?? "Regensburg";

    const row = {
      source: "ticketmaster",
      external_id: event.id,
      title: event.name.slice(0, 100),
      description: event.info ? event.info.slice(0, 1000) : null,
      category: mapTicketmasterCategory(event),
      starts_at,
      ends_at,
      address,
      lat: lat_venue,
      lng: lng_venue,
      city,
      url: event.url,
      creator_id: null,
    };

    const { error } = await supabase
      .from("events")
      .upsert(row, { onConflict: "source,external_id", ignoreDuplicates: false });

    if (error) {
      console.error("[cron/ticketmaster] Upsert error for event", event.id, error.message);
      results.errors++;
    } else {
      results.inserted++;
    }
  }

  console.log("[cron/ticketmaster] Done:", results);
  return NextResponse.json({
    ok: true,
    fetched: tmEvents.length,
    ...results,
  });
}
