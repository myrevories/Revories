"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Crop,
  ExternalLink,
  Folder,
  Info,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  ScanFace,
  Smartphone,
  Tag,
  UserRound,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import { DateInput, PeoplePicker, PlacePicker, TagPicker } from "@/components/pickers";
import { UploadDrawer } from "@/components/upload/upload-drawer";
import { MiniMap } from "@/components/places/mini-map";
import { Avatar } from "@/components/ui";
import type { Asset } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";
import { BatchBar, Tile, rotationStyle, useLocalAssets } from "@/components/assets/gallery";

type Filter = "all" | "review" | "album" | "people" | "location" | "duplicates";

const SOURCES: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: "google",
    label: "Google Photos",
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <path d="M12 2.5v9.5H7.2A4.8 4.8 0 0 1 12 2.5z" fill="#f4b400" />
        <path d="M21.5 12H12V7.2A4.8 4.8 0 0 1 21.5 12z" fill="#db4437" />
        <path d="M12 21.5V12h4.8A4.8 4.8 0 0 1 12 21.5z" fill="#4285f4" />
        <path d="M2.5 12H12v4.8A4.8 4.8 0 0 1 2.5 12z" fill="#0f9d58" />
      </svg>
    ),
  },
  { id: "phone", label: "iPhone", icon: <Smartphone className="size-7 stroke-[1.5]" /> },
  {
    id: "dropbox",
    label: "Dropbox",
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden fill="#0061ff">
        <path d="M7 3 2 6.3l5 3.2 5-3.2L7 3zm10 0-5 3.3 5 3.2 5-3.2L17 3zM2 12.7 7 16l5-3.3-5-3.2-5 3.2zm15-3.2-5 3.2 5 3.3 5-3.3-5-3.2zM7 17.1l5 3.3 5-3.3-5-3.2-5 3.2z" />
      </svg>
    ),
  },
  {
    id: "onedrive",
    label: "OneDrive",
    icon: (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
        <path d="M10 8.5a5 5 0 0 1 9.3 1.6A3.8 3.8 0 0 1 18.6 17H7.4A4.4 4.4 0 0 1 10 8.5z" fill="#0364b8" />
        <path d="M6.5 10.2A4.5 4.5 0 0 1 10 8.5a5 5 0 0 1 3 1l-6 7.5H5.8A3.4 3.4 0 0 1 6.5 10.2z" fill="#28a8ea" />
      </svg>
    ),
  },
  { id: "more", label: "More", icon: <MoreHorizontal className="size-7" /> },
];

function dupKey(a: Asset) {
  return a.filename.toLowerCase();
}

