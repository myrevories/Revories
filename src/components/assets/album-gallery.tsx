"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Heart, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { useMeta } from "@/components/meta-context";
import type { Asset } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";
import { BatchBar, Lightbox, Tile, useLocalAssets } from "./gallery";

type Tab = "all" | "photo" | "video" | "document" | "audio" | "favorites" | "needs";

/** Tabs with counts, select / sort / filter toolbar and the photo grid from the album concept. */
export function AlbumGallery({ initial, albumId }: { initial: Asset[]; albumId?: string }) {
  const meta = useMeta();
  const { assets, save } = useLocalAssets(initial);
  const [tab, setTab] = useState<Tab>("all");
  const [newest, setNewest] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [place, setPlace] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const test = (a: Asset, t: Tab) =>
    t === "all" ? true : t === "favorites" ? !!a.favorite : t === "needs" ? a.status === "needs_details" || !a.takenAt : a.kind === t;
  const count = (t: Tab) => assets.filter((a) => test(a, t)).length;
  const shown = useMemo(
    () =>
      assets
        .filter((a) => test(a, tab) && (!person || a.people.some((p) => p.personId === person)) && (!place || a.placeId === place))
        .sort((a, b) => ((a.takenAt ?? "") < (b.takenAt ?? "") ? 1 : -1) * (newest ? 1 : -1)),
    [assets, tab, newest, person, place],
  );
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const tabs: [Tab, ReactLabel][] = [
    ["all", "All"],
    ["photo", "Photos"],
    ["video", "Videos"],
    ["document", "Documents"],
    ["audio", "Audio"],
    ["favorites", <span key="f" className="flex items-center gap-1.5"><Heart className="size-4" /> Favorites</span>],
    ["needs", "Needs Details"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/80 bg-white/45 p-1.5">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("flex h-9 items-center gap-2 rounded-full px-4 text-[13px] transition", tab === k ? "bg-accent-soft font-medium text-accent" : "text-ink hover:bg-white/60")}>
            {label}
            <span className={cn("rounded-full px-1.5 text-[11px]", tab === k ? "bg-white/70 text-accent" : "text-muted")}>{count(k)}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-full border border-white/80 bg-white/45 p-1.5">
        <button
          type="button"
          onClick={() => (setSelecting((s) => !s), setSelected([]))}
          className={cn("flex h-10 items-center gap-2.5 rounded-full px-4 text-[13.5px]", selecting ? "bg-accent-soft text-accent" : "bg-white/70 text-ink")}
        >
          <span className={cn("grid size-[18px] place-items-center rounded-[4px] border-[1.5px]", selecting ? "border-accent" : "border-ink/40")} /> {selecting ? "Cancel" : "Select"}
        </button>
        <label className="relative flex h-10 items-center rounded-full bg-white/70 pr-2 pl-4 text-[13.5px] text-ink">
          <select value={newest ? "new" : "old"} onChange={(e) => setNewest(e.target.value === "new")} className="appearance-none bg-transparent pr-6 outline-none">
            <option value="new">Sort by: Date (newest)</option>
            <option value="old">Sort by: Date (oldest)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 size-4" />
        </label>
        <div className="relative">
          <button type="button" onClick={() => setFilterOpen((o) => !o)} className={cn("flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px]", person || place ? "bg-accent-soft text-accent" : "bg-white/70 text-ink")}>
            <SlidersHorizontal className="size-4" /> Filter
          </button>
          {filterOpen && (
            <div className="glass-strong animate-rise absolute top-full left-0 z-30 mt-2 w-64 space-y-3 p-4">
              <label className="block text-[12px] text-ink-2">
                Person
                <select value={person} onChange={(e) => setPerson(e.target.value)} className="field mt-1">
                  <option value="">Everyone</option>
                  {meta.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] text-ink-2">
                Place
                <select value={place} onChange={(e) => setPlace(e.target.value)} className="field mt-1">
                  <option value="">Anywhere</option>
                  {meta.places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {(person || place) && (
                <button type="button" onClick={() => (setPerson(""), setPlace(""))} className="flex items-center gap-1 text-[12px] text-accent">
                  <X className="size-3.5" /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
        <div className="ml-auto flex rounded-full p-0.5">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} type="button" aria-label={`${v} view`} onClick={() => setView(v)} className={cn("grid size-10 place-items-center rounded-full", view === v ? "bg-white text-ink shadow-sm" : "text-ink-2")}>
              {v === "grid" ? <LayoutGrid className="size-[18px]" /> : <List className="size-[18px]" />}
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {shown.map((a, i) => (
            <Tile
              key={a.id}
              asset={a}
              selected={selected.includes(a.id)}
              selecting={selecting || selected.length > 0}
              onSelect={() => toggle(a.id)}
              onOpen={() => setOpen(i)}
              onFavorite={() => save([a.id], { favorite: !a.favorite })}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-ink/5 rounded-2xl bg-white/60">
          {shown.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3 p-2">
              <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} className="ml-2 accent-[var(--color-accent)]" />
              <button type="button" onClick={() => setOpen(i)} className="flex flex-1 items-center gap-3 text-left">
                <img src={a.thumbUrl} alt="" className="h-11 w-14 rounded-md object-cover" />
                <span className="flex-1 text-[13px] text-ink">{a.filename}</span>
                <span className="w-32 text-[12px] text-ink-2">{formatTakenAt(a.takenAt, a.datePrecision)}</span>
                <span className="hidden w-32 text-[12px] text-ink-2 md:block">{meta.place(a.placeId)?.name ?? "—"}</span>
              </button>
              <button type="button" aria-label="Favorite" onClick={() => save([a.id], { favorite: !a.favorite })} className="mr-2">
                <Heart className={cn("size-4", a.favorite ? "fill-accent text-accent" : "text-ink-2")} />
              </button>
            </div>
          ))}
        </div>
      )}
      {!shown.length && <p className="mt-6 rounded-2xl bg-white/50 p-10 text-center text-[13.5px] text-ink-2">Nothing here yet.</p>}

      <BatchBar selected={selected} assets={assets} save={save} onClear={() => (setSelected([]), setSelecting(false))} fromAlbumId={albumId} />
      {open !== null && <Lightbox assets={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} save={save} />}
    </div>
  );
}

type ReactLabel = React.ReactNode;
