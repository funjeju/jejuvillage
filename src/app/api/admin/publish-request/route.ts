import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const { villageId } = (await req.json().catch(() => ({}))) as { villageId?: string };
  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  await adminDb()
    .doc(paths.village(villageId))
    .update({
      publishRequestedAt: FieldValue.serverTimestamp(),
      publishRequestedBy: user?.uid ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  return NextResponse.json({ ok: true });
}
