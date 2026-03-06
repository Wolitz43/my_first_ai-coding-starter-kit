"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Navigation, Loader2, AlertCircle, MousePointer2, Calendar, Clock, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LocationAutocomplete } from "./location-autocomplete";
import type { LocationData } from "@/hooks/use-location";
import type { EventRow } from "@/lib/events";
import { RADIUS_OPTIONS, formatRadius } from "@/lib/location";

const LocationMap = dynamic(
  () => import("./location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full rounded-md bg-muted animate-pulse" />,
  }
);

const DEFAULT_LAT = 51.1657;
const DEFAULT_LNG = 10.4515;

interface LocationSidePanelProps {
  currentLocation: LocationData;
  onSave: (location: LocationData) => Promise<void>;
  selectedEvent?: EventRow | null;
  onClearEvent?: () => void;
}

export function LocationSidePanel({
  currentLocation,
  onSave,
  selectedEvent,
  onClearEvent,
}: LocationSidePanelProps) {
  const [selectedLat, setSelectedLat] = useState<number | null>(currentLocation.lat);
  const [selectedLng, setSelectedLng] = useState<number | null>(currentLocation.lng);
  const [selectedCity, setSelectedCity] = useState<string | null>(currentLocation.city);
  const [selectedRadius, setSelectedRadius] = useState<number>(currentLocation.radiusKm);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [autocompleteKey, setAutocompleteKey] = useState(0);

  useEffect(() => {
    setSelectedLat(currentLocation.lat);
    setSelectedLng(currentLocation.lng);
    setSelectedCity(currentLocation.city);
    setSelectedRadius(currentLocation.radiusKm);
    setAutocompleteKey((k) => k + 1);
  }, [currentLocation.lat, currentLocation.lng, currentLocation.city, currentLocation.radiusKm]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "de" } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      return a.city ?? a.town ?? a.village ?? a.county ?? "Mein Standort";
    } catch {
      return "Mein Standort";
    }
  }

  async function handleGps() {
    setIsGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS ist in diesem Browser nicht verfügbar.");
      setIsGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = await reverseGeocode(latitude, longitude);
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        setSelectedCity(city);
        setIsGpsLoading(false);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "GPS-Berechtigung verweigert. Bitte Standort manuell eingeben."
            : "Standort konnte nicht ermittelt werden. Bitte manuell eingeben."
        );
        setIsGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleMapClick(lat: number, lng: number) {
    setIsReverseGeocoding(true);
    setSelectedLat(lat);
    setSelectedLng(lng);
    const city = await reverseGeocode(lat, lng);
    setSelectedCity(city);
    setIsReverseGeocoding(false);
  }

  async function handleSave() {
    if (selectedLat === null || selectedLng === null) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({ lat: selectedLat, lng: selectedLng, city: selectedCity, radiusKm: selectedRadius });
      toast.success("Standort gespeichert", {
        description: `${selectedCity ?? "Standort"} • ${formatRadius(selectedRadius)} Radius`,
      });
    } catch {
      setSaveError("Standort konnte nicht gespeichert werden. Bitte versuche es erneut.");
    } finally {
      setIsSaving(false);
    }
  }

  const hasLocation = selectedLat !== null && selectedLng !== null;
  const isDirty =
    selectedLat !== currentLocation.lat ||
    selectedLng !== currentLocation.lng ||
    selectedRadius !== currentLocation.radiusKm;

  const eventMarker = selectedEvent
    ? { lat: selectedEvent.lat, lng: selectedEvent.lng }
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Standort & Radius
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Lege deinen Standort fest, um Events in der Nähe zu sehen.
        </p>
      </div>

      {/* Selected Event Info Strip */}
      {selectedEvent && (
        <div className="shrink-0 border-b bg-red-50 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-semibold text-red-700">✕ Markierte Veranstaltung</span>
              </div>
              <p className="text-sm font-medium leading-tight line-clamp-1">{selectedEvent.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(selectedEvent.starts_at), "d. MMM", { locale: de })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(selectedEvent.starts_at), "HH:mm", { locale: de })} Uhr
                </span>
                <Badge variant="secondary" className="text-xs h-4 px-1.5">{selectedEvent.category}</Badge>
              </div>
            </div>
            <button
              onClick={onClearEvent}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              aria-label="Auswahl aufheben"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" className="w-full" asChild>
            <Link href={`/events/${selectedEvent.id}`}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Alle Details anzeigen
            </Link>
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* GPS Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Automatisch ermitteln
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGps}
            disabled={isGpsLoading || isReverseGeocoding}
          >
            {isGpsLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Standort wird ermittelt...</>
            ) : (
              <><Navigation className="h-4 w-4" />Meinen Standort verwenden</>
            )}
          </Button>
          {gpsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{gpsError}</AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Manual Search */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Manuell eingeben
          </p>
          <LocationAutocomplete
            key={autocompleteKey}
            onSelect={(lat, lng, city) => {
              setSelectedLat(lat);
              setSelectedLng(lng);
              setSelectedCity(city);
            }}
          />
        </div>

        <Separator />

        {/* Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Karte
            </p>
            {!selectedEvent && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MousePointer2 className="h-3 w-3" />
                Klicken zum Setzen
              </span>
            )}
          </div>
          <LocationMap
            lat={hasLocation ? selectedLat! : DEFAULT_LAT}
            lng={hasLocation ? selectedLng! : DEFAULT_LNG}
            radiusKm={selectedRadius}
            showPin={hasLocation}
            onMapClick={selectedEvent ? undefined : handleMapClick}
            scrollWheelZoom
            eventMarker={eventMarker}
            className="h-48 w-full rounded-md z-0"
          />
          <p className="text-xs text-muted-foreground text-center min-h-[1rem]">
            {isReverseGeocoding ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Ort wird ermittelt...
              </span>
            ) : selectedEvent ? (
              <span className="text-red-600 font-medium">
                {selectedEvent.city ?? selectedEvent.address}
              </span>
            ) : hasLocation ? (
              `${selectedCity ?? "Standort"} • ${formatRadius(selectedRadius)} Radius`
            ) : (
              "Klicke auf die Karte oder nutze GPS / Suche"
            )}
          </p>
        </div>

        <Separator />

        {/* Radius Selection */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Suchradius
          </p>
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map((km) => (
              <Button
                key={km}
                variant={selectedRadius === km ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRadius(km)}
                className="w-full"
                aria-pressed={selectedRadius === km}
              >
                {formatRadius(km)}
              </Button>
            ))}
          </div>
        </div>

        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!hasLocation || isSaving || isReverseGeocoding || !isDirty}
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Wird gespeichert...</>
          ) : (
            "Standort speichern"
          )}
        </Button>
      </div>
    </div>
  );
}
