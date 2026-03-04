import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEventSchema } from "@/lib/events";

// GET /api/events?lat=…&lng=…&radius=…&limit=50&offset=0
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat    = parseFloat(searchParams.get("lat")    ?? "");
  const lng    = parseFloat(searchParams.get("lng")    ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "");
  const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "50", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0",  10), 0);

  let query = supabase
    .from("events")
    .select(`
      id, creator_id, title, description, category,
      starts_at, ends_at, address, lat, lng, city, url,
      created_at, updated_at,
      profiles!creator_id ( display_name )
    `)
    .order("starts_at", { ascending: true })
    .range(offset, offset + limit - 1);

  // Radius filter: only apply when all three params are valid numbers
  if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius) && radius > 0) {
    // Haversine bounding box pre-filter (fast, uses index)
    const latDelta = radius / 111.0;
    const lngDelta = radius / (111.0 * Math.cos((lat * Math.PI) / 180));
    query = query
      .gte("lat", lat - latDelta)
      .lte("lat", lat + latDelta)
      .gte("lng", lng - lngDelta)
      .lte("lng", lng + lngDelta);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the join result and apply precise Haversine post-filter when needed
  const events = (data ?? [])
    .map((row) => {
      const profiles = row.profiles as unknown as { display_name: string | null } | null;
      return {
        ...row,
        profiles: undefined,
        creator_display_name: profiles?.display_name ?? null,
      };
    })
    .filter((row) => {
      if (isNaN(lat) || isNaN(lng) || isNaN(radius) || radius <= 0) return true;
      const dLat = ((lat - row.lat) * Math.PI) / 180;
      const dLng = ((lng - row.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((row.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      const distKm = 2 * 6371 * Math.asin(Math.sqrt(a));
      return distKm <= radius;
    });

  return NextResponse.json({ events });
}

// POST /api/events
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { url, ...rest } = parsed.data;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      ...rest,
      url: url === "" ? null : url,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
