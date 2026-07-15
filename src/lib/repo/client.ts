"use client";

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  type Unsubscribe,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { paths, collectionGroups } from "@/lib/firebase/paths";
import { toMillis } from "@/lib/firebase/normalize";
import type {
  FeedPost,
  Product,
  Booking,
  BookingStatus,
  VillageTheme,
} from "@/lib/types";
import type { FeedPostInput, ProductInput, ThemeInput } from "@/lib/schemas";

// ── 소식(A2) ────────────────────────────────────────────────────────────────

export async function createFeedPost(
  village: { id: string; slug: string; name: string },
  authorId: string,
  input: FeedPostInput
): Promise<string> {
  const db = clientDb();
  const ref = await addDoc(collection(db, paths.feedPosts(village.id)), {
    villageId: village.id,
    villageSlug: village.slug,
    villageName: village.name,
    caption: input.caption,
    tags: input.tags,
    visibility: input.visibility,
    isPinned: false,
    media: input.media,
    publishedAt: serverTimestamp(),
    authorId,
  });
  // 지도 '살아있는 핀' 계산용 최신 소식 시각 갱신
  await updateDoc(doc(db, paths.village(village.id)), {
    lastPostedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateFeedPost(
  villageId: string,
  postId: string,
  patch: { caption: string; tags: string[]; visibility: "global" | "village_only" }
) {
  await updateDoc(doc(clientDb(), `${paths.feedPosts(villageId)}/${postId}`), {
    caption: patch.caption,
    tags: patch.tags,
    visibility: patch.visibility,
  });
}

export async function deleteFeedPost(villageId: string, postId: string) {
  await deleteDoc(doc(clientDb(), `${paths.feedPosts(villageId)}/${postId}`));
}

export async function setFeedPostPinned(
  villageId: string,
  postId: string,
  pinned: boolean
) {
  await updateDoc(doc(clientDb(), `${paths.feedPosts(villageId)}/${postId}`), {
    isPinned: pinned,
  });
}

/** 실시간 마을 피드 리스너 (A2 관리 목록 / S3 마을홈) */
export function listenVillageFeed(
  villageId: string,
  cb: (posts: FeedPost[]) => void,
  max = 50
): Unsubscribe {
  const q = query(
    collection(clientDb(), paths.feedPosts(villageId)),
    orderBy("publishedAt", "desc"),
    limit(max)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => mapPostDoc(d.id, d.data())));
  });
}

/** 통합 실시간 피드 리스너 (S1/통합 /feed) */
export function listenGlobalFeed(
  cb: (posts: FeedPost[]) => void,
  max = 24
): Unsubscribe {
  const q = query(
    collectionGroup(clientDb(), collectionGroups.feedPosts),
    where("visibility", "==", "global"),
    orderBy("publishedAt", "desc"),
    limit(max)
  );
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      if (!snap.metadata.fromCache) {
        cb(snap.docs.map((d) => mapPostDoc(d.id, d.data())));
      }
    },
    (err) => {
      // 복합 인덱스(visibility+publishedAt) 미배포 시 실시간 갱신은 생략하고
      // 서버 SSR 초기 데이터를 유지한다. 인덱스 배포(pnpm deploy:rules) 후 활성화.
      console.warn("[listenGlobalFeed] 실시간 구독 불가(인덱스 필요):", err.code);
    }
  );
}

function mapPostDoc(id: string, d: Record<string, unknown>): FeedPost {
  return {
    id,
    villageId: (d.villageId as string) ?? "",
    villageSlug: (d.villageSlug as string) ?? "",
    villageName: (d.villageName as string) ?? "",
    caption: (d.caption as string) ?? "",
    tags: (d.tags as string[]) ?? [],
    visibility: (d.visibility as FeedPost["visibility"]) ?? "global",
    isPinned: (d.isPinned as boolean) ?? false,
    media: (d.media as FeedPost["media"]) ?? [],
    publishedAt: toMillis(d.publishedAt as Timestamp),
    authorId: (d.authorId as string) ?? "",
  };
}

