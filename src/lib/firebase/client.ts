"use client";

import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage";

/**
 * Firebase 클라이언트 SDK 초기화 (브라우저 전용).
 * 환경변수 미설정 시에도 앱이 크래시하지 않도록 지연 초기화한다.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1" &&
  typeof window !== "undefined";

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId);
}

let _app: FirebaseApp | null = null;
let _emulatorConnected = false;

function app(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length
    ? getApp()
    : initializeApp(
        isFirebaseConfigured()
          ? config
          : // 에뮬레이터/미설정 시 데모 프로젝트로 초기화 (SDK 요구사항)
            { apiKey: "demo", projectId: "demo-jejuvillage", appId: "demo" }
      );
  return _app;
}

export function clientAuth(): Auth {
  const auth = getAuth(app());
  maybeConnectEmulators(auth, null, null);
  return auth;
}

export function clientDb(): Firestore {
  const db = getFirestore(app());
  maybeConnectEmulators(null, db, null);
  return db;
}

export function clientStorage(): FirebaseStorage {
  const storage = getStorage(app());
  maybeConnectEmulators(null, null, storage);
  return storage;
}

function maybeConnectEmulators(
  auth: Auth | null,
  db: Firestore | null,
  storage: FirebaseStorage | null
) {
  if (!useEmulator || _emulatorConnected) return;
  try {
    if (auth) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    if (db) connectFirestoreEmulator(db, "127.0.0.1", 8080);
    if (storage) connectStorageEmulator(storage, "127.0.0.1", 9199);
  } catch {
    // 이미 연결된 경우 무시
  }
  _emulatorConnected = true;
}
