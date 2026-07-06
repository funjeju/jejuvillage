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
  const bg = active ? "var(--accent, #e14b5a)" : "#ffffff";
  const fg = active ? "#ffffff" : "#24301f";
  const live = v.isLive
    ? `<span class="live-ring" style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:9999px;background:#e14b5a;color:#e14b5a;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.05)"></span>`
    : "";
  const html = `
    <div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;cursor:pointer;${active ? "z-index:1000" : ""}">
      <span style="position:relative;white-space:nowrap;background:${bg};color:${fg};font-weight:700;font-size:12px;line-height:1;padding:6px 12px;border-radius:9999px;box-shadow:0 3px 8px rgba(0,0,0,.25);${active ? "transform:scale(1.08)" : ""}">
        ${live}${esc(v.name)}
      </span>
      <span style="width:11px;height:11px;background:${bg};transform:rotate(45deg);margin-top:-5px;box-shadow:2px 2px 4px rgba(0,0,0,.15)"></span>
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
