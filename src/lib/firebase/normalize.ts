/**
 * Firestore 값 정규화 유틸.
 * Timestamp / Date / number 등을 epoch millis(number)로 변환한다.
 * (Admin SDK Timestamp 와 Client SDK Timestamp 를 모두 수용)
 */

type TimestampLike =
  | { toMillis: () => number }
  | { seconds: number; nanoseconds?: number }
  | Date
  | number
  | null
  | undefined;

export function toMillis(v: TimestampLike): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  if (typeof (v as { toMillis?: unknown }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof (v as { seconds?: unknown }).seconds === "number") {
    const s = v as { seconds: number; nanoseconds?: number };
    return s.seconds * 1000 + Math.floor((s.nanoseconds ?? 0) / 1e6);
  }
  return 0;
}

export function toMillisOrNull(v: TimestampLike): number | null {
  if (v == null) return null;
  return toMillis(v);
}