// ── 상품(A3) ──────────────────────────────────────────────────────────────

export async function createProduct(
  village: { id: string; slug: string; name: string },
  input: ProductInput
): Promise<string> {
  const db = clientDb();
  const ref = await addDoc(collection(db, paths.products(village.id)), {
    villageId: village.id,
    villageSlug: village.slug,
    villageName: village.name,
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(
  villageId: string,
  productId: string,
  input: ProductInput
) {
  await updateDoc(doc(clientDb(), `${paths.products(villageId)}/${productId}`), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(villageId: string, productId: string) {
  await deleteDoc(doc(clientDb(), `${paths.products(villageId)}/${productId}`));
}

export function listenProducts(
  villageId: string,
  cb: (products: Product[]) => void
): Unsubscribe {
  const q = query(
    collection(clientDb(), paths.products(villageId)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          ...(x as Omit<Product, "id" | "createdAt" | "updatedAt">),
          createdAt: toMillis(x.createdAt),
          updatedAt: toMillis(x.updatedAt),
        } as Product;
      })
    );
  });
}

export async function getProductOnce(
  villageId: string,
  productId: string
): Promise<Product | null> {
  const snap = await getDoc(
    doc(clientDb(), `${paths.products(villageId)}/${productId}`)
  );
  if (!snap.exists()) return null;
  const x = snap.data();
  return {
    id: snap.id,
    ...(x as Omit<Product, "id" | "createdAt" | "updatedAt">),
    createdAt: toMillis(x.createdAt),
    updatedAt: toMillis(x.updatedAt),
  } as Product;
}

// ── 예약(A4) ──────────────────────────────────────────────────────────────

export function listenBookings(
  villageId: string,
  cb: (bookings: Booking[]) => void
): Unsubscribe {
  const q = query(
    collection(clientDb(), paths.bookings(villageId)),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          ...(x as Omit<Booking, "id" | "createdAt">),
          createdAt: toMillis(x.createdAt),
        } as Booking;
      })
    );
  });
}

export async function updateBookingStatus(
  villageId: string,
  bookingId: string,
  status: BookingStatus
) {
  await updateDoc(doc(clientDb(), `${paths.bookings(villageId)}/${bookingId}`), {
    status,
  });
}

// ── 마을 기본정보(A6) ────────────────────────────────────────────────────

/** 홈 섹션 레이아웃 저장 (빌더) */
export async function updateVillageLayout(
  villageId: string,
  layout: import("@/lib/types").SectionLayout[]
) {
  await updateDoc(doc(clientDb(), paths.village(villageId)), {
    layout,
    updatedAt: serverTimestamp(),
  });
}

