/**
 * 도메인 타입 (기획서 5장 스키마 → Firestore 문서형 매핑, 9.1.2절)
 *
 * 직렬화 규칙:
 *  - 서버/클라이언트 경계(Server Component → Client)를 넘기 위해
 *    모든 시간값은 epoch millis(number)로 정규화한다. (Firestore Timestamp 아님)
 *  - repo 레이어에서 Timestamp ↔ number 변환을 담당한다.
 */

export type Role = "guest" | "village_admin" | "platform_admin";

/** 마을 홈 섹션(모듈) 키 — 빌더에서 재배치/삭제 대상 */
export type SectionKey =
  | "hero"
  | "story"
  | "feed"
  | "products"
  | "mascot"
  | "location";

export interface SectionLayout {
  key: SectionKey;
  enabled: boolean;
}

/** 기본 레이아웃(마을 미설정 시) */
// 마스코트는 별도 섹션이 아니라 히어로 오버레이로 노출 (mascot 키는 저장된 레이아웃 호환용으로만 유지)
export const DEFAULT_LAYOUT: SectionLayout[] = [
  { key: "hero", enabled: true },
  { key: "story", enabled: true },
  { key: "feed", enabled: true },
  { key: "products", enabled: true },
  { key: "location", enabled: true },
];

export const SECTION_META: Record<SectionKey, { label: string; desc: string; fixed?: boolean }> = {
  hero: { label: "대표 히어로", desc: "대표 이미지 + 마을명 + 한줄 소개", fixed: true },
  story: { label: "마을 이야기", desc: "역사·설화·자원 스토리" },
  feed: { label: "소식 피드", desc: "실시간 사진 소식" },
  products: { label: "체험상품", desc: "예약 가능한 체험 카드" },
  mascot: { label: "마스코트", desc: "(히어로에 표시됨)" },
  location: { label: "오시는 길", desc: "지도 + 주소" },
};
export type PublishStatus = "draft" | "published";
export type BookingStatus = "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELED";
export type FeedVisibility = "village_only" | "global";
export type MediaType = "image" | "audio";
export type ThemePreset = "warm" | "clean" | "trendy";
export type BannerStyle = "anime" | "watercolor";

/** 마을 */
export interface Village {
  id: string;
  slug: string;
  name: string;
  region: string; // 예: 제주시 한경면
  lat: number;
  lng: number;
  oneLiner: string;
  status: PublishStatus;
  /** 지도 '살아있는 핀' 계산용 — 최신 소식 발행 시각 */
  lastPostedAt?: number | null;
  /** 시즌 태그 (예: 장미철). 등록 기간엔 가중 노출 (S1 시즌 배너) */
  seasonTag?: string | null;
  seasonFrom?: number | null;
  seasonTo?: number | null;
  /** 홈 섹션 순서·활성 (빌더 설정). 없으면 DEFAULT_LAYOUT */
  layout?: SectionLayout[] | null;
  /** 게시 요청: 사무장이 요청 → 슈퍼관리자가 승인(status=published) */
  publishRequestedAt?: number | null;
  publishRequestedBy?: string | null;
  createdAt: number;
  updatedAt: number;
}

/** 마을 목록/피드 카드용 요약 (비정규화된 최소 필드) */
export interface VillageSummary {
  id: string;
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  oneLiner: string;
  heroUrl?: string | null;
  accentColor?: string | null;
  isLive?: boolean; // 최근 7일 내 소식 여부
}

/** 마을 스토리 섹션 */
export interface VillageStory {
  id: string;
  villageId: string;
  sectionKey: string; // history | legend | resource ...
  title: string;
  body: string;
  order: number;
}

/** 소식(실시간 사진 피드) */
export interface FeedPost {
  id: string;
  villageId: string;
  /** 통합 피드/카드 렌더 편의를 위한 비정규화 필드 */
  villageSlug: string;
  villageName: string;
  caption: string;
  tags: string[];
  visibility: FeedVisibility;
  isPinned: boolean;
  /** media_asset 참조 URL 목록 (썸네일/원본) */
  media: FeedMedia[];
  publishedAt: number;
  authorId: string;
}

export interface FeedMedia {
  assetId: string;
  url: string;
  thumbUrl: string;
  width?: number;
  height?: number;
}

