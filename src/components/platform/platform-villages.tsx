"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  ExternalLink,
  Check,
  MapPin,
  X,
  Trash2,
} from "lucide-react";
import { PageTitle, Panel, StatCard, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { villageCreateSchema } from "@/lib/schemas";
import type { Village } from "@/lib/types";

export function PlatformVillages({ villages }: { villages: Village[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [inviteFor, setInviteFor] = useState<Village | null>(null);

  const published = villages.filter((v) => v.status === "published").length;

  return (
    <div>
      <PageTitle
        title="마을 관리"
        desc="생성된 모든 마을 홈페이지를 관리해요. 마을 개설·게시·운영자 초대."
        action={
          <Button onClick={() => setCreating((v) => !v)}>
            <Plus size={18} /> 새 마을
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="전체 마을" value={villages.length} tone="green" />
        <StatCard label="게시중" value={published} tone="sky" />
        <StatCard label="준비중" value={villages.length - published} tone="brown" />
      </div>

      {creating && (
        <CreateVillageForm
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {villages.length ? (
        <div className="mt-4 grid gap-3">
          {villages.map((v) => (
            <VillageRow
              key={v.id}
              village={v}
              onChanged={() => router.refresh()}
              onInvite={() => setInviteFor(v)}
            />
          ))}
        </div>
      ) : (
        <Panel className="mt-4 py-16 text-center text-ink-500">
          아직 생성된 마을이 없어요. 우측 상단 “새 마을”로 첫 마을을 개설하세요.
        </Panel>
      )}

      {inviteFor && (
        <InviteModal village={inviteFor} onClose={() => setInviteFor(null)} />
      )}
    </div>
  );
}

function VillageRow({
  village,
  onChanged,
  onInvite,
}: {
  village: Village;
  onChanged: () => void;
  onInvite: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = village.status === "published" ? "draft" : "published";
    await fetch(`/api/platform/villages/${village.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    onChanged();
  }

  async function remove() {
    const sure = window.confirm(
      `"${village.name}" 마을을 완전히 삭제할까요?\n홈페이지·소식·상품·예약이 모두 지워지고 되돌릴 수 없어요.`
    );
    if (!sure) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/platform/villages/${village.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      onChanged();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg">{village.name}</h3>
          {village.status === "published" ? (
            <Badge tone="green">게시중</Badge>
          ) : village.publishRequestedAt ? (
            <Badge tone="accent">게시 요청됨</Badge>
          ) : (
            <Badge tone="neutral">준비중</Badge>
          )}
          <code className="text-xs text-ink-500">/{village.slug}</code>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
          <MapPin size={12} /> {village.region} · {village.oneLiner || "소개 미등록"}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="soft" size="sm" onClick={onInvite}>
          <UserPlus size={15} /> 운영자 초대
        </Button>
        <Button variant="outline" size="sm" onClick={toggle} disabled={busy}>
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : village.status === "published" ? (
            <EyeOff size={15} />
          ) : (
            <Eye size={15} />
          )}
          {village.status === "published" ? "비공개" : "게시"}
        </Button>
        <Link
          href={`/v/${village.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-full border-2 border-green-700 px-4 text-sm font-semibold text-green-800 hover:bg-green-100"
        >
          <ExternalLink size={15} /> 홈
        </Link>
        <button
          onClick={remove}
          disabled={deleting}
          className="inline-flex items-center gap-1 rounded-full border-2 border-[var(--accent)]/60 px-4 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          삭제
        </button>
      </div>
    </Panel>
  );
}

function CreateVillageForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      slug: String(fd.get("slug") ?? ""),
      name: String(fd.get("name") ?? ""),
      region: String(fd.get("region") ?? ""),
      oneLiner: String(fd.get("oneLiner") ?? ""),
      lat: fd.get("lat"),
      lng: fd.get("lng"),
    };
    const parsed = villageCreateSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/platform/villages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg">새 마을 개설</h2>
        <button onClick={onCancel} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={adminLabel}>slug (URL, 예: josuri)</label>
          <input name="slug" placeholder="hallim" className={adminField} />
        </div>
        <div>
          <label className={adminLabel}>마을명</label>
          <input name="name" placeholder="한림리" className={adminField} />
        </div>
        <div>
          <label className={adminLabel}>지역</label>
          <input name="region" placeholder="제주시 한림읍" className={adminField} />
        </div>
        <div>
          <label className={adminLabel}>한줄 소개</label>
          <input name="oneLiner" placeholder="바다와 오름이 만나는 마을" className={adminField} />
        </div>
        <div>
          <label className={adminLabel}>위도 (33~34)</label>
          <input name="lat" placeholder="33.41" className={adminField} />
        </div>
        <div>
          <label className={adminLabel}>경도 (126~127)</label>
          <input name="lng" placeholder="126.27" className={adminField} />
        </div>
        {error && (
          <p className="sm:col-span-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            {error}
          </p>
        )}
        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            마을 만들기
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function InviteModal({ village, onClose }: { village: Village; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ note: string; tempPassword: string | null } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch("/api/platform/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId: village.id, email: String(fd.get("email")) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "초대 실패");
      setResult({ note: data.note, tempPassword: data.tempPassword });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Panel className="relative w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">{village.name} 운영자 초대</h2>
          <button onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div>
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <Check size={18} /> 완료
            </div>
            <p className="mt-2 text-sm text-ink-700">{result.note}</p>
            {result.tempPassword && (
              <div className="mt-3 rounded-xl bg-cream-100 p-3 text-sm">
                임시 비밀번호: <code className="font-bold">{result.tempPassword}</code>
                <p className="mt-1 text-xs text-ink-500">
                  운영자에게 안전하게 전달하고, 로그인 후 변경을 권장하세요.
                </p>
              </div>
            )}
            <Button className="mt-4 w-full" onClick={onClose}>
              닫기
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className={adminLabel}>운영자 이메일</label>
            <input name="email" type="email" required placeholder="admin@village.kr" className={adminField} />
            <p className="mt-1 text-xs text-ink-500">
              계정이 없으면 새로 만들고 임시 비밀번호를 발급해요. 이 마을의 관리 권한이 부여됩니다.
            </p>
            {error && (
              <p className="mt-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
                {error}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                초대하기
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                취소
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  );
}
