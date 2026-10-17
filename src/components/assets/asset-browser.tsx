"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { BookOpen, Check, CheckCircle2, FileText, FolderPlus, LayoutGrid, List, Play, X } from "lucide-react";
import { createAlbumAction, createStoryAction } from "@/app/actions";
import { Button, Chip } from "@/components/ui";
import { useMeta } from "@/components/meta-context";
import { AssetDetailsForm, MarkReviewed, SaveIndicator, applyPatch, useAssetSaver } from "@/components/assets/asset-details";
import type { Asset, AssetPatch } from "@/lib/types";
import { cn, formatTakenAt, plural, STATUS_COPY } from "@/lib/utils";

export function StatusDot({ status, label }: { status: Asset["status"]; label?: boolean }) {
  const s = STATUS_COPY[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-2">
      <span className={cn("size-2 rounded-full ring-2 ring-white", s.dot)} />
      {label && s.label}
    </span>
  );
}

export function AssetThumb({ asset, className }: { asset: Asset; className?: string }) {
  if (asset.kind === "document")
    return (
      <div className={cn("grid place-items-center bg-sunken text-muted", className)}>
        <FileText className="size-8" strokeWidth={1.4} />
      </div>
    );
  return <img src={asset.thumbUrl} alt={asset.caption ?? asset.filename} loading="lazy" className={cn("object-cover", className)} />;
}

