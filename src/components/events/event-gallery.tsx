"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpDown, Copy, FolderPlus, Heart, MoreHorizontal, Play, Plus, User } from "lucide-react";
import { createAlbumAction, createTagAction, updateAssetsAction } from "@/app/actions";
import { useMeta } from "@/components/meta-context";
import { DuplicatesModal } from "@/components/review/review-workspace";
import type { Asset } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";

const TABS = [
  ["all", "All"],
  ["photo", "Photos"],
  ["video", "Videos"],
  ["artifact", "Artifacts"],
  ["story", "Stories"],
  ["unidentified", "Unidentified"],
] as const;

function ToolBtn({ icon, children, onClick, disabled }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-[12.5px] text-ink-2 shadow-[var(--shadow-soft)] hover:text-ink disabled:opacity-50 [&>svg]:size-4"
    >
      {icon}
      {children}
    </button>
  );
}

/** Tabs, sort, bulk tools and the "Submitted by …" photo grid from the event detail concept. */
export function EventGallery({ assets, contributors, bookHref }: { assets: Asset[]; contributors: Record<string, string>; bookHref: string }) {
  const meta = useMeta();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [oldestFirst, setOldestFirst] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [dupes, setDupes] = useState(false);
  const [note, setNote] = useState<string>();
  const [pending, start] = useTransition();

  const count = (k: string) =>
    assets.filter((a) => (k === "all" ? true : k === "story" ? !!a.caption : k === "unidentified" ? !a.people.length : a.kind === k)).length;
  const shown = useMemo(
    () =>
      assets
        .filter((a) => (tab === "all" ? true : tab === "story" ? !!a.caption : tab === "unidentified" ? !a.people.length : a.kind === tab))
        .sort((a, b) => ((a.takenAt ?? "") < (b.takenAt ?? "") ? -1 : 1) * (oldestFirst ? 1 : -1)),
    [assets, tab, oldestFirst],
  );
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const flash = (t: string) => (setNote(t), setTimeout(() => setNote(undefined), 2500));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn("h-9 rounded-full px-5 text-[12.5px] transition", tab === k ? "bg-gradient-to-b from-accent-2 to-accent text-white" : "bg-sunken text-ink-2 hover:text-ink")}
          >
            {label} ({count(k)})
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink">Sort by</span>
          <select value={oldestFirst ? "old" : "new"} onChange={(e) => setOldestFirst(e.target.value === "old")} className="h-10 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-ink-2">
            <option value="old">Date (oldest first)</option>
            <option value="new">Date (newest first)</option>
          </select>
        </label>
        <button type="button" aria-label="Reverse order" onClick={() => setOldestFirst((o) => !o)} className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink-2">
          <ArrowUpDown className="size-4" />
        </button>
        <ToolBtn icon={<Copy />} onClick={() => setDupes(true)}>
          Compare duplicates
        </ToolBtn>
        <ToolBtn
          icon={<Heart />}
          disabled={!selected.length || pending}
          onClick={() =>
            start(async () => {
              const tag = await createTagAction(meta.projectId, "Favorite");
              await updateAssetsAction(selected, { addTagIds: [tag.id] });
              flash(`${selected.length} marked as favorites`);
              setSelected([]);
            })
          }
        >
          Select favorites
        </ToolBtn>
        <ToolBtn
          icon={<FolderPlus />}
          disabled={!selected.length || pending}
          onClick={() =>
            start(async () => {
              await createAlbumAction(meta.projectId, `${meta.event(assets[0]?.eventId)?.name ?? "Event"} picks`, selected);
              flash(`Album created with ${selected.length} photos`);
              setSelected([]);
            })
          }
        >
          Create album
        </ToolBtn>
        <Link
          href={`${bookHref}${selected.length ? `?ids=${selected.join(",")}` : ""}`}
          className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-accent-2 to-accent px-5 text-[13px] font-medium text-white shadow-[0_2px_6px_rgb(124_92_240/0.3)] hover:brightness-110"
        >
          <Plus className="size-4" /> Add to Book
        </Link>
      </div>
      {note && <p className="mt-2 text-[12px] font-medium text-accent">{note}</p>}
      {selected.length > 0 && <p className="mt-2 text-[12px] text-ink-2">{selected.length} selected — choose a tool above, or “Add to Book” to start a book with them.</p>}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((a) => {
          const isSel = selected.includes(a.id);
          const who = a.uploadedBy ? contributors[a.uploadedBy] : a.contributorName;
          return (
            <div key={a.id}>
              <div className="relative">
                <button type="button" onClick={() => toggle(a.id)} className={cn("block aspect-[4/3] w-full overflow-hidden rounded-lg bg-sunken", isSel && "ring-2 ring-accent ring-offset-2")}>
                  <img src={a.thumbUrl} alt={a.caption ?? a.filename} loading="lazy" className="size-full object-cover" />
                </button>
                <span className={cn("pointer-events-none absolute top-2 left-2 grid size-[18px] place-items-center rounded-[4px] border-[1.5px]", isSel ? "border-accent bg-accent" : "border-white bg-white/70")} />
                {a.kind === "video" && (
                  <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10.5px] text-white">
                    <Play className="size-2.5 fill-current" /> Video
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-person-soft text-person">
                  <User className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11.5px] text-ink">
                    {a.contributorName ? "Submitted" : "Uploaded"} by {who?.split(" ")[0] ?? "family"}
                  </div>
                  <div className="text-[10.5px] text-muted">{formatTakenAt(a.takenAt, a.datePrecision === "unknown" ? "unknown" : "exact")}</div>
                </div>
                <span className="grid size-7 place-items-center rounded-md border border-line text-ink-2">
                  <MoreHorizontal className="size-3.5" />
                </span>
              </div>
            </div>
          );
        })}
        {!shown.length && <p className="col-span-full py-10 text-center text-[13px] text-muted">Nothing in this tab yet.</p>}
      </div>
      {dupes && <DuplicatesModal assets={assets} onClose={() => setDupes(false)} onSelect={(ids) => (setSelected(ids), setDupes(false))} />}
    </div>
  );
}
