import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * 마을 이름 자동완성 (OSM Nominatim, 키 불필요).
 * 입력어로 제주 내 행정지명 후보를 찾아, 선택 시 이름·지역·영문주소(slug)·좌표를 자동 채운다.
 */

const IN_JEJU = (lat: number, lng: number) =>
  lat >= 33.1 && lat <= 33.6 && lng >= 126.1 && lng <= 127.0;

// 한글 → 로마자(개정 로마자표기, 음운변화 미적용) — slug 자동 생성용 폴백
const CHO = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
const JUNG = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
const JONG = ["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"];

function romanize(kr: string): string {
  let out = "";
  for (const ch of kr) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171) {
      out += CHO[Math.floor(code / 588)] + JUNG[Math.floor((code % 588) / 28)] + JONG[code % 28];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    }
  }
  return out.replace(/[^a-z0-9]/g, "");
}

interface NomItem {
  lat: string;
  lon: string;
  display_name: string;
  namedetails?: Record<string, string>;
}

function pickRegion(displayName: string): { name: string; region: string } {
  // "저지리, 한경면, 제주시, 제주특별자치도, 대한민국"
  const parts = displayName.split(",").map((s) => s.trim()).filter(Boolean);
  const name = parts[0] ?? "";
  const si = parts.find((p) => /(시|군)$/.test(p) && !/특별자치도$/.test(p)) ?? "";
  const eupmyeondong = parts.find((p) => /(읍|면|동)$/.test(p)) ?? "";
  const region = [si, eupmyeondong].filter(Boolean).join(" ") || parts[parts.length - 2] || "제주특별자치도";
  return { name, region };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&namedetails=1` +
      `&accept-language=ko&countrycodes=kr&limit=8&q=${encodeURIComponent(`제주 ${q}`)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "jejuvillage-webbuilder/1.0 (tourism site)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const arr = (await res.json()) as NomItem[];

    const seen = new Set<string>();
    const results = arr
      .map((it) => {
        const lat = Number(it.lat);
        const lng = Number(it.lon);
        if (!IN_JEJU(lat, lng)) return null;
        const { name, region } = pickRegion(it.display_name);
        if (!name) return null;
        const en = it.namedetails?.["name:en"] || "";
        const slug = (en ? en.toLowerCase().replace(/[^a-z0-9]/g, "") : romanize(name)) || romanize(name);
        return { name, region, slug, lat, lng, label: it.display_name };
      })
      .filter((r): r is NonNullable<typeof r> => {
        if (!r) return false;
        const key = `${r.name}|${r.region}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
