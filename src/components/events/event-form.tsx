"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  MapPin,
  MousePointer2,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { LocationAutocomplete } from "@/components/location/location-autocomplete";
import { EVENT_CATEGORIES, type EventCategory, type EventRow } from "@/lib/events";
import { cn } from "@/lib/utils";

const LocationMap = dynamic(
  () => import("@/components/location/location-map").then((m) => m.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-48 w-full rounded-md bg-muted animate-pulse" />,
  }
);

const DEFAULT_LAT = 51.1657;
const DEFAULT_LNG = 10.4515;

// Client-side form schema (slightly different from server: starts_at is composed from date+time)
const eventFormSchema = z.object({
  title: z.string().min(5, "Mindestens 5 Zeichen").max(100, "Maximal 100 Zeichen"),
  description: z.string().max(1000, "Maximal 1000 Zeichen").optional(),
  category: z.enum(EVENT_CATEGORIES, { message: "Bitte eine Kategorie auswaehlen" }),
  date: z.date({ error: "Datum ist erforderlich" }),
  time: z.string().min(1, "Uhrzeit ist erforderlich"),
  address: z.string().min(1, "Adresse ist erforderlich"),
  url: z
    .string()
    .url("Muss mit http:// oder https:// beginnen")
    .optional()
    .or(z.literal("")),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  /** If provided, pre-fills the form for editing */
  event?: EventRow;
  /** "create" or "edit" mode */
  mode: "create" | "edit";
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(true);

  // Location state (not in react-hook-form because it comes from map/autocomplete)
  const [lat, setLat] = useState<number | null>(event?.lat ?? null);
  const [lng, setLng] = useState<number | null>(event?.lng ?? null);
  const [city, setCity] = useState<string | null>(event?.city ?? null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Parse existing event date/time for edit mode
  const existingDate = event?.starts_at ? new Date(event.starts_at) : undefined;
  const existingTime = existingDate
    ? `${String(existingDate.getHours()).padStart(2, "0")}:${String(existingDate.getMinutes()).padStart(2, "0")}`
    : "";

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title ?? "",
      description: event?.description ?? "",
      category: event?.category ?? undefined,
      date: existingDate,
      time: existingTime,
      address: event?.address ?? "",
      url: event?.url ?? "",
    },
  });

  async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; address: string }> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "de" } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      const cityName = a.city ?? a.town ?? a.village ?? a.county ?? "Unbekannt";
      return { city: cityName, address: data.display_name ?? "" };
    } catch {
      return { city: "Unbekannt", address: "" };
    }
  }

  function handleLocationSelect(_lat: number, _lng: number, _city: string, displayName?: string) {
    setLat(_lat);
    setLng(_lng);
    setCity(_city);
    setLocationError(null);
    if (displayName) {
      form.setValue("address", displayName, { shouldValidate: true });
    }
  }

  async function handleMapClick(clickLat: number, clickLng: number) {
    setIsReverseGeocoding(true);
    setLat(clickLat);
    setLng(clickLng);
    setLocationError(null);
    const result = await reverseGeocode(clickLat, clickLng);
    setCity(result.city);
    form.setValue("address", result.address, { shouldValidate: true });
    setIsReverseGeocoding(false);
  }

  async function onSubmit(values: EventFormValues) {
    // Validate location
    if (lat === null || lng === null) {
      setLocationError("Bitte waehle einen Standort auf der Karte oder per Suche aus.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Compose ISO datetime from date + time
    const [hours, minutes] = values.time.split(":").map(Number);
    const startsAt = new Date(values.date);
    startsAt.setHours(hours, minutes, 0, 0);

    // Check future date
    if (startsAt <= new Date()) {
      setSubmitError("Das Event muss in der Zukunft liegen.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      title: values.title,
      description: values.description || null,
      category: values.category,
      starts_at: startsAt.toISOString(),
      address: values.address,
      lat,
      lng,
      city,
      url: values.url || null,
    };

    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${event!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details) {
          // Show field-level errors
          const messages = Object.values(data.details).flat().join(", ");
          setSubmitError(messages);
        } else {
          setSubmitError(data.error ?? "Ein Fehler ist aufgetreten.");
        }
        return;
      }

      const data = await res.json();
      router.push(`/events/${data.event.id}`);
    } catch {
      setSubmitError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasLocation = lat !== null && lng !== null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titel <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="z.B. Open-Air Konzert im Stadtpark"
          {...form.register("title")}
          aria-invalid={!!form.formState.errors.title}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          placeholder="Beschreibe dein Event..."
          rows={4}
          {...form.register("description")}
          aria-invalid={!!form.formState.errors.description}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {form.watch("description")?.length ?? 0} / 1000 Zeichen
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>
          Kategorie <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.watch("category")}
          onValueChange={(val) => form.setValue("category", val as EventCategory, { shouldValidate: true })}
        >
          <SelectTrigger aria-label="Kategorie auswaehlen">
            <SelectValue placeholder="Kategorie auswaehlen..." />
          </SelectTrigger>
          <SelectContent>
            {EVENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
        )}
      </div>

      {/* Date + Time row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-2">
          <Label>
            Datum <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("date") && "text-muted-foreground"
                )}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("date")
                  ? format(form.watch("date"), "PPP", { locale: de })
                  : "Datum auswaehlen"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("date")}
                onSelect={(date) => {
                  if (date) form.setValue("date", date, { shouldValidate: true });
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="time">
            Uhrzeit <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="time"
              type="time"
              className="pl-9"
              {...form.register("time")}
              aria-invalid={!!form.formState.errors.time}
            />
          </div>
          {form.formState.errors.time && (
            <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Location Section - Collapsible on mobile */}
      <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Veranstaltungsort <span className="text-destructive">*</span>
            </span>
            {locationOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-4">
          {/* Address search */}
          <div className="space-y-2">
            <Label>Adresse suchen</Label>
            <LocationAutocomplete
              placeholder="Strasse, PLZ oder Ort eingeben..."
              defaultValue={event?.address ?? ""}
              onSelect={(selectLat, selectLng, selectCity) =>
                handleLocationSelect(selectLat, selectLng, selectCity)
              }
              onSelectFull={(selectLat, selectLng, selectCity, displayName) =>
                handleLocationSelect(selectLat, selectLng, selectCity, displayName)
              }
            />
          </div>

          {/* Address field (editable, filled by autocomplete or map click) */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="Wird automatisch befuellt..."
              {...form.register("address")}
              aria-invalid={!!form.formState.errors.address}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Karte
              </p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MousePointer2 className="h-3 w-3" />
                Klicken zum Setzen
              </span>
            </div>
            <LocationMap
              lat={hasLocation ? lat! : DEFAULT_LAT}
              lng={hasLocation ? lng! : DEFAULT_LNG}
              radiusKm={0.5}
              showPin={hasLocation}
              onMapClick={handleMapClick}
              scrollWheelZoom
              className="h-48 w-full rounded-md z-0"
            />
            <p className="text-xs text-muted-foreground text-center min-h-[1rem]">
              {isReverseGeocoding ? (
                <span className="flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Adresse wird ermittelt...
                </span>
              ) : hasLocation ? (
                `${city ?? "Standort"} - ${lat!.toFixed(4)}, ${lng!.toFixed(4)}`
              ) : (
                "Klicke auf die Karte oder nutze die Suche oben"
              )}
            </p>
          </div>

          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">Link / Website (optional)</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://..."
          {...form.register("url")}
          aria-invalid={!!form.formState.errors.url}
        />
        {form.formState.errors.url && (
          <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Wird erstellt..." : "Wird gespeichert..."}
            </>
          ) : mode === "create" ? (
            "Event erstellen"
          ) : (
            "Aenderungen speichern"
          )}
        </Button>
      </div>
    </form>
  );
}