/** 체험상품 */
export interface Product {
  id: string;
  villageId: string;
  villageSlug: string;
  villageName: string;
  title: string;
  concept: string; // 한줄 컨셉
  hook: string; // 스토리 훅
  price: number; // 1인 가격(원)
  durationMin: number;
  capacityMin: number;
  capacityMax: number;
  timeline: TimelineItem[];
  includes: string;
  excludes: string;
  notice: string; // 유의·취소환불
  images: ProductImage[];
  /** 시즌 상품 여부 (예: 장미돌담 피크닉 5~6월) */
  seasonal: boolean;
  status: PublishStatus;
  createdAt: number;
  updatedAt: number;
}

export interface TimelineItem {
  time: string; // 예: "0:00", "10분"
  desc: string;
}

export interface ProductImage {
  assetId: string;
  url: string;
  thumbUrl: string;
}

/** 예약 */
export interface Booking {
  id: string;
  productId: string;
  productTitle: string; // 비정규화
  villageId: string;
  villageName: string; // 비정규화
  date: string; // YYYY-MM-DD (희망일)
  headcount: number;
  applicantName: string;
  applicantPhone: string;
  memo: string;
  status: BookingStatus;
  createdAt: number;
}

/** 마을 테마/마스코트/음악 (단일 문서) */
export interface VillageTheme {
  villageId: string;
  presetKey: ThemePreset;
  colorPrimary: string; // HEX
  colorAccent: string;
  colorBg: string;
  fontKey: string;
  /** 배너 그림풍: anime(지브리 혼합 애니메이션, 기본) | watercolor(수채 그림책) */
  bannerStyle?: BannerStyle | null;
  heroUrl?: string | null;
  /** 지금까지 생성/업로드한 배너 후보들 (최신순). 어드민에서 골라 heroUrl 로 전환 */
  heroHistory?: string[] | null;
  mascotUrl?: string | null;
  mascotName?: string | null;
  mascotDesc?: string | null;
  bgmUrl?: string | null;
  bgmLoop: boolean;
}

/** 업로드 파일 메타 */
export interface MediaAsset {
  id: string;
  villageId: string;
  type: MediaType;
  url: string;
  thumbUrl?: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  createdAt: number;
}

/** 사용자 */
export interface AppUser {
  uid: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: Role;
  /** 운영 가능한 마을 id 목록 */
  managedVillages: string[];
}

/** 마을 관광인식 리포트 (안덕면 상창리 리포트 형식) */
export interface ReportKeyword {
  text: string;
  weight: number; // 1~5 (글자 크기)
}
export interface ReportPlace {
  name: string;
  tags: string; // 쉼표 구분 또는 자유 텍스트
  quote: string; // 관광객 인용
  imageUrl?: string | null;
}
export interface ReportBrandKeyword {
  label: string; // 예: 플로럴
  sub: string; // 예: Floral
}
export interface ReportCoreValue {
  label: string; // 예: 심미성
  sub: string; // 예: Aesthetic
}
export interface VillageReport {
  villageId: string;
  enabled: boolean;
  reportTitle: string; // 예: Online Tourism Perception Report
  tagline: string; // 한 줄 부제
  score: number; // 0~100 관광 인식 점수
  keywords: ReportKeyword[];
  topPlaces: ReportPlace[]; // 가장 많이 언급되는 장소 (순위 = 배열 순서)
  sentiment: { positive: number; neutral: number; negative: number };
  sentimentNote: string;
  brandKeywords: ReportBrandKeyword[];
  expressions: string[]; // 관광객이 자주 쓰는 표현
  pros: string[]; // 장점
  cons: string[]; // 아쉬운 점
  swot: { strength: string; weakness: string; possibility: string; opportunity: string };
  strategyKeywords: string[]; // 핵심 전략 방향 태그
  aiInsight: string; // AI 종합 인사이트
  brandOneLiner: string; // 한 줄 브랜딩
  coreValues: ReportCoreValue[];
  audiencePerception: string; // 관광객 인식 요약
  updatedAt: number;
}

/** 마을 홈 템플릿 렌더에 필요한 데이터 묶음 */
export interface VillageBundle {
  village: Village;
  theme: VillageTheme | null;
  stories: VillageStory[];
  products: Product[];
  posts: FeedPost[];
  reportEnabled: boolean;
}
