import { z } from "zod";

export const EVENT_CATEGORIES = [
  "Musik",
  "Sport",
  "Kunst & Kultur",
  "Essen & Trinken",
  "Community",
  "Sonstiges",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Shared base fields used by both create and update
const eventBaseSchema = z.object({
  title: z.string().min(5, "Mindestens 5 Zeichen").max(100, "Maximal 100 Zeichen"),
  description: z
    .string()
    .max(1000, "Maximal 1000 Zeichen")
    .optional()
    .nullable(),
  category: z.enum(EVENT_CATEGORIES, { message: "Ungültige Kategorie" }),
  starts_at: z
    .string()
    .datetime({ offset: true, message: "Ungültiges Datum/Uhrzeit" })
    .refine((val) => new Date(val) > new Date(), {
      message: "Das Event muss in der Zukunft liegen",
    }),
  ends_at: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable(),
  address: z.string().min(1, "Adresse ist erforderlich"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().optional().nullable(),
  url: z
    .string()
    .url("Ungültige URL (muss mit http:// oder https:// beginnen)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const createEventSchema = eventBaseSchema;

export const updateEventSchema = eventBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Mindestens ein Feld muss angegeben werden" }
);

// Type returned from the DB (joined with creator display_name)
export interface EventRow {
  id: string;
  creator_id: string | null;
  creator_display_name: string | null;
  title: string;
  description: string | null;
  category: EventCategory;
  starts_at: string;
  ends_at: string | null;
  address: string;
  lat: number;
  lng: number;
  city: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

/** Haversine distance filter in SQL (returns distance in km) */
export function haversineWhereClause(
  lat: number,
  lng: number,
  radiusKm: number
): string {
  // Uses the standard Haversine formula expressed in SQL
  return `
    (2 * 6371 * asin(sqrt(
      power(sin(radians(${lat} - lat) / 2), 2) +
      cos(radians(lat)) * cos(radians(${lat})) *
      power(sin(radians(${lng} - lng) / 2), 2)
    ))) <= ${radiusKm}
  `;
}
