"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Send, Pin, PinOff, Trash2, Globe, Lock, Pencil, X } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  createFeedPost,
  listenVillageFeed,
  deleteFeedPost,
  setFeedPostPinned,
  updateFeedPost,
} from "@/lib/repo/client";
import { useAuth } from "@/lib/auth/auth-context";
import { feedPostInputSchema } from "@/lib/schemas";
import type { UploadedImage } from "@/lib/firebase/storage";
import type { FeedPost } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export default function AdminFeedPage() {
  const { village } = useAdmin();
  const { user } = useAuth();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [caption, setCaption] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [visibility, setVisibility] = useState<"global" | "village_only">("global");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedPost | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return listenVillageFeed(village.id, setPosts, 100);
  }, [village.id]);

  async function publish() {
    setError(null);
    const tags = tagsRaw
      .split(/[,\s#]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const parsed = feedPostInputSchema.safeParse({
      caption,
      tags,
      visibility,
      media: images,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    if (!user) {
      setError("로그인이 필요해요.");
      return;
    }
    setBusy(true);
    try {
      await createFeedPost(
        { id: village.id, slug: village.slug, name: village.name },
        user.uid,
        parsed.data
      );
      setImages([]);
      setCaption("");
      setTagsRaw("");
    } catch (e) {
      setError((e as Error).message || "발행에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title="소식 발행" desc="사진 한 장과 한 줄로 지금의 마을을 알려요." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* 발행 폼 */}
        <Panel className="h-fit">
          <div className="space-y-4">
            <div>
              <label className={adminLabel}>사진</label>
              <ImageUploader villageId={village.id} folder="feed" value={images} onChange={setImages} max={10} />
            </div>
            <div>
              <label className={adminLabel} htmlFor="caption">
                한 줄 캡션
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="오늘 장미돌담길에 장미가 활짝 폈어요 🌹"
                className={adminField}
              />
            </div>
            <div>
              <label className={adminLabel} htmlFor="tags">
                태그 (선택)
              </label>
              <input
                id="tags"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="#장미 #체험 #축제"
                className={adminField}
              />
            </div>
            <div>
              <label className={adminLabel}>공개 범위</label>
              <div className="flex gap-2">
                <VisBtn active={visibility === "global"} onClick={() => setVisibility("global")} icon={<Globe size={15} />}>
                  마을홈 + 통합피드
                </VisBtn>
                <VisBtn active={visibility === "village_only"} onClick={() => setVisibility("village_only")} icon={<Lock size={15} />}>
                  마을홈만
                </VisBtn>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
                {error}
              </p>
            )}

            <Button onClick={publish} disabled={busy} size="lg" className="w-full">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {busy ? "발행 중…" : "소식 발행하기"}
            </Button>
          </div>
        </Panel>

        {/* 발행 목록 */}
        <div>
          <h2 className="mb-3 font-display text-lg">발행한 소식 ({posts.length})</h2>
          {posts.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posts.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-line/80 bg-white">
                  <div className="relative aspect-square bg-green-100">
                    {p.media[0] && (
                      <Image src={p.media[0].thumbUrl || p.media[0].url} alt="" fill sizes="200px" className="object-cover" />
                    )}
                    {p.isPinned && (
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white">
                        📌 고정
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-ink-700 line-clamp-2">{p.caption}</p>
                    <p className="mt-1 text-[11px] text-ink-500">{timeAgo(p.publishedAt)}</p>
                    <div className="mt-2 flex gap-1">
                      <IconBtn
                        onClick={() => setFeedPostPinned(village.id, p.id, !p.isPinned)}
                        label={p.isPinned ? "고정 해제" : "상단 고정"}
                      >
                        {p.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </IconBtn>
                      <IconBtn onClick={() => setEditing(p)} label="수정">
                        <Pencil size={14} />
                      </IconBtn>
                      <IconBtn
                        danger
                        onClick={() => {
                          if (confirm("이 소식을 삭제할까요?")) deleteFeedPost(village.id, p.id);
                        }}
                        label="삭제"
                      >
                        <Trash2 size={14} />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Panel className="text-center text-sm text-ink-500 py-12">
              아직 발행한 소식이 없어요. 왼쪽에서 첫 소식을 올려보세요!
            </Panel>
          )}
        </div>
      </div>

      {editing && (
        <EditPostModal
          villageId={village.id}
          post={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditPostModal({
  villageId,
  post,
  onClose,
}: {
  villageId: string;
  post: FeedPost;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [tagsRaw, setTagsRaw] = useState(post.tags.join(" "));
  const [visibility, setVisibility] = useState<"global" | "village_only">(post.visibility);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!caption.trim()) {
      setError("캡션을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tags = tagsRaw.split(/[,\s#]+/).map((t) => t.trim()).filter(Boolean).slice(0, 10);
      await updateFeedPost(villageId, post.id, { caption: caption.trim(), tags, visibility });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Panel className="relative w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">소식 수정</h2>
          <button onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={adminLabel}>캡션</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} maxLength={300} className={adminField} />
          </div>
          <div>
            <label className={adminLabel}>태그</label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="#장미 #체험" className={adminField} />
          </div>
          <div>
            <label className={adminLabel}>공개 범위</label>
            <div className="flex gap-2">
              <VisBtn active={visibility === "global"} onClick={() => setVisibility("global")} icon={<Globe size={15} />}>
                마을홈 + 통합피드
              </VisBtn>
              <VisBtn active={visibility === "village_only"} onClick={() => setVisibility("village_only")} icon={<Lock size={15} />}>
                마을홈만
              </VisBtn>
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              저장
            </Button>
            <Button variant="ghost" onClick={onClose}>취소</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function VisBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
        active ? "border-green-600 bg-green-100 text-green-800" : "border-line text-ink-500"
      )}
    >
      {icon} {children}
    </button>
  );
}

function IconBtn({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-lg border transition-colors",
        danger
          ? "border-line text-ink-500 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          : "border-line text-ink-500 hover:border-green-600 hover:text-green-700"
      )}
    >
      {children}
    </button>
  );
}
