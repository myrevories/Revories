"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { purgeAssetsAction, trashAssetsAction } from "@/app/actions";
import { Modal } from "@/components/modal";
import type { Asset } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

/** Deleted items: restore them, or remove them for good (with confirmation). */
export function TrashList({ assets }: { assets: Asset[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const ids = selected.length ? selected : assets.map((a) => a.id);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-[13px] text-ink-2">{selected.length ? `${selected.length} selected` : `${assets.length} items in the trash`}</span>
        <button type="button" disabled={!assets.length || pending} onClick={() => start(async () => (await trashAssetsAction(ids, true), setSelected([])))} className="flex h-10 items-center gap-2 rounded-full bg-white/80 px-4 text-[13px] text-ink hover:bg-white disabled:opacity-40">
          <RotateCcw className="size-4" /> Restore {selected.length ? "selected" : "all"}
        </button>
        <button type="button" disabled={!assets.length || pending} onClick={() => setConfirm(true)} className="flex h-10 items-center gap-2 rounded-full px-4 text-[13px] text-danger hover:bg-danger-soft disabled:opacity-40">
          <Trash2 className="size-4" /> Delete forever
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {assets.map((a) => {
          const on = selected.includes(a.id);
          return (
            <button key={a.id} type="button" onClick={() => setSelected((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))} className={cn("overflow-hidden rounded-xl bg-white/70 text-left", on && "ring-[3px] ring-accent")}>
              <img src={a.thumbUrl} alt="" className="aspect-[4/3] w-full object-cover opacity-80" />
              <div className="px-2.5 py-2">
                <div className="truncate text-[12px] text-ink">{a.filename}</div>
                <div className="text-[10.5px] text-muted">Deleted {a.deletedAt ? formatRelative(a.deletedAt) : ""}</div>
              </div>
            </button>
          );
        })}
      </div>
      {confirm && (
        <Modal
          title="Delete forever?"
          description="These memories will be permanently removed for everyone in this project. This can’t be undone."
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button type="button" onClick={() => setConfirm(false)} className="h-10 rounded-full px-4 text-[13px] text-ink-2">
                Keep them
              </button>
              <button type="button" onClick={() => start(async () => (await purgeAssetsAction(ids), setSelected([]), setConfirm(false)))} className="h-10 rounded-full bg-danger px-5 text-[13px] text-white">
                Delete {ids.length} forever
              </button>
            </>
          }
        >
          <p className="text-[13px] text-ink-2">Tip: restoring is always available until you delete them here.</p>
        </Modal>
      )}
    </div>
  );
}
