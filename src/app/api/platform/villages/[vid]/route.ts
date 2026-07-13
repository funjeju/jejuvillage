import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { requirePlatformAdmin } from "@/lib/auth/require-platform";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 마을 게시/비공개 토글 (P1, FR-PLT-01).
 * body: { status: 'published' | 'draft' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ vid: string }> }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { vid } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (status !== "published" && status !== "draft") {
    return NextResponse.json({ error: "status 값이 올바르지 않습니다." }, { status: 422 });
  }

  try {
    const ref = adminDb().doc(paths.village(vid));
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: "마을을 찾을 수 없습니다." }, { status: 404 });
    }
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json(
      { error: "상태 변경 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 마을 완전 삭제 (플랫폼 관리자 전용).
 * 하위 컬렉션(theme/stories/feed_posts/products/bookings/report)까지 재귀 삭제한다.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ vid: string }> }
) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { vid } = await params;
  try {
    const db = adminDb();
    const ref = db.doc(paths.village(vid));
    if (!(await ref.get()).exists) {
      return NextResponse.json({ error: "마을을 찾을 수 없습니다." }, { status: 404 });
    }
    await db.recursiveDelete(ref);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "삭제 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