/** 마을 홈페이지 게시 상태 토글 (운영자 자가 게시) */
export async function updateVillageStatus(
  villageId: string,
  status: "draft" | "published"
) {
  await updateDoc(doc(clientDb(), paths.village(villageId)), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/** 마을 문서 실시간 구독 (홈페이지 상태 패널용) */
export function listenVillage(
  villageId: string,
  cb: (
    data:
      | { status: "draft" | "published"; name: string; publishRequestedAt: number | null }
      | null
  ) => void
): Unsubscribe {
  return onSnapshot(doc(clientDb(), paths.village(villageId)), (snap) => {
    const d = snap.data();
    cb(
      d
        ? {
            status: d.status ?? "draft",
            name: d.name ?? "",
            publishRequestedAt: d.publishRequestedAt ?? null,
          }
        : null
    );
  });
}

export async function updateVillageInfo(
  villageId: string,
  input: {
    name: string;
    region: string;
    oneLiner: string;
    lat: number;
    lng: number;
    seasonTag?: string;
  }
) {
  await updateDoc(doc(clientDb(), paths.village(villageId)), {
    ...input,
    seasonTag: input.seasonTag ?? null,
    updatedAt: serverTimestamp(),
  });
}

// ── 테마(A5) ──────────────────────────────────────────────────────────────

export async function saveTheme(villageId: string, input: ThemeInput) {
  await setDoc(
    doc(clientDb(), paths.themeDoc(villageId)),
    { villageId, ...input },
    { merge: true }
  );
}

/** 테마 부분 저장 (빌더 색상/마스코트 등 일부 필드만) */
export async function saveThemePartial(
  villageId: string,
  partial: Record<string, unknown>
) {
  await setDoc(
    doc(clientDb(), paths.themeDoc(villageId)),
    { villageId, ...partial },
    { merge: true }
  );
}

/** AI 자동 구성 결과를 마을에 반영 (한줄소개 + 스토리 + 마스코트/강조색) */
export async function applyGeneratedHomepage(
  villageId: string,
  data: {
    oneLiner: string;
    stories: { sectionKey: string; title: string; body: string }[];
    mascotName: string;
    mascotDesc: string;
    colorAccent: string;
  }
) {
  const db = clientDb();
  if (data.oneLiner) {
    await updateDoc(doc(db, paths.village(villageId)), {
      oneLiner: data.oneLiner,
      updatedAt: serverTimestamp(),
    });
  }
  // 스토리: sectionKey 를 문서 id 로 덮어쓰기
  await Promise.all(
    data.stories.map((s, i) =>
      setDoc(doc(db, `${paths.stories(villageId)}/${s.sectionKey}`), {
        villageId,
        sectionKey: s.sectionKey,
        title: s.title,
        body: s.body,
        order: i + 1,
      })
    )
  );
  const themePartial: Record<string, unknown> = {};
  if (data.mascotName) themePartial.mascotName = data.mascotName;
  if (data.mascotDesc) themePartial.mascotDesc = data.mascotDesc;
  if (data.colorAccent) themePartial.colorAccent = data.colorAccent;
  if (Object.keys(themePartial).length) {
    await saveThemePartial(villageId, themePartial);
  }
}

/** 스토리 단건 저장 (인라인 편집용) */
export async function saveStory(
  villageId: string,
  sectionKey: string,
  title: string,
  body: string
) {
  await setDoc(
    doc(clientDb(), `${paths.stories(villageId)}/${sectionKey}`),
    { villageId, sectionKey, title, body, order: 1 },
    { merge: true }
  );
}

/** 현재 저장된 마을 원문(한줄소개 + 스토리 본문)을 모아 반환 — AI 재구성 입력용 */
export async function getRawContentOnce(villageId: string): Promise<string> {
  const db = clientDb();
  const [vSnap, storiesSnap] = await Promise.all([
    getDoc(doc(db, paths.village(villageId))),
    getDocs(query(collection(db, paths.stories(villageId)), orderBy("order", "asc"))),
  ]);
  const parts: string[] = [];
  const oneLiner = vSnap.data()?.oneLiner;
  if (oneLiner) parts.push(String(oneLiner));
  storiesSnap.docs.forEach((d) => {
    const s = d.data();
    if (s?.title) parts.push(String(s.title));
    if (s?.body) parts.push(String(s.body));
  });
  return parts.join("\n\n");
}

/** 게시 요청 (사무장 → 슈퍼관리자 승인 대기) */
export async function requestPublish(villageId: string, userId: string) {
  await updateDoc(doc(clientDb(), paths.village(villageId)), {
    publishRequestedAt: serverTimestamp(),
    publishRequestedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

// ── 관광인식 리포트 ──────────────────────────────────────────────────────

export async function saveVillageReport(
  villageId: string,
  report: Record<string, unknown>
) {
  await setDoc(
    doc(clientDb(), paths.reportDoc(villageId)),
    { villageId, ...report, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getReportOnce(
  villageId: string
): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(clientDb(), paths.reportDoc(villageId)));
  return snap.exists() ? snap.data() : null;
}

export async function getThemeOnce(villageId: string): Promise<VillageTheme | null> {
  const snap = await getDoc(doc(clientDb(), paths.themeDoc(villageId)));
  if (!snap.exists()) return null;
  return { villageId, ...(snap.data() as Omit<VillageTheme, "villageId">) };
}
