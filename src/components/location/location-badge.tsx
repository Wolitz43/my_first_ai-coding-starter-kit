"use client";

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationPickerSheet } from "./location-picker-sheet";
import { useLocation } from "@/hooks/use-location";

export function LocationBadge() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { location, isLoading, saveLocation } = useLocation();

  if (isLoading) {
    return <Skeleton className="h-8 w-36" />;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 h-8 text-sm"
        aria-label="Standort ändern"
      >
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {location.city ? (
          <span>
            {location.city} •{" "}
            {location.radiusKm < 1
              ? `${Math.round(location.radiusKm * 1000)}m`
              : `${location.radiusKm} km`}
          </span>
        ) : (
          <span className="text-muted-foreground">Standort setzen</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Button>

      <LocationPickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentLocation={location}
        onSave={saveLocation}
      />
    </>
  );
}
