"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ProductEditor } from "@/components/admin/product-editor";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenProducts, deleteProduct, updateProduct } from "@/lib/repo/client";
import { productInputSchema } from "@/lib/schemas";
import type { Product } from "@/lib/types";
import { formatPrice, formatDuration } from "@/lib/utils";

export default function AdminProductsPage() {
  const { village } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null | "new">(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return listenProducts(village.id, setProducts);
  }, [village.id]);

  async function togglePublish(p: Product) {
    const next = p.status === "published" ? "draft" : "published";
    // 스키마 통과를 위해 기존 값 재검증
    const parsed = productInputSchema.safeParse({ ...p, status: next });
    if (!parsed.success) {
      alert("게시하려면 필수 항목(상품명/가격/정원 등)을 먼저 채워주세요.");
      return;
    }
    await updateProduct(village.id, p.id, parsed.data);
  }

  if (editing) {
    return (
      <ProductEditor
        product={editing === "new" ? null : editing}
        onDone={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <PageTitle
        title="체험상품"
        desc="상품을 등록하고 게시 상태를 관리해요."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={18} /> 새 상품
          </Button>
        }
      />

      {products.length ? (
        <div className="grid gap-3">
          {products.map((p) => (
            <Panel key={p.id} className="flex items-center gap-4 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-green-100">
                {p.images[0] && (
                  <Image src={p.images[0].thumbUrl || p.images[0].url} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg truncate">{p.title}</h3>
                  {p.status === "published" ? (
                    <Badge tone="green">게시중</Badge>
                  ) : (
                    <Badge tone="neutral">임시저장</Badge>
                  )}
                  {p.seasonal && <Badge tone="accent">시즌</Badge>}
                </div>
                <p className="text-sm text-ink-500 truncate">{p.concept}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {formatPrice(p.price)} · {formatDuration(p.durationMin)} · {p.capacityMin}~{p.capacityMax}인
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <IconBtn onClick={() => togglePublish(p)} label={p.status === "published" ? "비공개" : "게시"}>
                  {p.status === "published" ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconBtn>
                <IconBtn onClick={() => setEditing(p)} label="수정">
                  <Pencil size={16} />
                </IconBtn>
                <IconBtn
                  danger
                  onClick={() => {
                    if (confirm(`"${p.title}" 상품을 삭제할까요?`)) deleteProduct(village.id, p.id);
                  }}
                  label="삭제"
                >
                  <Trash2 size={16} />
                </IconBtn>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="py-16 text-center text-ink-500">
          아직 등록한 체험상품이 없어요.
          <div className="mt-4">
            <Button onClick={() => setEditing("new")}>
              <Plus size={18} /> 첫 상품 등록하기
            </Button>
          </div>
        </Panel>
      )}
    </div>
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
      className={`grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-500 transition-colors ${
        danger ? "hover:border-[var(--accent)] hover:text-[var(--accent)]" : "hover:border-green-600 hover:text-green-700"
      }`}
    >
      {children}
    </button>
  );
}
