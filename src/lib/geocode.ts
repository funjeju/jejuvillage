import "server-only";

/**
 * 마을 이름·지역으로 제주 내 좌표를 자동 해석 (OSM Nominatim, 키 불필요).
 * 결과가 제주 범위를 벗어나면 무시. 전부 실패하면 제주 중심 폴백.
 */

const JEJU = { lat: 33.38, lng: 126.55 };
const IN_JEJU = (lat: number, lng: number) =>
  lat >= 33.1 && lat <= 33.6 && lng >= 126.1 && lng <= 127.0;

async function query(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "jejuvillage-webbuilder/1.0 (tourism site)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as { lat: string; lon: string }[];
    if (!arr?.length) return null;
    const lat = Number(arr[0].lat);
    const lng = Number(arr[0].lon);
    if (!IN_JEJU(lat, lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** 여러 검색어를 순서대로 시도해 가장 그럴듯한 좌표를 찾는다. */
export async function geocodeVillage(
  name: string,
  region: string
): Promise<{ lat: number; lng: number; resolved: boolean }> {
  const candidates = [
    `${region} ${name}`,
    `제주 ${name}`,
    `${name} 제주`,
    region,
  ].filter(Boolean);

  for (const q of candidates) {
    const hit = await query(q);
    if (hit) return { ...hit, resolved: true };
  }
  return { ...JEJU, resolved: false };
}
