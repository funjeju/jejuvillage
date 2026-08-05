import "server-only";

/**
 * 외부 스크린샷 API 래퍼.
 *
 * 참조 URL을 "실제 렌더한 화면"으로 캡처하기 위해 외부 스크린샷 서비스에 위임한다.
 * (우리 서버가 임의 URL을 직접 fetch 하지 않으므로 SSRF 위험이 서비스 쪽으로 격리된다.)
 *
 * 기본 제공자: microlink (무료 티어, 키 불필요 · 저용량 레이트리밋).
 *   - MICROLINK_API_KEY 가 있으면 x-api-key 헤더로 상향 티어 사용.
 * 다른 제공자(screenshotone 등)로 바꾸려면 SCREENSHOT_ENDPOINT 로 오버라이드.
 *
 * 반환값은 "공개 접근 가능한 스크린샷 이미지 URL" 이다.
 * 이 URL 을 그대로 OpenAI Vision(image_url)에 넘길 수 있다.
 */

export interface ScreenshotResult {
  imageUrl: string;
  provider: string;
}

/** 참조 URL 로 받을 수 있는지 1차 검증 (명백히 잘못된 값/사설망 리터럴 차단) */
export function isFetchableUrl(raw: string): { ok: boolean; reason?: string } {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: "URL 형식이 올바르지 않아요." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "http/https 주소만 지원해요." };
  }
  const host = u.hostname.toLowerCase();
  // 사설/로컬 리터럴 차단 (외부 스크린샷 서비스가 내부망을 긁는 것 방지)
  const blocked =
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) return { ok: false, reason: "내부망 주소는 캡처할 수 없어요." };
  return { ok: true };
}

/**
 * 참조 URL 의 전체 페이지 스크린샷을 캡처해 이미지 URL 을 반환한다.
 * @throws 캡처 실패 시 Error
 */
export async function captureScreenshot(refUrl: string): Promise<ScreenshotResult> {
  const check = isFetchableUrl(refUrl);
  if (!check.ok) throw new Error(check.reason);

  const provider = process.env.SCREENSHOT_PROVIDER || "microlink";
  const timeoutMs = Number(process.env.SCREENSHOT_TIMEOUT_MS || 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === "microlink") {
      return await captureMicrolink(refUrl, controller.signal);
    }
    // 커스텀 엔드포인트: SCREENSHOT_ENDPOINT 에 {url} 자리표시자를 넣으면 치환한다.
    const tmpl = process.env.SCREENSHOT_ENDPOINT;
    if (!tmpl) throw new Error(`알 수 없는 스크린샷 제공자: ${provider}`);
    const endpoint = tmpl.replace("{url}", encodeURIComponent(refUrl));
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) throw new Error(`스크린샷 API 오류(${res.status})`);
    // JSON 이면 흔한 필드에서 이미지 URL 추출, 아니면 응답 URL 자체를 이미지로 간주
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      const url = j?.data?.screenshot?.url || j?.screenshot?.url || j?.url;
      if (!url) throw new Error("스크린샷 URL 을 응답에서 찾지 못했어요.");
      return { imageUrl: url, provider };
    }
    return { imageUrl: res.url, provider };
  } finally {
    clearTimeout(timer);
  }
}

async function captureMicrolink(
  refUrl: string,
  signal: AbortSignal
): Promise<ScreenshotResult> {
  const params = new URLSearchParams({
    url: refUrl,
    screenshot: "true",
    meta: "false",
    "screenshot.fullPage": "true",
    "screenshot.type": "png",
    // 데스크톱 뷰포트 기준으로 캡처 (랜딩 레이아웃 파악에 유리)
    viewport: JSON.stringify({ width: 1280, height: 800 }),
  });
  const endpoint = `https://api.microlink.io/?${params.toString()}`;
  const headers: Record<string, string> = {};
  if (process.env.MICROLINK_API_KEY) {
    headers["x-api-key"] = process.env.MICROLINK_API_KEY;
  }

  const res = await fetch(endpoint, { headers, signal });
  const j = await res.json().catch(() => null);
  if (!res.ok || j?.status !== "success") {
    const msg = j?.message || `microlink 오류(${res.status})`;
    throw new Error(msg);
  }
  const url = j?.data?.screenshot?.url;
  if (!url) throw new Error("microlink 응답에 스크린샷 URL 이 없어요.");
  return { imageUrl: url, provider: "microlink" };
}
