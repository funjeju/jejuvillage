import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { bookingInputSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 예약 신청 (S5, FR-BOOK-01).
 * 방문자는 로그인 없이 신청 가능. 서버에서 상품 존재 확인 + 비정규화 후
 * status=REQUESTED 로 저장한다. 운영자 알림은 후속(FCM/SMS) — 여기선 스텁.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { villageId } = (body ?? {}) as { villageId?: string };
  if (!villageId) {
    return NextResponse.json({ error: "villageId 가 필요합니다." }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값을 확인해 주세요.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const input = parsed.data;

  try {
    const productSnap = await adminDb()
      .doc(`${paths.products(villageId)}/${input.productId}`)
      .get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }
    const product = productSnap.data()!;

    const ref = await adminDb()
      .collection(paths.bookings(villageId))
      .add({
        productId: input.productId,
        productTitle: product.title ?? "",
        villageId,
        villageName: product.villageName ?? "",
        date: input.date,
        headcount: input.headcount,
        applicantName: input.applicantName,
        applicantPhone: input.applicantPhone,
        memo: input.memo ?? "",
        status: "REQUESTED",
        createdAt: FieldValue.serverTimestamp(),
      });

    // TODO(알림): 마을 운영자에게 FCM/SMS 발송 (부록C #5, #12 벤더 확정 후)
    console.info(`[booking] REQUESTED ${ref.id} @ ${villageId}/${input.productId}`);

    return NextResponse.json({ ok: true, bookingId: ref.id });
  } catch (err) {
    return NextResponse.json(
      { error: "예약 저장에 실패했습니다.", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
