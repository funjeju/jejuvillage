"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

function pin(): L.DivIcon {
  const html = `
    <div style="transform:translate(-50%,-100%);">
      <span style="display:block;width:20px;height:20px;border-radius:9999px 9999px 9999px 0;background:var(--accent,#e14b5a);transform:rotate(45deg);box-shadow:0 3px 6px rgba(0,0,0,.35);border:2px solid #fff"></span>
    </div>`;
  return L.divIcon({ html, className: "jv-pin", iconSize: [0, 0], iconAnchor: [0, 0] });
}

export function LeafletLocation({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pin()} />
    </MapContainer>
  );
}
