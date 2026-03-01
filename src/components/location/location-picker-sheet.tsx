"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Loader2, AlertCircle, MousePointer2 } from "lucide-react";

const LocationMap = dynamic(
  () => import("./location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full rounded-md bg-muted animate-pulse" />,
  }
);
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LocationAutocomplete } from "./location-autocomplete";
import type { LocationData } from "@/hooks/use-location";
import { RADIUS_OPTIONS, formatRadius } from "@/lib/location";

// Default map center when no location is set yet (Germany)
const DEFAULT_LAT = 51.1657;
const DEFAULT_LNG = 10.4515;

interface LocationPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: LocationData;
  onSave: (location: LocationData) => Promise<void>;
}

export function LocationPickerSheet({
  open,
  onOpenChange,
  currentLocation,
  onSave,
}: LocationPickerSheetProps) {
  const [selectedLat, setSelectedLat] = useState<number | null>(currentLocation.lat);
  const [selectedLng, setSelectedLng] = useState<number | null>(currentLocation.lng);
  const [selectedCity, setSelectedCity] = useState<string | null>(currentLocation.city);
  const [selectedRadius, setSelectedRadius] = useState<number>(currentLocation.radiusKm);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Sync form state when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedLat(currentLocation.lat);
      setSelectedLng(currentLocation.lng);
      setSelectedCity(currentLocation.city);
      setSelectedRadius(currentLocation.radiusKm);
      setGpsError(null);
      setSaveError(null);
    }
  }, [open, currentLocation]);

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
        if (err.code === 1) {
          setGpsError("GPS-Berechtigung verweigert. Bitte Standort manuell eingeben.");
        } else {
          setGpsError("Standort konnte nicht ermittelt werden. Bitte manuell eingeben.");
        }
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
      await onSave({
        lat: selectedLat,
        lng: selectedLng,
        city: selectedCity,
        radiusKm: selectedRadius,
      });
      onOpenChange(false);
    } catch {
      setSaveError("Standort konnte nicht gespeichert werden. Bitte versuche es erneut.");
    } finally {
      setIsSaving(false);
    }
  }

  const hasLocation = selectedLat !== null && selectedLng !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Standort & Radius
          </SheetTitle>
          <SheetDescription>
            Lege deinen Standort fest, um Events und Posts in der Nähe zu sehen.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* GPS Section */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Automatisch ermitteln</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGps}
              disabled={isGpsLoading || isReverseGeocoding}
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Standort wird ermittelt...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Meinen Standort verwenden
                </>
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
          <div className="space-y-3">
            <p className="text-sm font-medium">Manuell eingeben</p>
            <LocationAutocomplete
              key={open ? "open" : "closed"}
              onSelect={(lat, lng, city) => {
                setSelectedLat(lat);
                setSelectedLng(lng);
                setSelectedCity(city);
              }}
            />
          </div>

          <Separator />

          {/* Map — always visible, clickable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Karte</p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MousePointer2 className="h-3 w-3" />
                Klicken zum Setzen
              </span>
            </div>
            <LocationMap
              lat={hasLocation ? selectedLat! : DEFAULT_LAT}
              lng={hasLocation ? selectedLng! : DEFAULT_LNG}
              radiusKm={selectedRadius}
              showPin={hasLocation}
              onMapClick={handleMapClick}
              scrollWheelZoom
              className="h-56 w-full rounded-md z-0"
            />
            <p className="text-xs text-muted-foreground text-center min-h-[1rem]">
              {isReverseGeocoding ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Ort wird ermittelt...
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
          <div className="space-y-3">
            <p className="text-sm font-medium">Suchradius</p>
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

          {/* Save Error */}
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hasLocation || isSaving || isReverseGeocoding}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              "Standort speichern"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
