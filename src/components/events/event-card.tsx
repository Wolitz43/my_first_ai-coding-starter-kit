"use client";

import { MapPin, Calendar, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventRow } from "@/lib/events";

interface EventCardProps {
  event: EventRow;
  isSelected?: boolean;
  onSelect?: (event: EventRow) => void;
}

export function EventCard({ event, isSelected, onSelect }: EventCardProps) {
  const startsAt = new Date(event.starts_at);

  return (
    <button
      onClick={() => onSelect?.(event)}
      className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <Card
        className={`transition-all border ${
          isSelected
            ? "border-red-500 bg-red-50 shadow-sm"
            : "hover:bg-accent/50 hover:border-accent-foreground/20"
        }`}
      >
        <CardContent className="p-4 space-y-2">
          {/* Title + Category */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-sm leading-tight line-clamp-2 transition-colors ${
                isSelected ? "text-red-700" : "group-hover:text-primary"
              }`}
            >
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
            <MapPin className={`h-3 w-3 shrink-0 ${isSelected ? "text-red-500" : ""}`} />
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
            von {event.creator_display_name ?? "Gelöschter User"}
          </p>
        </CardContent>
      </Card>
    </button>
  );
}
