import { EventCategory } from "@/lib/events";

const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2";

export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  info: string | null;
  dates: {
    start: {
      dateTime?: string;   // ISO 8601 UTC
      localDate?: string;  // fallback: "2026-03-15"
      localTime?: string;  // fallback: "20:00:00"
    };
    end?: {
      dateTime?: string;
    };
  };
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: { line1?: string };
      city?: { name: string };
      location?: { latitude: string; longitude: string };
    }>;
  };
}

interface TicketmasterResponse {
  _embedded?: { events?: TicketmasterEvent[] };
  page: { size: number; totalElements: number; totalPages: number; number: number };
}

export async function fetchTicketmasterEvents(
  apiKey: string,
  lat: number,
  lng: number,
  radiusKm: number
): Promise<TicketmasterEvent[]> {
  const allEvents: TicketmasterEvent[] = [];
  const pageSize = 200; // Ticketmaster max
  let page = 0;
  let totalPages = 1;

  // Fetch all pages (respects 5000/day rate limit — max ~25 pages needed)
  while (page < totalPages && page < 5) {
    const params = new URLSearchParams({
      apikey: apiKey,
      latlong: `${lat},${lng}`,
      radius: String(radiusKm),
      unit: "km",
      size: String(pageSize),
      page: String(page),
      // Only future events
      startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      sort: "date,asc",
    });

    const response = await fetch(`${TICKETMASTER_BASE_URL}/events.json?${params}`);

    if (!response.ok) {
      throw new Error(
        `Ticketmaster API HTTP error: ${response.status} ${response.statusText}`
      );
    }

    const json = (await response.json()) as TicketmasterResponse;
    const events = json._embedded?.events ?? [];
    allEvents.push(...events);

    totalPages = json.page.totalPages;
    page++;
  }

  return allEvents;
}

export function mapTicketmasterCategory(event: TicketmasterEvent): EventCategory {
  const segment = (event.classifications?.[0]?.segment?.name ?? "").toLowerCase();
  const genre = (event.classifications?.[0]?.genre?.name ?? "").toLowerCase();

  if (segment === "music") return "Musik";
  if (segment === "sports") return "Sport";
  if (segment === "arts & theatre" || segment === "film" || genre.includes("classical"))
    return "Kunst & Kultur";
  if (genre.includes("food") || genre.includes("drink")) return "Essen & Trinken";
  if (segment === "miscellaneous" && genre.includes("community")) return "Community";
  return "Sonstiges";
}

export function resolveEventDates(event: TicketmasterEvent): {
  starts_at: string | null;
  ends_at: string | null;
} {
  let starts_at: string | null = null;

  if (event.dates.start.dateTime) {
    starts_at = event.dates.start.dateTime;
  } else if (event.dates.start.localDate) {
    const time = event.dates.start.localTime ?? "00:00:00";
    starts_at = `${event.dates.start.localDate}T${time}`;
  }

  const ends_at = event.dates.end?.dateTime ?? null;

  return { starts_at, ends_at };
}
