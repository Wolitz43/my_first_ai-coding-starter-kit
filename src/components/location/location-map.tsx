"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons — use locally bundled files from /public/leaflet/
const DefaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Red cross divIcon for selected event position
const RedCrossIcon = L.divIcon({
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;top:10px;left:0;width:22px;height:2px;background:#dc2626;border-radius:1px;"></div>
    <div style="position:absolute;left:10px;top:0;width:2px;height:22px;background:#dc2626;border-radius:1px;"></div>
  </div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function getZoomForRadius(radiusKm: number): number {
  if (radiusKm <= 0.1) return 16;
  if (radiusKm <= 0.25) return 15;
  if (radiusKm <= 0.5) return 14;
  if (radiusKm <= 1) return 13;
  if (radiusKm <= 5) return 11;
  if (radiusKm <= 20) return 9;
  return 7;
}

function MapViewUpdater({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], getZoomForRadius(radiusKm), { animate: true });
  }, [lat, lng, radiusKm, map]);
  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface EventMarker {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  className?: string;
  /** Show marker and radius circle at the given position */
  showPin?: boolean;
  /** Enable scroll-wheel zooming (default: false) */
  scrollWheelZoom?: boolean;
  /** Called when the user clicks on the map */
  onMapClick?: (lat: number, lng: number) => void;
  /** Red cross marker at selected event position */
  eventMarker?: EventMarker;
}

export function LocationMap({
  lat,
  lng,
  radiusKm,
  className = "h-48 w-full rounded-md z-0",
  showPin = true,
  scrollWheelZoom = false,
  onMapClick,
  eventMarker,
}: LocationMapProps) {
  // When an event is selected, center map on it at street level
  const viewLat = eventMarker ? eventMarker.lat : lat;
  const viewLng = eventMarker ? eventMarker.lng : lng;
  const viewRadius = eventMarker ? 0.5 : radiusKm;

  return (
    <div className={onMapClick ? "[&_.leaflet-container]:cursor-crosshair" : undefined}>
      <MapContainer
        center={[viewLat, viewLng]}
        zoom={showPin ? getZoomForRadius(viewRadius) : 6}
        className={className}
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {/* User location pin + radius */}
        {showPin && <Marker position={[lat, lng]} />}
        {showPin && !eventMarker && (
          <Circle
            center={[lat, lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#2563eb",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}
        {/* Event red cross */}
        {eventMarker && (
          <Marker position={[eventMarker.lat, eventMarker.lng]} icon={RedCrossIcon} />
        )}
        <MapViewUpdater lat={viewLat} lng={viewLng} radiusKm={viewRadius} />
        {onMapClick && <MapClickHandler onClick={onMapClick} />}
      </MapContainer>
    </div>
  );
}
