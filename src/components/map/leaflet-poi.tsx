"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Poi, PoiCategory } from "@/lib/types";

const CATEGORY_CONFIG: Record<PoiCategory, { color: string; emoji: string; label: string }> = {
  restaurant: { color: "#e14b5a", emoji: "🍽️", label: "식당" },
  cafe: { color: "#d97706", emoji: "☕", label: "카페" },
  experience: { color: "#2563eb", emoji: "🎒", label: "체험" },
  tourist_spot: { color: "#059669", emoji: "📸", label: "관광지" },
};

function poiIcon(poi: Poi, selected: boolean): L.DivIcon {
  const cfg = CATEGORY_CONFIG[poi.category] ?? CATEGORY_CONFIG.tourist_spot;
  const size = selected ? 38 : 32;
  const html = `
    <div style="position:relative;cursor:pointer;${selected ? "z-index:1000" : ""}">
      <span style="
        position:absolute;left:0;top:0;transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${cfg.color};border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.35);
        display:grid;place-items:center;
        font-size:${selected ? 18 : 15}px;line-height:1;
      ">${cfg.emoji}</span>
    </div>`;
  return L.divIcon({ html, className: "jv-poi", iconSize: [0, 0], iconAnchor: [0, 0] });
}

function villagePin(lat: number, lng: number, name: string): L.DivIcon {
  const html = `
    <div style="position:relative;z-index:900">
      <span style="
        position:absolute;left:0;bottom:10px;transform:translateX(-50%);
        white-space:nowrap;font-weight:800;font-size:13px;line-height:1;
        padding:6px 14px;border-radius:9999px;
        background:var(--accent,#3e8e41);color:#fff;
        box-shadow:0 3px 10px rgba(0,0,0,.3);
      ">${name.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))}</span>
      <span style="
        position:absolute;left:0;top:0;transform:translate(-50%,-50%);
        width:16px;height:16px;border-radius:9999px;
        background:var(--accent,#3e8e41);border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.4);
      "></span>
    </div>`;
  return L.divIcon({ html, className: "jv-pin", iconSize: [0, 0], iconAnchor: [0, 0] });
}

export function LeafletPoi({
  center,
  villageName,
  pois,
  visibleCategories,
  selectedId,
  onSelect,
}: {
  center: [number, number];
  villageName: string;
  pois: Poi[];
  visibleCategories: Set<PoiCategory>;
  selectedId: string | null;
  onSelect: (poi: Poi | null) => void;
}) {
  const filtered = pois.filter((p) => visibleCategories.has(p.category));

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      aria-label="마을 주변 지도"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center} icon={villagePin(center[0], center[1], villageName)} />
      {filtered.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
          icon={poiIcon(poi, selectedId === poi.id)}
          eventHandlers={{
            click: () => onSelect(selectedId === poi.id ? null : poi),
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong style={{ fontSize: 14 }}>{poi.name}</strong>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {CATEGORY_CONFIG[poi.category]?.label}
                {poi.address ? ` · ${poi.address}` : ""}
              </div>
              {poi.description && (
                <p style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{poi.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export { CATEGORY_CONFIG };
