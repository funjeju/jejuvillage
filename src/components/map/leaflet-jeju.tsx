"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useRouter } from "next/navigation";
import type { VillageSummary } from "@/lib/types";

const JEJU_CENTER: [number, number] = [33.38, 126.55];

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function pinIcon(v: VillageSummary, active: boolean): L.DivIcon {
  // 좌표에 '점'을 정확히 찍고, 이름 라벨은 점 위에 띄운다. 라이브면 점이 펄스.
  const dotColor = v.isLive ? "#e14b5a" : "#3e8e41";
  const labelBg = active ? "var(--accent, #e14b5a)" : "#ffffff";
  const labelFg = active ? "#ffffff" : "#24301f";
  const d = active ? 17 : 14;
  const pulse = v.isLive
    ? `<span class="live-ring" style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:${d}px;height:${d}px;border-radius:9999px;color:#e14b5a"></span>`
    : "";
  const html = `
    <div style="position:relative;cursor:pointer;${active ? "z-index:1000" : ""}">
      <span style="position:absolute;left:0;bottom:12px;transform:translateX(-50%);white-space:nowrap;font-weight:700;font-size:12px;line-height:1;padding:5px 11px;border-radius:9999px;background:${labelBg};color:${labelFg};box-shadow:0 3px 8px rgba(0,0,0,.28)">${esc(v.name)}</span>
      ${pulse}
      <span style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:${d}px;height:${d}px;border-radius:9999px;background:${dotColor};border:3px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,.4)"></span>
    </div>`;
  return L.divIcon({ html, className: "jv-pin", iconSize: [0, 0], iconAnchor: [0, 0] });
}

export function LeafletJeju({
  villages,
  activeId,
  onHover,
}: {
  villages: VillageSummary[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const router = useRouter();
  return (
    <MapContainer
      center={JEJU_CENTER}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      aria-label="제주 마을 지도"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {villages.map((v) => (
        <Marker
          key={v.id}
          position={[v.lat, v.lng]}
          icon={pinIcon(v, activeId === v.id)}
          eventHandlers={{
            click: () => router.push(`/v/${v.slug}`),
            mouseover: () => onHover?.(v.id),
            mouseout: () => onHover?.(null),
          }}
        />
      ))}
    </MapContainer>
  );
}
