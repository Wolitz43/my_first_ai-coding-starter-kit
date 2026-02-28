"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface LocationData {
  lat: number | null;
  lng: number | null;
  city: string | null;
  radiusKm: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    lat: null,
    lng: null,
    city: null,
    radiusKm: 10,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("location_lat, location_lng, location_city, location_radius_km")
        .eq("id", user.id)
        .single();

      if (data) {
        setLocation({
          lat: data.location_lat ?? null,
          lng: data.location_lng ?? null,
          city: data.location_city ?? null,
          radiusKm: data.location_radius_km ?? 10,
        });
      }

      setIsLoading(false);
    }

    fetchLocation();
  }, []);

  async function saveLocation(newLocation: LocationData) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        location_lat: newLocation.lat,
        location_lng: newLocation.lng,
        location_city: newLocation.city,
        location_radius_km: newLocation.radiusKm,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    setLocation(newLocation);
  }

  return { location, isLoading, saveLocation };
}
