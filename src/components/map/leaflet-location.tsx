"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

function pin(): L.DivIcon {
  // 좌표에 정확히 찍히는 펄스 점 마커
  const html = `
    <div style="position:relative">
      <span class="live-ring" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:9999px;color:var(--accent,#e14b5a)"></span>
      <span style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:9999px;background:var(--accent,#e14b5a);border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>
    </div>`;
  return L.divIcon({ html, className: "jv-pin", iconSize: [0, 0], iconAnchor: [0, 0] });
}

export function LeafletLocation({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={10}
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