/** Upload & Review: bring memories in, then sort them with filters, batch actions and the inspector. */
export function UploadReview({ initial, projectName, initialFilter, initialAlbumId, initialFocus }: { initial: Asset[]; projectName: string; initialFilter?: Filter; initialAlbumId?: string; initialFocus?: string }) {
  const meta = useMeta();
  const { assets, save } = useLocalAssets(initial);
  const [filter, setFilter] = useState<Filter>(initialFilter ?? "all");
  const [albumFilter] = useState(initialAlbumId);
  const [newest, setNewest] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [focusId, setFocusId] = useState(initialFocus);
  const [files, setFiles] = useState<File[] | null>(null);
  const [over, setOver] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const inbox = meta.albums.find((a) => a.kind === "inbox")?.id;
  const dupes = useMemo(() => {
    const c = new Map<string, number>();
    assets.forEach((a) => c.set(dupKey(a), (c.get(dupKey(a)) ?? 0) + 1));
    return c;
  }, [assets]);
  const test = (a: Asset, f: Filter) =>
    f === "all"
      ? true
      : f === "review"
        ? a.status === "needs_details"
        : f === "album"
          ? a.albumIds.every((id) => id === inbox)
          : f === "people"
            ? a.kind === "photo" && !a.people.length
            : f === "location"
              ? !a.placeId
              : (dupes.get(dupKey(a)) ?? 0) > 1;
  const base = albumFilter ? assets.filter((a) => a.albumIds.includes(albumFilter)) : assets;
  const shown = base.filter((a) => test(a, filter)).sort((a, b) => (newest ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  const focus = assets.find((a) => a.id === focusId) ?? shown[0];
  const fi = shown.findIndex((a) => a.id === focus?.id);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const pills: [Filter, string, number][] = [
    ["all", "All Uploads", base.length],
    ["review", "Needs Review", base.filter((a) => test(a, "review")).length],
    ["album", "Add to Album", base.filter((a) => test(a, "album")).length],
    ["people", "Add People", base.filter((a) => test(a, "people")).length],
    ["location", "Add Location", base.filter((a) => test(a, "location")).length],
    ["duplicates", "Duplicates", base.filter((a) => test(a, "duplicates")).length],
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="glass min-w-0 p-6">
        <p className="eyebrow-wide">Add to {projectName.replace(/ Archive$/, "")}</p>
        <h1 className="mt-3 font-display text-[48px] leading-none text-ink">Upload &amp; Review</h1>
        <p className="mt-3 text-[14.5px] text-ink-2">Bring your memories together. Add photos, videos, documents, and more. Review, organize, and decide where they belong.</p>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer.files.length) setFiles([...e.dataTransfer.files]);
            }}
            className={cn("flex items-center gap-6 rounded-[18px] border-2 border-dashed p-6 transition", over ? "border-accent bg-accent-soft/50" : "border-white/90 bg-white/35")}
          >
            <CloudUpload className="size-14 shrink-0 stroke-[1.2] text-ink" />
            <div>
              <div className="text-[15px] text-ink">Drag and drop photos, videos, or files here</div>
              <div className="text-[12.5px] text-muted">or choose files from your device</div>
              <button type="button" onClick={() => input.current?.click()} className="mt-3 h-11 rounded-full bg-ink px-8 text-[13.5px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-black">
                Browse Files
              </button>
            </div>
            <input ref={input} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => (e.target.files?.length && setFiles([...e.target.files]), (e.target.value = ""))} />
          </div>
          <div className="flex items-center justify-around gap-2 rounded-[18px] bg-white/45 p-4">
            {SOURCES.map((s) => (
              <button key={s.id} type="button" onClick={() => setSource(s.id)} className="flex flex-col items-center gap-2 text-[12px] text-ink">
                <span className="grid size-[60px] place-items-center rounded-2xl bg-white shadow-[0_4px_14px_rgb(70_55_40/0.08)] transition hover:-translate-y-0.5">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {pills.map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn("flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[12px] transition", filter === k ? "bg-ink text-white" : "bg-white/60 text-ink hover:bg-white")}
            >
              {label}
              <span className={cn("rounded-full px-1.5 text-[11px]", filter === k ? "bg-white/20" : k === "review" ? "bg-branch-soft text-branch" : "bg-ink/5 text-ink-2")}>{n}</span>
            </button>
          ))}
          <label className="relative ml-auto flex h-10 items-center rounded-full bg-white/60 pr-2 pl-4 text-[12.5px]">
            <select value={newest ? "new" : "old"} onChange={(e) => setNewest(e.target.value === "new")} className="appearance-none bg-transparent pr-6 outline-none">
              <option value="new">Newest First</option>
              <option value="old">Oldest First</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5" />
          </label>
          <div className="flex rounded-full bg-white/60 p-0.5">
            {(["grid", "list"] as const).map((v) => (
              <button key={v} type="button" aria-label={`${v} view`} onClick={() => setView(v)} className={cn("grid size-9 place-items-center rounded-full", view === v ? "bg-white text-ink shadow-sm" : "text-ink-2")}>
                {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>

        {view === "grid" ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
            {shown.map((a) => (
              <div key={a.id} className={cn("rounded-[12px]", focus?.id === a.id && "ring-2 ring-white ring-offset-2 ring-offset-accent/40")}>
                <Tile asset={a} variant="upload" selected={selected.includes(a.id)} selecting={selected.length > 0} onSelect={() => toggle(a.id)} onOpen={() => setFocusId(a.id)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 divide-y divide-ink/5 rounded-2xl bg-white/60">
            {shown.map((a) => (
              <div key={a.id} className={cn("flex items-center gap-3 p-2", focus?.id === a.id && "bg-accent-soft/50")}>
                <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} className="ml-2 accent-[var(--color-accent)]" />
                <button type="button" onClick={() => setFocusId(a.id)} className="flex flex-1 items-center gap-3 text-left text-[12.5px]">
                  <img src={a.thumbUrl} alt="" className="h-10 w-14 rounded-md object-cover" />
                  <span className="flex-1 text-ink">{a.filename}</span>
                  <span className="w-28 text-ink-2">{formatTakenAt(a.takenAt, a.datePrecision)}</span>
                  <span className="hidden w-32 text-ink-2 md:block">{meta.place(a.placeId)?.name ?? "No location"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
        {!shown.length && <p className="mt-6 rounded-2xl bg-white/50 p-10 text-center text-[13.5px] text-ink-2">Nothing here — everything in this view is sorted. 🎉</p>}

        <BatchBar selected={selected} assets={assets} save={save} onClear={() => setSelected([])} fromAlbumId={inbox} />
      </section>

      {focus && <Inspector asset={focus} index={fi} total={shown.length} onPrev={() => fi > 0 && setFocusId(shown[fi - 1].id)} onNext={() => fi < shown.length - 1 && setFocusId(shown[fi + 1].id)} save={save} />}

      {files && <UploadDrawer initialFiles={files} onClose={() => setFiles(null)} />}
      {source && (
        <Modal title={source === "phone" ? "Add from your phone" : `Import from ${SOURCES.find((s) => s.id === source)?.label}`} onClose={() => setSource(null)}>
          {source === "phone" ? (
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Open Revories on your phone and tap <span className="font-medium text-ink">Add memories</span> — you can pick photos straight from your camera roll. Relatives without an account can use an upload link from{" "}
              <Link href={`/projects/${meta.projectId}/settings/sharing`} className="text-accent underline">
                Sharing
              </Link>
              .
            </p>
          ) : (
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Direct import from cloud services is coming soon. For now, download the photos to your computer and drop them into the box on this page — dates and file names come along with them.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

type EditKey = "date" | "place" | "people" | "album" | "tags" | null;

function Inspector({ asset, index, total, onPrev, onNext, save }: { asset: Asset; index: number; total: number; onPrev: () => void; onNext: () => void; save: (ids: string[], p: Parameters<ReturnType<typeof useLocalAssets>["save"]>[1]) => void }) {
  const meta = useMeta();
  const [editing, setEditing] = useState<EditKey>(null);
  const [tab, setTab] = useState<"info" | "tags" | "place" | "crop">("info");
  const place = meta.place(asset.placeId);
  const album = meta.albums.find((a) => asset.albumIds.includes(a.id) && a.kind !== "inbox") ?? meta.albums.find((a) => asset.albumIds.includes(a.id));
  const ids = [asset.id];
  const row = (k: Exclude<EditKey, null>, icon: React.ReactNode, body: React.ReactNode, editor: React.ReactNode) => (
    <div className="border-b border-ink/5 py-3">
      <div className="flex items-center gap-3 text-[13px] text-ink [&>svg:first-child]:size-[18px] [&>svg:first-child]:shrink-0 [&>svg:first-child]:stroke-[1.5]">
        {icon}
        <div className="min-w-0 flex-1">{body}</div>
        <button type="button" onClick={() => setEditing(editing === k ? null : k)} className="text-[12px] text-accent underline-offset-2 hover:underline">
          {editing === k ? "Done" : "Edit"}
        </button>
      </div>
      {editing === k && <div className="mt-3">{editor}</div>}
    </div>
  );

  return (
    <aside className="glass h-fit p-4 xl:sticky xl:top-4">
      <div className="flex items-center justify-between px-1">
        {(
          [
            ["info", <Info key="i" />],
            ["tags", <Tag key="t" />],
            ["place", <MapPin key="p" />],
            ["crop", <Crop key="c" />],
          ] as const
        ).map(([k, icon]) => (
          <button key={k} type="button" aria-label={k} onClick={() => setTab(k)} className={cn("grid size-10 place-items-center rounded-full [&>svg]:size-[19px] [&>svg]:stroke-[1.6]", tab === k ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:bg-white/60")}>
            {icon}
          </button>
        ))}
        <Link href={`/projects/${meta.projectId}/uploads/review?focus=${asset.id}`} aria-label="Tag faces" title="Tag faces one by one" className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-white/60">
          <ScanFace className="size-[19px] stroke-[1.6]" />
        </Link>
      </div>

      <div className="relative mt-3 aspect-[4/3.6] overflow-hidden rounded-xl bg-sunken">
        <img src={asset.url} alt={asset.caption ?? asset.filename} className="size-full object-cover" style={rotationStyle(asset)} />
        <button type="button" aria-label="Previous" disabled={index <= 0} onClick={onPrev} className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink backdrop-blur disabled:opacity-30">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" aria-label="Next" disabled={index >= total - 1} onClick={onNext} className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-ink backdrop-blur disabled:opacity-30">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <input
        key={asset.id}
        defaultValue={asset.caption}
        placeholder="Add a caption…"
        onBlur={(e) => e.target.value.trim() !== (asset.caption ?? "") && save(ids, { caption: e.target.value.trim() || null })}
        className="mt-3 h-12 w-full rounded-xl border border-white/80 bg-white/60 px-4 text-[13px] text-ink outline-none placeholder:text-muted focus:bg-white"
      />

      {tab === "crop" ? (
        <div className="mt-4 space-y-2">
          <p className="text-[12px] text-ink-2">Straighten a sideways scan.</p>
          <button type="button" onClick={() => save(ids, { rotation: (((asset.rotation ?? 0) + 90) % 360) as Asset["rotation"] })} className="h-10 w-full rounded-full bg-white/80 text-[13px] text-ink hover:bg-white">
            Rotate 90°
          </button>
        </div>
      ) : tab === "tags" ? (
        <div className="mt-4">
          <TagPicker value={asset.tagIds} onAdd={(id) => save(ids, { addTagIds: [id] })} onRemove={(id) => save(ids, { removeTagIds: [id] })} />
        </div>
      ) : (
        <div className="mt-2">
          {tab === "info" &&
            row(
              "date",
              <Calendar />,
              <span>{formatTakenAt(asset.takenAt, asset.datePrecision)}</span>,
              <DateInput value={asset.takenAt} precision={asset.datePrecision} onChange={(d, p) => save(ids, { takenAt: d, datePrecision: p })} />,
            )}
          {row("place", <MapPin />, <span>{place ? place.address ?? place.name : <span className="text-muted">Add a location</span>}</span>, <PlacePicker value={asset.placeId} onChange={(id) => save(ids, { placeId: id })} />)}
          {tab === "info" &&
            row(
              "people",
              <UserRound />,
              <span className="flex items-center -space-x-1.5">
                {asset.people.slice(0, 4).map((p) => {
                  const person = meta.person(p.personId);
                  return person ? <Avatar key={p.personId} name={person.name} src={person.avatarUrl} size={28} ring /> : null;
                })}
                {!asset.people.length && <span className="text-muted">Tag people</span>}
                <Plus className="ml-3 size-4 text-ink" />
              </span>,
              <PeoplePicker value={asset.people.map((p) => p.personId)} onAdd={(id) => save(ids, { addPersonIds: [id] })} onRemove={(id) => save(ids, { removePersonIds: [id] })} />,
            )}
          {tab === "info" &&
            row(
              "album",
              <Folder />,
              <span className="truncate">{album ? (album.kind === "inbox" ? "Inbox" : `${album.name}`) : "No album"}</span>,
              <select
                className="field"
                value=""
                onChange={(e) => e.target.value && save(ids, { addAlbumIds: [e.target.value], removeAlbumIds: meta.albums.filter((a) => a.kind === "inbox").map((a) => a.id) })}
              >
                <option value="">Move to album…</option>
                {meta.albums
                  .filter((a) => a.kind === "manual")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>,
            )}
        </div>
      )}

      <div className="mt-4">
        <div className="text-[13px] font-medium text-ink">File details</div>
        <div className="mt-2 space-y-1 text-[12px] text-ink-2">
          <div>{asset.filename}</div>
          <div>
            {asset.byteSize ? `${(asset.byteSize / 1e6).toFixed(1)} MB` : "—"}
            {asset.width ? `  •  ${asset.width} × ${asset.height}` : ""}
          </div>
          <div>
            Uploaded {new Date(asset.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at{" "}
            {new Date(asset.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </div>
        </div>
      </div>
      {place?.lat != null && (
        <div className="mt-3 grid grid-cols-[110px_1fr] items-center gap-3 rounded-xl bg-white/60 p-2">
          <MiniMap pins={[{ id: place.id, lat: place.lat, lng: place.lng! }]} className="h-[70px] w-full rounded-lg" />
          <div className="min-w-0 text-[12.5px]">
            <div className="flex items-center justify-between text-ink">
              {place.name} <ExternalLink className="size-3.5" />
            </div>
            <div className="text-[11.5px] text-muted">{place.address}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
