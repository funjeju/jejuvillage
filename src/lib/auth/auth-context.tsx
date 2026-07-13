"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { clientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Role } from "@/lib/types";

interface AuthState {
  user: User | null;
  role: Role;
  managedVillages: string[];
  loading: boolean;
  /** 서버 httpOnly 세션 쿠키가 클라이언트 로그인과 동기화됐는지 (SSR 가드 통과 가능 여부) */
  sessionSynced: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * 클라이언트 인증 컨텍스트.
 * 로그인 성공 시 ID 토큰을 서버로 보내 httpOnly 세션 쿠키를 발급받는다(SSR 가드용).
 * role/managedVillages 는 커스텀 클레임에서 읽는다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [managedVillages, setManagedVillages] = useState<string[]>([]);
  // 미설정 시엔 대기할 필요가 없으므로 loading 초기값을 configured 로 둔다.
  const [loading, setLoading] = useState(configured);
  const [sessionSynced, setSessionSynced] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const unsub = onAuthStateChanged(clientAuth(), async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult();
        setRole((token.claims.role as Role) ?? "guest");
        setManagedVillages((token.claims.managedVillages as string[]) ?? []);
        // 서버 httpOnly 세션 쿠키를 클라이언트 로그인과 동기화(만료/부재 시 재발급) →
        // SSR 가드(/admin)가 /login 으로 되던지는 무한 리다이렉트 방지
        try {
          await createSession(await u.getIdToken());
          setSessionSynced(true);
        } catch {
          setSessionSynced(false);
        }
      } else {
        setRole("guest");
        setManagedVillages([]);
        setSessionSynced(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  async function createSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "세션 생성 실패" }));
      throw new Error(error ?? "세션 생성 실패");
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(clientAuth(), email, password);
    await createSession(await cred.user.getIdToken());
    setSessionSynced(true);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(clientAuth(), provider);
    await createSession(await cred.user.getIdToken());
    setSessionSynced(true);
  }, []);

  /** 서버에서 커스텀 클레임(권한/관리마을)이 바뀐 뒤 토큰·세션을 갱신 */
  const refreshSession = useCallback(async () => {
    const u = clientAuth().currentUser;
    if (!u) return;
    const idToken = await u.getIdToken(true); // 강제 갱신 → 새 클레임 반영
    await createSession(idToken);
    setSessionSynced(true);
    const token = await u.getIdTokenResult();
    setRole((token.claims.role as Role) ?? "guest");
    setManagedVillages((token.claims.managedVillages as string[]) ?? []);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setSessionSynced(false);
    if (configured) await fbSignOut(clientAuth());
  }, [configured]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        managedVillages,
        loading,
        sessionSynced,
        configured,
        signIn,
        signInWithGoogle,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 는 AuthProvider 안에서만 사용하세요.");
  return ctx;
}
