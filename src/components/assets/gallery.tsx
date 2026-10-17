"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, FileText, FolderInput, GripVertical, Heart, Image as ImageIcon, MapPin, Play, RotateCw, Trash2, UserRound, X } from "lucide-react";
import { trashAssetsAction } from "@/app/actions";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import { Combobox } from "@/components/pickers";
import { AssetDetailsForm, applyPatch, useAssetSaver } from "@/components/assets/asset-details";
import { Avatar } from "@/components/ui";
import type { Asset, AssetPatch } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";

export function fmtDuration(sec?: number) {
  return sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : "";
}

export function rotationStyle(a: Asset) {
  return a.rotation ? { transform: `rotate(${a.rotation}deg)` } : undefined;
}

/** A single gallery tile: favorite heart, select box, type badge, duration or date. */
export function Tile({
  asset,
  selected,
  selecting,
  onSelect,
  onOpen,
  onFavorite,
  variant = "album",
  footer,
}: {
  asset: Asset;
  selected: boolean;
  selecting: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onFavorite?: () => void;
  variant?: "album" | "upload";
  footer?: ReactNode;
}) {
  const KindIcon = asset.kind === "video" ? Play : asset.kind === "document" ? FileText : ImageIcon;
  return (
    <div className={cn("group relative overflow-hidden rounded-[10px] bg-sunken shadow-sm transition", selected && "ring-[3px] ring-accent/70", variant === "upload" ? "aspect-[4/3.2]" : "aspect-[4/3.3]")}>
      <button type="button" onClick={selecting ? onSelect : onOpen} className="absolute inset-0">
        {asset.kind === "document" ? (
          <span className="grid size-full place-items-center bg-[#f3eee6] font-script text-[22px] text-ink-2">{asset.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")}</span>
        ) : (
          <img src={asset.thumbUrl} alt={asset.caption ?? asset.filename} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" style={rotationStyle(asset)} />
        )}
      </button>
      {variant === "album" && onFavorite && (
        <button type="button" aria-label={asset.favorite ? "Unfavorite" : "Favorite"} onClick={onFavorite} className="absolute top-2 right-2 grid size-7 place-items-center rounded-full">
          <Heart className={cn("size-[22px] drop-shadow", asset.favorite ? "fill-accent text-white" : "text-white")} strokeWidth={1.8} />
        </button>
      )}
      <button
        type="button"
        aria-label={selected ? "Deselect" : "Select"}
        onClick={onSelect}
        className={cn(
          "absolute top-2 left-2 grid size-6 place-items-center transition",
          variant === "upload" ? "rounded-full border-2" : "rounded-md border-2",
          selected ? "border-accent bg-accent text-white" : "border-white/90 bg-black/10 text-transparent",
          !selected && !selecting && variant === "album" && "opacity-0 group-hover:opacity-100",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/45 to-transparent px-2.5 pt-6 pb-2 text-[11px] text-white">
        <KindIcon className={cn("size-[17px]", asset.kind === "video" && "fill-current")} strokeWidth={1.8} />
        {variant === "upload" && <span>{asset.takenAt ? new Date(asset.takenAt + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "No date"}</span>}
        {asset.kind === "video" && variant === "album" && <span className="ml-auto flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5">▶ {fmtDuration(asset.durationSec)}</span>}
        {variant === "upload" && <GripVertical className="ml-auto size-4 opacity-80" />}
      </span>
      {footer}
    </div>
  );
}

function BarButton({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-10 items-center gap-2 rounded-full px-4 text-[12.5px] transition [&>svg]:size-4 [&>svg]:stroke-[1.6]", danger ? "text-danger hover:bg-danger-soft" : "bg-white/70 text-ink hover:bg-white")}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * "3 items selected | Add to Album | Tag People | Add Location | Rotate |
 * Delete | Move to Album →" — the batch bar from the Upload & Review concept.
 */
export function BatchBar({
  selected,
  assets,
  save,
  onClear,
  fromAlbumId,
}: {
  selected: string[];
  assets: Asset[];
  save: (ids: string[], patch: AssetPatch) => void;
  onClear: () => void;
  fromAlbumId?: string;
}) {
  const meta = useMeta();
  const [, start] = useTransition();
  const [move, setMove] = useState<"add" | "move" | null>(null);
  const albums = meta.albums.filter((a) => a.kind === "manual" && a.id !== fromAlbumId);
  const peopleOpts = meta.people.map((p) => ({ id: p.id, label: p.name, hint: p.branch, icon: <Avatar name={p.name} src={p.avatarUrl} size={24} /> }));
  const placeOpts = meta.places.map((p) => ({ id: p.id, label: p.name, hint: p.address, icon: <MapPin className="size-4 text-accent" /> }));
  if (!selected.length) return null;
  const n = selected.length;

  return (
    <div className="glass animate-rise sticky bottom-4 z-30 mt-4 flex flex-wrap items-center gap-2 p-3 pl-6">
      <span className="mr-2 text-[14px] text-ink">
        {n} item{n > 1 ? "s" : ""} selected
      </span>
      <BarButton icon={<ImageIcon />} onClick={() => setMove("add")}>
        Add to Album
      </BarButton>
      <Combobox
        multi
        placeholder="Tag someone…"
        options={peopleOpts}
        selected={[]}
        onSelect={(id) => save(selected, { addPersonIds: [id] })}
        trigger={(open) => (
          <BarButton icon={<UserRound />} onClick={open}>
            Tag People
          </BarButton>
        )}
      />
      <Combobox
        placeholder="Where was this?"
        options={placeOpts}
        selected={[]}
        onSelect={(id) => save(selected, { placeId: id })}
        trigger={(open) => (
          <BarButton icon={<MapPin />} onClick={open}>
            Add Location
          </BarButton>
        )}
      />
      <BarButton
        icon={<RotateCw />}
        onClick={() => {
          for (const id of selected) {
            const a = assets.find((x) => x.id === id);
            save([id], { rotation: (((a?.rotation ?? 0) + 90) % 360) as Asset["rotation"] });
          }
        }}
      >
        Rotate
      </BarButton>
      <BarButton danger icon={<Trash2 />} onClick={() => start(async () => (await trashAssetsAction(selected), onClear()))}>
        Delete
      </BarButton>
      <span className="ml-auto flex items-center gap-2">
        <button type="button" onClick={() => setMove("move")} className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[13.5px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-black">
          Move to Album <ArrowRight className="size-4" />
        </button>
        <button type="button" aria-label="Clear selection" onClick={onClear} className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-white/70">
          <X className="size-4" />
        </button>
      </span>
      {move && (
        <Modal title={move === "move" ? "Move to album" : "Add to album"} description={move === "move" ? "They’ll leave their current album but stay in the project." : "Photos can live in several albums."} onClose={() => setMove(null)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {albums.map((al) => (
              <button
                key={al.id}
                type="button"
                onClick={() => {
                  save(selected, { addAlbumIds: [al.id], removeAlbumIds: move === "move" && fromAlbumId ? [fromAlbumId] : undefined });
                  setMove(null);
                  if (move === "move") onClear();
                }}
                className="flex items-center gap-3 rounded-xl border border-line p-3 text-left text-[13px] text-ink hover:border-accent-line hover:bg-accent-soft/40"
              >
                <FolderInput className="size-4 text-accent" /> {al.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Full-size viewer with prev/next and the shared details form. */
export function Lightbox({ assets, index, onIndex, onClose, save }: { assets: Asset[]; index: number; onIndex: (i: number) => void; onClose: () => void; save: (ids: string[], p: AssetPatch) => void }) {
  const a = assets[index];
  if (!a) return null;
  return (
    <Modal title={a.filename} description={formatTakenAt(a.takenAt, a.datePrecision)} onClose={onClose} width="max-w-6xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="relative grid min-h-[380px] place-items-center overflow-hidden rounded-xl bg-sunken">
          {a.kind === "document" ? <FileText className="size-16 text-muted" /> : <img src={a.url} alt={a.caption ?? ""} className="max-h-[70vh] w-auto object-contain" style={rotationStyle(a)} />}
          <button type="button" aria-label="Previous" disabled={index === 0} onClick={() => onIndex(index - 1)} className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow disabled:opacity-30">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Next" disabled={index >= assets.length - 1} onClick={() => onIndex(index + 1)} className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow disabled:opacity-30">
            <ChevronRight className="size-5" />
          </button>
          <button type="button" aria-label="Favorite" onClick={() => save([a.id], { favorite: !a.favorite })} className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/85 shadow">
            <Heart className={cn("size-5", a.favorite ? "fill-accent text-accent" : "text-ink")} />
          </button>
        </div>
        <AssetDetailsForm assets={[a]} save={save} />
      </div>
    </Modal>
  );
}

/** Local optimistic asset list + saver, shared by gallery pages. */
export function useLocalAssets(initial: Asset[]) {
  const [assets, setAssets] = useState(initial);
  const [prev, setPrev] = useState(initial);
  if (prev !== initial) {
    setPrev(initial);
    setAssets(initial);
  }
  const saver = useAssetSaver((ids, patch) => setAssets((xs) => xs.map((a) => (ids.includes(a.id) ? applyPatch(a, patch) : a))));
  return { assets, setAssets, ...saver };
}

