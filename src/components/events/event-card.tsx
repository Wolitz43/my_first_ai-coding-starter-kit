"use client";

import Link from "next/link";
import { MapPin, Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventRow } from "@/lib/events";

interface EventCardProps {
  event: EventRow;
}

export function EventCard({ event }: EventCardProps) {
  const startsAt = new Date(event.starts_at);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="transition-colors hover:bg-accent/50 border">
        <CardContent className="p-4 space-y-2">
          {/* Title + Category */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {event.title}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {event.category}
            </Badge>
          </div>

          {/* Date + Time */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(startsAt, "d. MMM yyyy", { locale: de })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(startsAt, "HH:mm", { locale: de })} Uhr
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.city ?? event.address}</span>
          </div>

          {/* Description preview */}
          {event.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Creator */}
          <p className="text-xs text-muted-foreground/70">
            von {event.creator_display_name ?? "Geloeschter User"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
