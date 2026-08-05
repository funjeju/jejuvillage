"use client";

import { useAdmin } from "@/lib/admin/admin-context";
import { LandingEditor } from "@/components/admin/landing-editor";

export default function AdminLandingPage() {
  const { village } = useAdmin();
  return <LandingEditor village={village} />;
}
