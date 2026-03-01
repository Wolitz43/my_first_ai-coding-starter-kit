"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
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

interface LocationMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  className?: string;
}

export function LocationMap({ lat, lng, radiusKm, className = "h-48 w-full rounded-md z-0" }: LocationMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={getZoomForRadius(radiusKm)}
      className={className}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]} />
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
      <MapViewUpdater lat={lat} lng={lng} radiusKm={radiusKm} />
    </MapContainer>
  );
}
