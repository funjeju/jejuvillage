import { z } from "zod";

/**
 * 폼/API 입력 검증용 zod 스키마.
 * 도메인 타입(types.ts)과 1:1 대응하되, 사용자 입력 지점만 정의한다.
 */

const phoneRegex = /^01[016789][0-9]{7,8}$/;

/** 예약 신청 (S5) — 방문자 입력 */
export const bookingInputSchema = z.object({
  productId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택해 주세요."),
  headcount: z.coerce.number().int().min(1, "인원을 입력해 주세요.").max(100),
  applicantName: z.string().trim().min(2, "이름을 입력해 주세요.").max(30),
  applicantPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^0-9]/g, ""))
    .refine((v) => phoneRegex.test(v), "올바른 휴대폰 번호를 입력해 주세요."),
  memo: z.string().trim().max(500).optional().default(""),
  privacyAgreed: z.literal(true, {
    message: "개인정보 수집·이용에 동의해 주세요.",
  }),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

/** 소식 발행 (A2) */
export const feedPostInputSchema = z.object({
  caption: z.string().trim().min(1, "한 줄 캡션을 입력해 주세요.").max(300),
  tags: z.array(z.string().trim().min(1)).max(10).default([]),
  visibility: z.enum(["village_only", "global"]).default("global"),
  media: z
    .array(
      z.object({
        assetId: z.string(),
        url: z.string().url(),
        thumbUrl: z.string().url(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .min(1, "사진을 최소 1장 첨부해 주세요.")
    .max(10, "사진은 최대 10장까지 첨부할 수 있어요."),
});
export type FeedPostInput = z.infer<typeof feedPostInputSchema>;

const timelineItemSchema = z.object({
  time: z.string().trim().max(20),
  desc: z.string().trim().max(200),
});

/** 상품 CRUD (A3) */
export const productInputSchema = z.object({
  title: z.string().trim().min(2, "상품명을 입력해 주세요.").max(60),
  concept: z.string().trim().max(100).default(""),
  hook: z.string().trim().max(1000).default(""),
  price: z.coerce.number().int().min(0, "가격을 입력해 주세요."),
  durationMin: z.coerce.number().int().min(0).max(1440),
  capacityMin: z.coerce.number().int().min(1),
  capacityMax: z.coerce.number().int().min(1),
  timeline: z.array(timelineItemSchema).max(30).default([]),
  includes: z.string().trim().max(1000).default(""),
  excludes: z.string().trim().max(1000).default(""),
  notice: z.string().trim().max(2000).default(""),
  images: z
    .array(
      z.object({
        assetId: z.string(),
        url: z.string().url(),
        thumbUrl: z.string().url(),
      })
    )
    .default([]),
  seasonal: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
}).refine((v) => v.capacityMax >= v.capacityMin, {
  message: "최대 정원은 최소 정원 이상이어야 합니다.",
  path: ["capacityMax"],
});
export type ProductInput = z.infer<typeof productInputSchema>;

/** 마을 기본정보 편집 (A6) */
export const villageInfoInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  region: z.string().trim().min(1).max(40),
  oneLiner: z.string().trim().max(120).default(""),
  lat: z.coerce.number().min(33).max(34), // 제주 위도 범위
  lng: z.coerce.number().min(126).max(127), // 제주 경도 범위
  seasonTag: z.string().trim().max(20).optional(),
});
export type VillageInfoInput = z.infer<typeof villageInfoInputSchema>;

/** 마을 생성 (플랫폼 어드민 P1) */
export const villageCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "slug 은 영소문자·숫자·하이픈만 가능해요."),
  name: z.string().trim().min(1, "마을명을 입력해 주세요.").max(40),
  region: z.string().trim().min(1, "지역을 입력해 주세요.").max(40),
  oneLiner: z.string().trim().max(120).default(""),
  lat: z.coerce.number().min(33).max(34),
  lng: z.coerce.number().min(126).max(127),
});
export type VillageCreateInput = z.infer<typeof villageCreateSchema>;

/** 운영자 초대 (플랫폼 어드민 P1) */
export const inviteAdminSchema = z.object({
  villageId: z.string().min(1),
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
});
export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;

/** 테마·마스코트·음악 설정 (A5) */
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "HEX 색상 형식이어야 합니다.");
export const themeInputSchema = z.object({
  presetKey: z.enum(["warm", "clean", "trendy"]).default("warm"),
  colorPrimary: hexColor,
  colorAccent: hexColor,
  colorBg: hexColor,
  fontKey: z.string().default("default"),
  heroUrl: z.string().url().nullable().optional(),
  mascotUrl: z.string().url().nullable().optional(),
  mascotName: z.string().trim().max(30).nullable().optional(),
  mascotDesc: z.string().trim().max(300).nullable().optional(),
  bgmUrl: z.string().url().nullable().optional(),
  bgmLoop: z.boolean().default(true),
});
export type ThemeInput = z.infer<typeof themeInputSchema>;
