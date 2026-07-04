# 제주마을 웹빌더 🌱

제주 마을들이 코딩 없이 자기 마을의 관광 홈페이지를 만들고, 실시간 사진 소식·체험상품·예약을 한 곳에서 운영하는 웹빌더 플랫폼. (기획서: [`docs/제주마을_웹빌더_기획서.md`](docs/제주마을_웹빌더_기획서.md))

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **Tailwind CSS 4**
- **Vercel** 호스팅 / **Firebase** (Auth · Firestore · Storage) 백엔드
- **Kakao Map** JavaScript SDK (인터랙티브 제주 지도)
- 폰트: 제목 `Jua`(구글폰트), 본문 `Pretendard`(CDN)

## 구현 범위 (Phase 0 · P0)

| 영역 | 화면 |
|------|------|
| 공개 | 메인(지도+실시간피드+추천체험) `/`, 마을찾기 `/villages`, 마을홈 템플릿 `/v/{slug}`, 상품상세 `/v/{slug}/product/{id}`, 예약신청 `.../book`, 통합피드 `/feed` |
| 운영자 | 대시보드 `/admin`, 소식발행 `/admin/feed`, 체험상품 `/admin/products`, 예약관리 `/admin/bookings`, 테마·마스코트·음악 `/admin/theme`, 마을정보 `/admin/village` |
| 인증 | 로그인 `/login` (Firebase Auth + httpOnly 세션쿠키, 역할기반 접근제어) |

마을 홈(`/v/{slug}`)은 **데이터 주입형 템플릿**입니다 — 하드코딩 없이 DB 데이터로 렌더되고, 빈 섹션은 자동 숨김, 테마 색상은 마을별로 스와핑됩니다.

## 시작하기

### 1. 환경변수

`.env.example` 를 참고해 `.env.local` 을 채웁니다.

- `NEXT_PUBLIC_FIREBASE_*` — Firebase 콘솔 > 프로젝트 설정 > 웹 앱
- `FIREBASE_ADMIN_*` — 서비스 계정 JSON (서버 전용)
- `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` — Kakao Developers > JavaScript 키 (Web 플랫폼에 `http://localhost:3000` 도메인 등록)

> 키가 없어도 앱은 실행됩니다(빈 상태 + 지도 폴백). 키를 넣으면 실데이터·지도가 활성화됩니다.

### 2. 개발 서버

```bash
pnpm dev
```

### 3. 샘플 데이터(조수리) 시드

**옵션 A — 로컬 에뮬레이터** (자격증명 불필요)

```bash
# .env.local 에 NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1
pnpm emulators      # 별도 터미널에서 실행 유지
pnpm seed
```

**옵션 B — 실제 Firebase 프로젝트** (`FIREBASE_ADMIN_*` 설정 후)

```bash
pnpm seed
```

시드 결과:
- 마을 `조수리` → http://localhost:3000/v/josuri
- 운영자 로그인: `admin@josuri.kr` / `josuri1234` → http://localhost:3000/login

### 4. 보안규칙·인덱스 배포 (실제 프로젝트)

```bash
pnpm deploy:rules   # firestore.rules, firestore.indexes.json, storage.rules
```

## 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm typecheck` | 타입 검사 |
| `pnpm lint` | ESLint |
| `pnpm emulators` | Firebase 에뮬레이터(auth/firestore/storage) |
| `pnpm seed` | 조수리 샘플 데이터 시드 |
| `pnpm deploy:rules` | 보안규칙·인덱스 배포 |

## 아키텍처 메모

- **읽기(공개)**: Server Component에서 Admin SDK(`src/lib/repo/server.ts`)로 조회 → SEO/ISR. 자격증명 미설정 시 빈 값 폴백.
- **쓰기·실시간(운영자)**: 클라이언트 SDK(`src/lib/repo/client.ts`) + `onSnapshot`. Firestore 보안규칙이 최종 방어.
- **이미지**: 업로드 시 클라이언트 canvas 리사이즈(1600/480, WebP, EXIF GPS 제거) → Storage. (Cloud Function 없이 동작)
- **통합 피드**: `feed_posts` Collection Group Query(`visibility == 'global'`).
- **RBAC**: Auth Custom Claims(`role`, `managedVillages`) 기반. 세션은 httpOnly 쿠키.

## 후속(확정 필요 — 기획서 부록 C)

예약 알림(SMS/FCM 벤더), 결제(PG), 플랫폼 관리자(P2), 다국어, 컬러/폰트 최종 확정 등. `src/app/api/bookings/route.ts` 에 알림 발송 지점(TODO) 표시됨.
