"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

interface LocationAutocompleteProps {
  onSelect: (lat: number, lng: number, city: string) => void;
  /** Called with the full display_name from Nominatim (useful for address fields) */
  onSelectFull?: (lat: number, lng: number, city: string, displayName: string) => void;
  placeholder?: string;
  /** Initial value to display in the input */
  defaultValue?: string;
}

export function LocationAutocomplete({
  onSelect,
  onSelectFull,
  placeholder = "Stadt oder PLZ eingeben...",
  defaultValue = "",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
          { headers: { "Accept-Language": "de" } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getDisplayCity(result: NominatimResult): string {
    const a = result.address;
    return a.city ?? a.town ?? a.village ?? a.county ?? result.display_name.split(",")[0];
  }

  function getSubtitle(result: NominatimResult): string {
    return result.display_name.split(",").slice(1, 3).join(",").trim();
  }

  function handleSelect(result: NominatimResult) {
    const city = getDisplayCity(result);
    onSelect(parseFloat(result.lat), parseFloat(result.lon), city);
    onSelectFull?.(parseFloat(result.lat), parseFloat(result.lon), city, result.display_name);
    setQuery(city);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          onFocus={() => results.length > 0 && setIsOpen(true)}
          aria-label="Standort suchen"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden"
        >
          {results.map((result) => (
            <li
              key={result.place_id}
              role="option"
              aria-selected={false}
              className="px-3 py-2.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={() => handleSelect(result)}
            >
              <span className="font-medium">{getDisplayCity(result)}</span>
              <span className="ml-1.5 text-muted-foreground text-xs">{getSubtitle(result)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
