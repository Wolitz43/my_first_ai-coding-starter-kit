"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LogOut, Loader2, Trash2, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationBadge } from "@/components/location/location-badge";
import { useLocation } from "@/hooks/use-location";
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

const LocationMap = dynamic(
  () => import("@/components/location/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
  }
);

const RADIUS_OPTIONS = [0.1, 0.25, 0.5, 1, 5, 20, 100] as const;

function formatRadius(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km} km`;
}

interface DashboardContentProps {
  userEmail: string;
  displayName: string | null;
}

export function DashboardContent({ userEmail, displayName }: DashboardContentProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSavingRadius, setIsSavingRadius] = useState(false);

  const { location, isLoading: locationLoading, saveLocation } = useLocation();

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

  async function handleRadiusChange(km: number) {
    if (location.lat === null || isSavingRadius) return;
    setIsSavingRadius(true);
    try {
      await saveLocation({ ...location, radiusKm: km });
    } finally {
      setIsSavingRadius(false);
    }
  }

  const hasLocation = location.lat !== null && location.lng !== null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="shrink-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight shrink-0">Near By Me 24</span>

          {/* Centered location badge */}
          <div className="flex-1 flex justify-center">
            <LocationBadge
              location={location}
              isLoading={locationLoading}
              saveLocation={saveLocation}
            />
          </div>

          {/* User menu (right) */}
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

      {/* Radius Toolbar — only visible when location is set */}
      {hasLocation && !locationLoading && (
        <div className="shrink-0 z-30 bg-white border-b px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground shrink-0">Radius:</span>
            <div className="flex gap-1.5 shrink-0">
              {RADIUS_OPTIONS.map((km) => (
                <Button
                  key={km}
                  variant={location.radiusKm === km ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs shrink-0"
                  onClick={() => handleRadiusChange(km)}
                  disabled={isSavingRadius}
                  aria-pressed={location.radiusKm === km}
                >
                  {formatRadius(km)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Map or empty state */}
      <main className="flex-1 min-h-0 relative">
        {locationLoading ? (
          <div className="h-full w-full bg-muted animate-pulse" />
        ) : hasLocation ? (
          <LocationMap
            lat={location.lat!}
            lng={location.lng!}
            radiusKm={location.radiusKm}
            className="h-full w-full z-0"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 p-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">Kein Standort gesetzt</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Klicke oben auf <strong>Standort setzen</strong>, um Events und Posts in deiner Nähe zu entdecken.
              </p>
            </div>
          </div>
        )}
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