function AssetCard({
  asset,
  selected,
  focused,
  selecting,
  onToggle,
  onOpen,
}: {
  asset: Asset;
  selected: boolean;
  focused: boolean;
  selecting: boolean;
  onToggle: (shift: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={(e) => (selecting || e.metaKey || e.ctrlKey || e.shiftKey ? onToggle(e.shiftKey) : onOpen())}
        className={cn(
          "relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-sunken ring-offset-2 ring-offset-canvas transition",
          selected ? "ring-2 ring-accent" : focused ? "ring-2 ring-ink" : "hover:shadow-[var(--shadow-lift)]",
        )}
      >
        <AssetThumb asset={asset} className="size-full transition duration-300 group-hover:scale-[1.02]" />
        {selected && <span className="absolute inset-0 bg-accent/10" />}
        {asset.kind === "video" && (
          <span className="absolute right-2 bottom-2 grid size-6 place-items-center rounded-full bg-black/55 text-white">
            <Play className="size-3 fill-current" />
          </span>
        )}
        <span className="absolute right-2 top-2">
          <StatusDot status={asset.status} />
        </span>
      </button>
      <button
        type="button"
        aria-label={selected ? "Deselect" : "Select"}
        onClick={(e) => onToggle(e.shiftKey)}
        className={cn(
          "absolute top-2 left-2 grid size-[22px] place-items-center rounded-md border-2 transition",
          selected ? "border-accent bg-accent text-white" : "border-white/90 bg-black/15 text-transparent opacity-0 group-hover:opacity-100",
          selecting && "opacity-100",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>
      <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-ink-2">{asset.filename}</div>
          <div className="truncate text-[11px] text-muted">{formatTakenAt(asset.takenAt, asset.datePrecision)}</div>
        </div>
      </div>
    </div>
  );
}

function AssetRow({ asset, selected, onToggle, onOpen }: { asset: Asset; selected: boolean; onToggle: (shift: boolean) => void; onOpen: () => void }) {
  const meta = useMeta();
  return (
    <tr className={cn("border-b border-line last:border-0", selected && "bg-accent-soft/50")}>
      <td className="w-10 py-2 pl-3">
        <input type="checkbox" checked={selected} onChange={(e) => onToggle((e.nativeEvent as MouseEvent).shiftKey)} className="accent-[var(--color-accent)]" />
      </td>
      <td className="py-2">
        <button type="button" onClick={onOpen} className="flex items-center gap-3 text-left">
          <AssetThumb asset={asset} className="h-10 w-14 rounded-md" />
          <span className="text-[13px] font-medium">{asset.filename}</span>
        </button>
      </td>
      <td className="py-2 text-[12.5px] text-ink-2">{formatTakenAt(asset.takenAt, asset.datePrecision)}</td>
      <td className="hidden py-2 text-[12.5px] text-ink-2 md:table-cell">{meta.place(asset.placeId)?.name ?? <span className="text-faint">—</span>}</td>
      <td className="hidden py-2 text-[12.5px] text-ink-2 lg:table-cell">{asset.people.length || <span className="text-faint">—</span>}</td>
      <td className="py-2 pr-3">
        <StatusDot status={asset.status} label />
      </td>
    </tr>
  );
}

/**
 * Grid/list of assets with multi-select, a batch action bar, and a right-side
 * inspector. Used by album view, the project archive, and uploads.
 */
export function AssetBrowser({
  assets: initial,
  toolbar,
  empty,
  albumId,
}: {
  assets: Asset[];
  toolbar?: ReactNode;
  empty?: ReactNode;
  albumId?: string;
}) {
  const meta = useMeta();
  const [assets, setAssets] = useState(initial);
  // Re-sync when the server sends a fresh list (after refresh()).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setAssets(initial);
  }
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const { save, pending, savedAt } = useAssetSaver((ids, patch: AssetPatch) =>
    setAssets((xs) => xs.map((a) => (ids.includes(a.id) ? applyPatch(a, patch) : a))),
  );

  const selectedAssets = useMemo(() => assets.filter((a) => selected.includes(a.id)), [assets, selected]);
  const focused = assets.find((a) => a.id === focusId);
  const inspecting = selectedAssets.length ? selectedAssets : focused ? [focused] : [];

  function toggle(id: string, shift: boolean) {
    if (shift && anchor) {
      const ids = assets.map((a) => a.id);
      const [from, to] = [ids.indexOf(anchor), ids.indexOf(id)].sort((a, b) => a - b);
      setSelected((s) => [...new Set([...s, ...ids.slice(from, to + 1)])]);
    } else {
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    }
    setAnchor(id);
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected([]);
        setFocusId(null);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  if (!assets.length && empty) return <>{empty}</>;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="flex h-8 items-center gap-2 rounded-lg px-2 text-[12.5px] text-ink-2 hover:bg-sunken">
            <input
              type="checkbox"
              className="accent-[var(--color-accent)]"
              checked={selected.length === assets.length && assets.length > 0}
              onChange={(e) => setSelected(e.target.checked ? assets.map((a) => a.id) : [])}
            />
            Select all ({assets.length})
          </label>
          {toolbar}
          <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium capitalize", view === v ? "bg-ink text-white" : "text-muted hover:text-ink")}
              >
                {v === "grid" ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />} {v}
              </button>
            ))}
          </div>
        </div>

        {view === "grid" ? (
          <div className={cn("grid gap-x-4 gap-y-5", inspecting.length ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
            {assets.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                selected={selected.includes(a.id)}
                focused={focusId === a.id && !selected.length}
                selecting={selected.length > 0}
                onToggle={(shift) => toggle(a.id, shift)}
                onOpen={() => setFocusId(a.id)}
              />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-line bg-sunken/50 text-left text-[11.5px] font-medium text-muted">
                <tr>
                  <th className="py-2 pl-3" />
                  <th className="py-2">File</th>
                  <th className="py-2">Date</th>
                  <th className="hidden py-2 md:table-cell">Place</th>
                  <th className="hidden py-2 lg:table-cell">People</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <AssetRow key={a.id} asset={a} selected={selected.includes(a.id)} onToggle={(s) => toggle(a.id, s)} onOpen={() => setFocusId(a.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* room for the floating batch bar */}
        {selected.length > 0 && <div className="h-24" />}
      </div>

      {inspecting.length > 0 && (
        <aside className="animate-drawer fixed inset-x-0 bottom-0 z-40 max-h-[75vh] overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-[var(--shadow-pop)] lg:sticky lg:top-[84px] lg:z-auto lg:max-h-[calc(100vh-108px)] lg:w-[340px] lg:shrink-0 lg:self-start lg:rounded-[var(--radius-card)] lg:shadow-[var(--shadow-soft)] scroll-thin">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold">{inspecting.length > 1 ? `Apply to ${inspecting.length} selected` : "Photo details"}</h3>
              <SaveIndicator pending={pending} savedAt={savedAt} />
            </div>
            <button
              type="button"
              aria-label="Close details"
              onClick={() => (setSelected([]), setFocusId(null))}
              className="grid size-7 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
          {inspecting.length === 1 ? (
            <div className="mb-5 overflow-hidden rounded-xl bg-sunken">
              <AssetThumb asset={inspecting[0]} className="aspect-[4/3] w-full" />
            </div>
          ) : (
            <div className="mb-5 flex -space-x-3">
              {inspecting.slice(0, 6).map((a) => (
                <AssetThumb key={a.id} asset={a} className="size-12 rounded-lg ring-2 ring-surface" />
              ))}
              {inspecting.length > 6 && (
                <span className="grid size-12 place-items-center rounded-lg bg-sunken text-[12px] font-semibold ring-2 ring-surface">+{inspecting.length - 6}</span>
              )}
            </div>
          )}
          <AssetDetailsForm assets={inspecting} save={save} />
          <div className="mt-6 border-t border-line pt-4">
            <MarkReviewed assets={inspecting} save={save} />
            {inspecting.length === 1 && inspecting[0].contributorName && (
              <p className="mt-3 text-center text-[11.5px] text-muted">Shared by {inspecting[0].contributorName}</p>
            )}
          </div>
        </aside>
      )}

      {selected.length > 0 && (
        <BatchBar
          projectId={meta.projectId}
          albumId={albumId}
          selected={selectedAssets}
          onClear={() => setSelected([])}
          onReviewed={() => save(selected, { status: "reviewed" })}
          onRemoveFromAlbum={albumId ? () => (save(selected, { removeAlbumIds: [albumId] }), setSelected([])) : undefined}
        />
      )}
    </div>
  );
}

function BatchBar({
  projectId,
  albumId,
  selected,
  onClear,
  onReviewed,
  onRemoveFromAlbum,
}: {
  projectId: string;
  albumId?: string;
  selected: Asset[];
  onClear: () => void;
  onReviewed: () => void;
  onRemoveFromAlbum?: () => void;
}) {
  const meta = useMeta();
  const [naming, setNaming] = useState(false);
  const [pending, start] = useTransition();
  const album = albumId ? meta.album(albumId) : undefined;
  const ids = selected.map((a) => a.id);

  return (
    <div className="animate-rise fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-line bg-surface p-1.5 pl-4 shadow-[var(--shadow-pop)]">
      <Chip kind="accent" className="mr-1">
        {plural(selected.length, "item")} selected
      </Chip>
      {naming ? (
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
            if (!name) return;
            start(async () => {
              const al = await createAlbumAction(projectId, name, ids);
              meta.add("albums", al);
              setNaming(false);
              onClear();
            });
          }}
        >
          <input name="name" autoFocus placeholder="Album name, e.g. Lake trips" className="field h-8 w-52" />
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Creating…" : "Create album"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={() => setNaming(true)}>
            <FolderPlus className="size-4" /> <span className="hidden sm:inline">New album from selection</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={onReviewed}>
            <CheckCircle2 className="size-4" /> <span className="hidden sm:inline">Mark reviewed</span>
          </Button>
          {onRemoveFromAlbum && album?.kind === "manual" && (
            <Button size="sm" variant="ghost" onClick={onRemoveFromAlbum}>
              <X className="size-4" /> <span className="hidden md:inline">Remove from album</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:inline-flex"
            disabled={pending}
            onClick={() => start(() => createStoryAction({ projectId, albumId, title: album ? `${album.name} book` : "New story", assetIds: ids }))}
          >
            <BookOpen className="size-4" /> Make a story
          </Button>
          <span className="mx-1 h-5 w-px bg-line" />
          <Button size="sm" variant="ghost" onClick={onClear} aria-label="Clear selection">
            <X className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}
