"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface AdminVillage {
  id: string;
  slug: string;
  name: string;
}
export interface AdminSessionInfo {
  uid: string;
  name: string;
  role: "village_admin" | "platform_admin";
}

interface AdminCtx {
  village: AdminVillage;
  user: AdminSessionInfo;
}

const Ctx = createContext<AdminCtx | null>(null);

export function AdminProvider({
  village,
  user,
  children,
}: AdminCtx & { children: ReactNode }) {
  return <Ctx.Provider value={{ village, user }}>{children}</Ctx.Provider>;
}

export function useAdmin(): AdminCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin 는 AdminProvider 안에서만 사용하세요.");
  return ctx;
}
