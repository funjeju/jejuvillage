import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { paths, collectionGroups } from "@/lib/firebase/paths";
import { toMillis, toMillisOrNull } from "@/lib/firebase/normalize";
import type {
  Village,
  VillageSummary,
  VillageStory,
  VillageTheme,
  FeedPost,
  Product,
  VillageBundle,
  Booking,
} from "@/lib/types";
import type { DocumentData } from "firebase-admin/firestore";

const LIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 최근 7일 (FR-MAP-02)

/**
 * 서버(Server Component / Route Handler) 전용 읽기 레이어.
 * Admin SDK 로 신뢰 컨텍스트에서 조회하며, 자격증명 미설정/네트워크 오류 시
 * 앱이 죽지 않도록 빈 값을 반환한다(키 주입 전에도 화면 렌더 가능).
 */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[repo/server] read failed:", (err as Error)?.message);
    }
    return fallback;
  }
}

// ── mappers ────────────────────────────────────────────────────────────────

function mapVillage(id: string, d: DocumentData): Village {
  return {
    id,
    slug: d.slug ?? id,
    name: d.name ?? "",
    region: d.region ?? "",
    lat: d.lat ?? 0,
    lng: d.lng ?? 0,
    oneLiner: d.oneLiner ?? "",
    status: d.status ?? "draft",
    lastPostedAt: toMillisOrNull(d.lastPostedAt),
    seasonTag: d.seasonTag ?? null,
    seasonFrom: toMillisOrNull(d.seasonFrom),
    seasonTo: toMillisOrNull(d.seasonTo),
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function mapTheme(vid: string, d: DocumentData | undefined): VillageTheme | null {
  if (!d) return null;
  return {
    villageId: vid,
    presetKey: d.presetKey ?? "warm",
    colorPrimary: d.colorPrimary ?? "#3e8e41",
    colorAccent: d.colorAccent ?? "#e14b5a",
    colorBg: d.colorBg ?? "#fffdf5",
    fontKey: d.fontKey ?? "default",
    heroUrl: d.heroUrl ?? null,
    mascotUrl: d.mascotUrl ?? null,
    mascotName: d.mascotName ?? null,
    mascotDesc: d.mascotDesc ?? null,
    bgmUrl: d.bgmUrl ?? null,
    bgmLoop: d.bgmLoop ?? true,
  };
}

function mapPost(id: string, d: DocumentData): FeedPost {
  return {
    id,
    villageId: d.villageId ?? "",
    villageSlug: d.villageSlug ?? "",
    villageName: d.villageName ?? "",
    caption: d.caption ?? "",
    tags: d.tags ?? [],
    visibility: d.visibility ?? "global",
    isPinned: d.isPinned ?? false,
    media: d.media ?? [],
    publishedAt: toMillis(d.publishedAt),
    authorId: d.authorId ?? "",
  };
}

function mapProduct(id: string, d: DocumentData): Product {
  return {
    id,
    villageId: d.villageId ?? "",
    villageSlug: d.villageSlug ?? "",
    villageName: d.villageName ?? "",
    title: d.title ?? "",
    concept: d.concept ?? "",
    hook: d.hook ?? "",
    price: d.price ?? 0,
    durationMin: d.durationMin ?? 0,
    capacityMin: d.capacityMin ?? 1,
    capacityMax: d.capacityMax ?? 1,
    timeline: d.timeline ?? [],
    includes: d.includes ?? "",
    excludes: d.excludes ?? "",
    notice: d.notice ?? "",
    images: d.images ?? [],
    seasonal: d.seasonal ?? false,
    status: d.status ?? "draft",
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

function mapStory(id: string, d: DocumentData): VillageStory {
  return {
    id,
    villageId: d.villageId ?? "",
    sectionKey: d.sectionKey ?? "story",
    title: d.title ?? "",
    body: d.body ?? "",
    order: d.order ?? 0,
  };
}

function mapBooking(id: string, d: DocumentData): Booking {
  return {
    id,
    productId: d.productId ?? "",
    productTitle: d.productTitle ?? "",
    villageId: d.villageId ?? "",
    villageName: d.villageName ?? "",
    date: d.date ?? "",
    headcount: d.headcount ?? 1,
    applicantName: d.applicantName ?? "",
    applicantPhone: d.applicantPhone ?? "",
    memo: d.memo ?? "",
    status: d.status ?? "REQUESTED",
    createdAt: toMillis(d.createdAt),
  };
}

function isLive(lastPostedAt: number | null | undefined): boolean {
  return !!lastPostedAt && Date.now() - lastPostedAt < LIVE_WINDOW_MS;
}

// ── queries ──────────────────────────────────────────────────────────────

/** 지도/목록용 published 마을 요약 */
export function getPublishedVillageSummaries(): Promise<VillageSummary[]> {
  return safe(async () => {
    const snap = await adminDb()
      .collection(paths.villages)
      .where("status", "==", "published")
      .get();

    const summaries = await Promise.all(
      snap.docs.map(async (doc) => {
        const v = mapVillage(doc.id, doc.data());
        const themeSnap = await adminDb().doc(paths.themeDoc(v.id)).get();
        const theme = mapTheme(v.id, themeSnap.data());
        return {
          id: v.id,
          slug: v.slug,
          name: v.name,
          region: v.region,
          lat: v.lat,
          lng: v.lng,
          oneLiner: v.oneLiner,
          heroUrl: theme?.heroUrl ?? null,
          accentColor: theme?.colorAccent ?? null,
          isLive: isLive(v.lastPostedAt),
        } satisfies VillageSummary;
      })
    );
    return summaries;
  }, []);
}

/** 플랫폼 어드민: 전체 마을 (상태 무관, 최신순) */
export function getAllVillages(): Promise<Village[]> {
  return safe(async () => {
    const snap = await adminDb()
      .collection(paths.villages)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => mapVillage(d.id, d.data()));
  }, []);
}

export interface PlatformStats {
  villages: number;
  published: number;
  draft: number;
  posts: number;
  products: number;
  bookings: number;
  requestedBookings: number;
}

/** 플랫폼 어드민: 전체 통계 (P3) */
export function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = {
    villages: 0,
    published: 0,
    draft: 0,
    posts: 0,
    products: 0,
    bookings: 0,
    requestedBookings: 0,
  };
  return safe(async () => {
    const db = adminDb();
    const villagesSnap = await db.collection(paths.villages).get();
    let published = 0;
    let draft = 0;
    villagesSnap.docs.forEach((d) =>
      d.data().status === "published" ? published++ : draft++
    );

    const [posts, products, bookings] = await Promise.all([
      db.collectionGroup(collectionGroups.feedPosts).count().get(),
      db.collectionGroup(collectionGroups.products).count().get(),
      db.collectionGroup("bookings").count().get(),
    ]);

    // status 필터 count 는 인덱스가 필요할 수 있어 개별 폴백
    let requestedBookings = 0;
    try {
      const r = await db
        .collectionGroup("bookings")
        .where("status", "==", "REQUESTED")
        .count()
        .get();
      requestedBookings = r.data().count;
    } catch {
      /* 인덱스 미배포 시 0 */
    }

    return {
      villages: villagesSnap.size,
      published,
      draft,
      posts: posts.data().count,
      products: products.data().count,
      bookings: bookings.data().count,
      requestedBookings,
    };
  }, empty);
}

export function getVillageById(villageId: string): Promise<Village | null> {
  return safe(async () => {
    const doc = await adminDb().doc(paths.village(villageId)).get();
    if (!doc.exists) return null;
    return mapVillage(doc.id, doc.data()!);
  }, null);
}

export function getVillageBySlug(slug: string): Promise<Village | null> {
  return safe(async () => {
    const snap = await adminDb()
      .collection(paths.villages)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return mapVillage(doc.id, doc.data());
  }, null);
}

/** 마을 홈(S3) 렌더용 번들 */
export function getVillageBundle(slug: string): Promise<VillageBundle | null> {
  return safe(async () => {
    const village = await getVillageBySlug(slug);
    if (!village) return null;
    const db = adminDb();
    const vid = village.id;

    const [themeSnap, storiesSnap, productsSnap, postsSnap] = await Promise.all([
      db.doc(paths.themeDoc(vid)).get(),
      db.collection(paths.stories(vid)).orderBy("order", "asc").get(),
      db
        .collection(paths.products(vid))
        .where("status", "==", "published")
        .get(),
      db
        .collection(paths.feedPosts(vid))
        .orderBy("publishedAt", "desc")
        .limit(30)
        .get(),
    ]);

    return {
      village,
      theme: mapTheme(vid, themeSnap.data()),
      stories: storiesSnap.docs.map((d) => mapStory(d.id, d.data())),
      products: productsSnap.docs
        .map((d) => mapProduct(d.id, d.data()))
        .sort((a, b) => b.createdAt - a.createdAt),
      posts: postsSnap.docs.map((d) => mapPost(d.id, d.data())),
    } satisfies VillageBundle;
  }, null);
}

async function publishedVillageIds(): Promise<string[]> {
  const snap = await adminDb()
    .collection(paths.villages)
    .where("status", "==", "published")
    .get();
  return snap.docs.map((d) => d.id);
}

/**
 * 통합 피드 (visibility=global, 최신순).
 * 공개 마을별 서브컬렉션을 조회해 병합 — Collection Group 복합 인덱스 없이 동작한다.
 * (마을 수가 커지면 global_feed 미러링 또는 Collection Group 인덱스로 전환, 기획서 9.1.2)
 */
export function getGlobalFeed(limit = 24): Promise<FeedPost[]> {
  return safe(async () => {
    const ids = await publishedVillageIds();
    const per = await Promise.all(
      ids.map((vid) =>
        adminDb()
          .collection(paths.feedPosts(vid))
          .orderBy("publishedAt", "desc")
          .limit(limit)
          .get()
      )
    );
    return per
      .flatMap((s) => s.docs.map((d) => mapPost(d.id, d.data())))
      .filter((p) => p.visibility === "global")
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);
  }, []);
}

/** 추천 체험상품 진열 (published, 최신순) — 공개 마을별 병합 */
export function getRecommendedProducts(limit = 12): Promise<Product[]> {
  return safe(async () => {
    const ids = await publishedVillageIds();
    const per = await Promise.all(
      ids.map((vid) =>
        adminDb()
          .collection(paths.products(vid))
          .where("status", "==", "published")
          .get()
      )
    );
    return per
      .flatMap((s) => s.docs.map((d) => mapProduct(d.id, d.data())))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }, []);
}

export function getProduct(
  villageId: string,
  productId: string
): Promise<Product | null> {
  return safe(async () => {
    const doc = await adminDb()
      .doc(`${paths.products(villageId)}/${productId}`)
      .get();
    if (!doc.exists) return null;
    return mapProduct(doc.id, doc.data()!);
  }, null);
}

/** 운영자 예약 목록 (A4) — 서버에서 관리자 권한 확인 후 호출 */
export function getBookings(villageId: string): Promise<Booking[]> {
  return safe(async () => {
    const snap = await adminDb()
      .collection(paths.bookings(villageId))
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => mapBooking(d.id, d.data()));
  }, []);
}
