/**
 * 조수리 샘플 데이터 시드 (기획서 부록 A).
 *
 * 실행:
 *   1) 에뮬레이터:  NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 (에뮬레이터 먼저 실행)
 *        node --env-file=.env.local scripts/seed.mjs
 *   2) 실제 프로젝트: .env.local 에 FIREBASE_ADMIN_* 자격증명 설정 후
 *        node --env-file=.env.local scripts/seed.mjs
 *
 * 생성물:
 *   - villages/josuri (+ theme/main, stories, products, feed_posts)
 *   - 운영자 계정(admin@josuri.kr / josuri1234) + custom claims(role, managedVillages)
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1";
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "demo-jejuvillage";

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
  initializeApp({ projectId });
  console.log(`🌱 에뮬레이터 모드 (project=${projectId})`);
} else {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    console.error("❌ FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY 가 필요합니다.");
    process.exit(1);
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  console.log(`🌱 실제 프로젝트 모드 (project=${projectId})`);
}

const db = getFirestore();
const auth = getAuth();
const now = Timestamp.now();
const daysAgo = (d) => Timestamp.fromMillis(Date.now() - d * 86400000);
const hoursAgo = (h) => Timestamp.fromMillis(Date.now() - h * 3600000);
const img = (seed, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const VID = "josuri";
const ACCENT = "#e14b5a"; // 조수리 = 장미 레드

async function seed() {
  // ── village ──
  await db.doc(`villages/${VID}`).set({
    slug: VID,
    name: "조수리",
    region: "제주시 한경면",
    lat: 33.337,
    lng: 126.229,
    oneLiner: "물을 찾아 세운 마을 — 빌레 위를 걷고, 480년 팽나무 아래 쉬는 느린 여행",
    status: "published",
    lastPostedAt: hoursAgo(3),
    seasonTag: "장미철",
    createdAt: now,
    updatedAt: now,
  });

  // ── theme ──
  await db.doc(`villages/${VID}/theme/main`).set({
    villageId: VID,
    presetKey: "warm",
    colorPrimary: "#3e8e41",
    colorAccent: ACCENT,
    colorBg: "#fffdf5",
    fontKey: "default",
    heroUrl: img("josuri-hero", 1920, 1080),
    mascotUrl: null,
    mascotName: "조수이",
    mascotDesc: "빌레 위에서 물통을 든, 장미를 꽂은 마을 아이예요.",
    bgmUrl: null,
    bgmLoop: true,
  });

  // ── stories ──
  const stories = [
    {
      id: "history",
      sectionKey: "history",
      title: "물을 찾아 세운 마을",
      body: "조수(造水)는 '좋은 물'의 한자 표기예요. 물이 귀해 주민들이 직접 물통을 파 식수를 마련한 데서 마을 이름이 유래했어요. 예부터 교육열이 높은 문촌(文村)으로 알려졌답니다.",
      order: 1,
    },
    {
      id: "legend",
      sectionKey: "legend",
      title: "돗곳물 전설",
      body: "설촌 당시 물을 찾다 발견한 연못 '돗곳물'. 멧돼지가 나무뿌리를 캐며 판 웅덩이에 물이 고였다는 이야기가 전해져요.",
      order: 2,
    },
    {
      id: "resource",
      sectionKey: "resource",
      title: "마을의 보물",
      body: "파호이호이 빌레용암 '사장밭', 굽은오름과 송아오름, 용선달리의 480년 팽나무 당산나무, 그리고 봄이면 붉게 물드는 장미돌담길까지.",
      order: 3,
    },
  ];
  for (const s of stories) {
    await db.doc(`villages/${VID}/stories/${s.id}`).set({ villageId: VID, ...s });
  }

  // ── products ──
  const products = [
    {
      id: "bille-trekking",
      title: "조수리 빌레 지질트레킹",
      concept: "파호이호이 용암 빌레 위를 걷는 지질 여행",
      hook: "군마가 훈련하던 사장밭, 그 단단한 빌레용암 위를 전문 해설사와 함께 걸어요. 발밑에 새겨진 말발굽 흔적과 480년 팽나무의 그늘까지, 조수리의 시간을 온몸으로 만나는 2시간 반이에요.",
      price: 25000,
      durationMin: 150,
      capacityMin: 4,
      capacityMax: 12,
      timeline: [
        { time: "0:00", desc: "마을 안내소 집결 · 조수리 이야기" },
        { time: "0:20", desc: "사장밭 빌레용암 트레킹" },
        { time: "1:20", desc: "480년 팽나무 당산나무 쉼" },
        { time: "2:00", desc: "돗곳물 연못 · 마무리 다과" },
      ],
      includes: "전문 해설사, 다과, 여행자 보험",
      excludes: "개인 트레킹화, 중식",
      notice: "우천 시 일정이 변경될 수 있어요. 체험 3일 전까지 취소 시 전액 환불됩니다.",
      images: [{ assetId: "seed1", url: img("bille1"), thumbUrl: img("bille1", 480, 320) }],
      seasonal: false,
      status: "published",
    },
    {
      id: "water-storywalking",
      title: "물통의 마을 스토리워킹",
      concept: "물을 찾던 사람들의 이야기를 걷다",
      hook: "물이 귀했던 중산간 마을이 어떻게 물을 만들어냈을까요? 마을 어르신의 구술과 함께 돗곳물과 옛 물통 자리를 걸으며 조수리의 삶을 들어요.",
      price: 15000,
      durationMin: 90,
      capacityMin: 2,
      capacityMax: 15,
      timeline: [
        { time: "0:00", desc: "마을 안내소 · 물의 마을 이야기" },
        { time: "0:30", desc: "옛 물통 자리 · 돗곳물 산책" },
        { time: "1:10", desc: "문촌 골목 · 마을 다방 차 한잔" },
      ],
      includes: "해설, 전통차",
      excludes: "개인 경비",
      notice: "도보 이동이 있어요. 편한 신발을 권해요.",
      images: [{ assetId: "seed2", url: img("water1"), thumbUrl: img("water1", 480, 320) }],
      seasonal: false,
      status: "published",
    },
    {
      id: "rose-picnic",
      title: "장미돌담 피크닉",
      concept: "5~6월 장미철 한정, 돌담길 위의 붉은 소풍",
      hook: "봄이면 조수리 돌담은 장미로 붉게 물들어요. 장미돌담길을 걷고, 마을이 준비한 피크닉 세트로 가장 예쁜 계절의 제주를 즐겨요.",
      price: 35000,
      durationMin: 90,
      capacityMin: 2,
      capacityMax: 8,
      timeline: [
        { time: "0:00", desc: "장미돌담길 산책 · 포토 스팟" },
        { time: "0:40", desc: "돌담 아래 피크닉 세트" },
      ],
      includes: "피크닉 세트, 음료, 돗자리",
      excludes: "개인 간식",
      notice: "장미 개화 상황에 따라 운영 기간이 조정될 수 있어요(보통 5~6월).",
      images: [{ assetId: "seed3", url: img("rose1"), thumbUrl: img("rose1", 480, 320) }],
      seasonal: true,
      status: "published",
    },
  ];
  for (const p of products) {
    await db.doc(`villages/${VID}/products/${p.id}`).set({
      villageId: VID,
      villageSlug: VID,
      villageName: "조수리",
      ...p,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── feed posts ──
  const posts = [
    {
      id: "post-rose",
      caption: "오늘 장미돌담길에 장미가 활짝 폈어요 🌹 지금이 딱 제철!",
      tags: ["장미", "돌담길", "봄"],
      publishedAt: hoursAgo(3),
      media: [{ assetId: "m1", url: img("feed-rose"), thumbUrl: img("feed-rose", 480, 480), width: 1200, height: 1200 }],
    },
    {
      id: "post-nangnamu",
      caption: "480년 팽나무 아래, 오늘도 마을 어르신들이 모이셨어요.",
      tags: ["팽나무", "당산나무"],
      publishedAt: daysAgo(1),
      media: [{ assetId: "m2", url: img("feed-tree"), thumbUrl: img("feed-tree", 480, 480), width: 1200, height: 1200 }],
    },
    {
      id: "post-bille",
      caption: "사장밭 빌레용암 트레킹, 오늘 날씨 최고였습니다 ☀️",
      tags: ["빌레", "트레킹"],
      publishedAt: daysAgo(2),
      media: [{ assetId: "m3", url: img("feed-bille"), thumbUrl: img("feed-bille", 480, 480), width: 1200, height: 1200 }],
    },
  ];
  for (const post of posts) {
    await db.doc(`villages/${VID}/feed_posts/${post.id}`).set({
      villageId: VID,
      villageSlug: VID,
      villageName: "조수리",
      caption: post.caption,
      tags: post.tags,
      visibility: "global",
      isPinned: post.id === "post-rose",
      media: post.media,
      publishedAt: post.publishedAt,
      authorId: "seed-admin",
    });
  }

  // ── 운영자 계정 + custom claims ──
  const email = "admin@josuri.kr";
  const password = "josuri1234";
  let uid;
  try {
    const u = await auth.getUserByEmail(email);
    uid = u.uid;
  } catch {
    const u = await auth.createUser({ email, password, displayName: "조수리 운영자" });
    uid = u.uid;
  }
  await auth.setCustomUserClaims(uid, {
    role: "village_admin",
    managedVillages: [VID],
  });
  await db.doc(`users/${uid}`).set({
    name: "조수리 운영자",
    email,
    phone: null,
    role: "village_admin",
    managedVillages: [VID],
    createdAt: now,
  });

  console.log("✅ 시드 완료");
  console.log(`   마을: /v/${VID}`);
  console.log(`   운영자 로그인: ${email} / ${password}`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  });
