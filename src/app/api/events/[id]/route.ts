import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateEventSchema } from "@/lib/events";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/events/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id, creator_id, title, description, category,
      starts_at, ends_at, address, lat, lng, city, url,
      created_at, updated_at,
      profiles!creator_id ( display_name )
    `)
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const profiles = event.profiles as unknown as { display_name: string | null } | null;
  return NextResponse.json({
    event: {
      ...event,
      profiles: undefined,
      creator_display_name: profiles?.display_name ?? null,
    },
  });
}

// PATCH /api/events/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
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

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updates = parsed.data;
  if ("url" in updates && updates.url === "") {
    updates.url = null;
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id)   // RLS double-check
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !event) {
    return NextResponse.json(
      { error: "Event nicht gefunden oder keine Berechtigung" },
      { status: 404 }
    );
  }

  return NextResponse.json({ event });
}

// DELETE /api/events/[id]  — soft delete
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", user.id)   // RLS double-check
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !event) {
    return NextResponse.json(
      { error: "Event nicht gefunden oder keine Berechtigung" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
