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
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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

  useEffect(() => {
    if (!configured) return;
    const unsub = onAuthStateChanged(clientAuth(), async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult();
        setRole((token.claims.role as Role) ?? "guest");
        setManagedVillages((token.claims.managedVillages as string[]) ?? []);
      } else {
        setRole("guest");
        setManagedVillages([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(clientAuth(), email, password);
    const idToken = await cred.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "세션 생성 실패" }));
      throw new Error(error ?? "세션 생성 실패");
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (configured) await fbSignOut(clientAuth());
  }, [configured]);

  return (
    <AuthContext.Provider
      value={{ user, role, managedVillages, loading, configured, signIn, signOut }}
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
