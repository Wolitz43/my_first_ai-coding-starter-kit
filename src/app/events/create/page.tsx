import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";

export default async function CreateEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl font-bold">Neues Event erstellen</h1>
          <p className="text-sm text-muted-foreground">
            Teile ein Event mit der Community. Pflichtfelder sind mit * markiert.
          </p>
        </div>
        <EventForm mode="create" />
      </div>
    </div>
  );
}
