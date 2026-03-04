import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
    .is("deleted_at", null)
    .single();

  if (error || !event) {
    notFound();
  }

  // Only the creator can edit
  if (event.creator_id !== user.id) {
    redirect(`/events/${id}`);
  }

  const profiles = event.profiles as unknown as { display_name: string | null } | null;
  const eventData = {
    ...event,
    profiles: undefined,
    creator_display_name: profiles?.display_name ?? null,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl font-bold">Event bearbeiten</h1>
          <p className="text-sm text-muted-foreground">
            Aendere die Details deines Events. Pflichtfelder sind mit * markiert.
          </p>
        </div>
        <EventForm mode="edit" event={eventData} />
      </div>
    </div>
  );
}
