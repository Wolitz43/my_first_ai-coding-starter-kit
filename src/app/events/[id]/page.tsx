import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventDetail } from "@/components/events/event-detail";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
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

  const profiles = event.profiles as unknown as { display_name: string | null } | null;
  const eventData = {
    ...event,
    profiles: undefined,
    creator_display_name: profiles?.display_name ?? null,
  };

  const isCreator = event.creator_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EventDetail event={eventData} isCreator={isCreator} />
      </div>
    </div>
  );
}
