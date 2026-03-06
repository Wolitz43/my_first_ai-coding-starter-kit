"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LogOut, Loader2, Trash2, User, MapPin, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "@/hooks/use-location";
import { EventCard } from "@/components/events/event-card";
import type { EventRow } from "@/lib/events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const LocationSidePanel = dynamic(
  () => import("@/components/location/location-side-panel").then((m) => m.LocationSidePanel),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
  }
);

interface DashboardContentProps {
  userEmail: string;
  displayName: string | null;
}

export function DashboardContent({ userEmail, displayName }: DashboardContentProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  const { location, isLoading: locationLoading, saveLocation } = useLocation();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  const fetchEvents = useCallback(async () => {
    if (location.lat === null || location.lng === null) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: String(location.radiusKm),
        limit: "50",
      });
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) {
        setEventsError("Events konnten nicht geladen werden.");
        return;
      }
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEventsError("Netzwerkfehler beim Laden der Events.");
    } finally {
      setEventsLoading(false);
    }
  }, [location.lat, location.lng, location.radiusKm]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Switch to map tab when event is selected so the red cross is visible
  function handleSelectEvent(event: EventRow) {
    setSelectedEvent((prev) => {
      const next = prev?.id === event.id ? null : event;
      if (next) setActiveTab("standort");
      return next;
    });
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Fehler beim Löschen des Kontos.");
        return;
      }
      window.location.href = "/login";
    } catch {
      setDeleteError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasLocation = location.lat !== null && location.lng !== null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 z-40 bg-white border-b">
        <div className="max-w-full px-4 h-14 flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight shrink-0">Near By Me 24</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline-block truncate max-w-[160px]">
              {displayName ?? userEmail}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Benutzermenü">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Abmelden
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/impressum" className="flex items-center cursor-pointer">
                    <span className="mr-2 text-base">§</span>
                    Impressum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Konto löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main: Tabs */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* Tab bar */}
          <div className="shrink-0 border-b bg-white px-4">
            <TabsList className="h-10 bg-transparent p-0 gap-0 rounded-none">
              <TabsTrigger
                value="events"
                className="relative h-10 rounded-none border-b-2 border-transparent px-4 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent shadow-none"
              >
                <span className="flex items-center gap-2">
                  Veranstaltungen
                  {!eventsLoading && (
                    <Badge
                      variant={events.length > 0 ? "default" : "secondary"}
                      className="h-5 px-1.5 text-xs"
                    >
                      {events.length}
                    </Badge>
                  )}
                  {eventsLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="standort"
                className="relative h-10 rounded-none border-b-2 border-transparent px-4 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent shadow-none"
              >
                <span className="flex items-center gap-2">
                  Standort & Radius
                  {selectedEvent && (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Events tab */}
          <TabsContent
            value="events"
            className="flex-1 min-h-0 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            {/* Sub-header with location info + create button */}
            <div className="shrink-0 px-4 py-2 border-b bg-white flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {hasLocation && !locationLoading
                  ? `${location.city} • ${location.radiusKm < 1 ? `${Math.round(location.radiusKm * 1000)} m` : `${location.radiusKm} km`} Radius`
                  : "Kein Standort gesetzt"}
              </p>
              {hasLocation && (
                <Button size="sm" asChild>
                  <Link href="/events/create">
                    <Plus className="h-4 w-4 mr-1" />
                    Event erstellen
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {locationLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : !hasLocation ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center space-y-3 max-w-xs">
                    <MapPin className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h3 className="font-semibold">Kein Standort gesetzt</h3>
                    <p className="text-sm text-muted-foreground">
                      Wechsle zum Reiter <strong>Standort & Radius</strong>, um deinen Standort festzulegen.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("standort")}>
                      Zum Standort
                    </Button>
                  </div>
                </div>
              ) : eventsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : eventsError ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center space-y-3 max-w-xs">
                    <Calendar className="h-10 w-10 text-destructive mx-auto" />
                    <h3 className="font-semibold">Fehler</h3>
                    <p className="text-sm text-muted-foreground">{eventsError}</p>
                    <Button variant="outline" size="sm" onClick={fetchEvents}>
                      Erneut versuchen
                    </Button>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center space-y-3 max-w-xs">
                    <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h3 className="font-semibold">Noch keine Veranstaltungen</h3>
                    <p className="text-sm text-muted-foreground">
                      In deinem Umkreis wurden noch keine Events gefunden. Erstelle das erste!
                    </p>
                    <Button size="sm" asChild>
                      <Link href="/events/create">
                        <Plus className="h-4 w-4 mr-1" />
                        Event erstellen
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSelected={selectedEvent?.id === event.id}
                      onSelect={handleSelectEvent}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Standort tab */}
          <TabsContent
            value="standort"
            className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
          >
            {locationLoading ? (
              <div className="h-full w-full bg-muted animate-pulse" />
            ) : (
              <LocationSidePanel
                currentLocation={location}
                onSave={saveLocation}
                selectedEvent={selectedEvent}
                onClearEvent={() => setSelectedEvent(null)}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Dein Konto und alle
              zugehörigen Daten werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Wird gelöscht...
                </>
              ) : (
                "Ja, Konto löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
