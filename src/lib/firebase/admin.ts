import "server-only";
import {
  getApps,
  initializeApp,
  cert,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK (서버 전용).
 * Vercel 환경변수로 서비스 계정 자격증명을 주입한다.
 * 에뮬레이터 모드에서는 자격증명 없이 프로젝트 ID만으로 동작한다.
 */

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1";

function createApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "demo-jejuvillage";

  if (useEmulator) {
    // 에뮬레이터 사용 시 자격증명 불필요
    process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  // 자격증명 미설정: projectId 만으로 초기화한다.
  // (ADC 의 metadata 서버 조회로 인한 행(hang)을 피하고, 호출 시 즉시 실패 → repo safe() 가 폴백)
  return initializeApp({ projectId });
}

let _app: App | null = null;
function adminApp(): App {
  if (!_app) _app = createApp();
  return _app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
