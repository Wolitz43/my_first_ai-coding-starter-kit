"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EventRow } from "@/lib/events";

const LocationMap = dynamic(
  () => import("@/components/location/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full rounded-md bg-muted animate-pulse" />,
  }
);

interface EventDetailProps {
  event: EventRow;
  isCreator: boolean;
}

export function EventDetail({ event, isCreator }: EventDetailProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const startsAt = new Date(event.starts_at);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Fehler beim Loeschen.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setDeleteError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Zurueck
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
          {isCreator && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/events/${event.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Loeschen
              </Button>
            </div>
          )}
        </div>
        <Badge variant="secondary">
          <Tag className="h-3 w-3 mr-1" />
          {event.category}
        </Badge>
      </div>

      <Separator />

      {/* Meta info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{format(startsAt, "EEEE, d. MMMM yyyy", { locale: de })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{format(startsAt, "HH:mm", { locale: de })} Uhr</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="line-clamp-2">{event.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{event.creator_display_name ?? "Geloeschter User"}</span>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Beschreibung</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          </div>
        </>
      )}

      {/* URL */}
      {event.url && (
        <div>
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {event.url}
          </a>
        </div>
      )}

      <Separator />

      {/* Map */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Veranstaltungsort
        </h2>
        <LocationMap
          lat={event.lat}
          lng={event.lng}
          radiusKm={0.5}
          showPin={true}
          className="h-64 w-full rounded-md z-0"
        />
        <p className="text-xs text-muted-foreground text-center">
          {event.city ?? event.address}
        </p>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event wirklich loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Event &quot;{event.title}&quot; wird unwiderruflich geloescht.
              Andere User koennen es dann nicht mehr sehen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Wird geloescht...
                </>
              ) : (
                "Ja, Event loeschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
