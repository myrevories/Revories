"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudUpload,
  Copy,
  Expand,
  HelpCircle,
  Home,
  Layers,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  ScanFace,
  Sparkles,
  Tag,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { createEventAction, setFaceBoxAction } from "@/app/actions";
import { Avatar, Button, Chip } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import { Combobox } from "@/components/pickers";
import { AssetDetailsForm, SaveIndicator, applyPatch, useAssetSaver } from "@/components/assets/asset-details";
import { AssetThumb, StatusDot } from "@/components/assets/asset-browser";
import { ShareModal } from "@/components/sharing/share-modal";
import type { Asset, AssetPatch, FaceBox } from "@/lib/types";
import { cn, formatTakenAt, plural } from "@/lib/utils";

type StatusFilter = "all" | Asset["status"];

/**
 * Review & Organize: left = batch grid with multi-select, center = big viewer
 * with face tagging, right = auto-saving details + "apply to selected".
 */
export function ReviewWorkspace({ initial }: { initial: Asset[] }) {
  const meta = useMeta();
  const router = useRouter();
  // Local state is the source of truth here so items don't vanish from the
  // queue the moment they're reviewed.
  const [assets, setAssets] = useState(initial);
  const [filter, setFilter] = useState<StatusFilter>(initial.some((a) => a.status === "needs_details") ? "needs_details" : "all");
  const [currentId, setCurrentId] = useState(initial[0]?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [tool, setTool] = useState<"dupes" | "share" | null>(null);

  const { save, pending, savedAt } = useAssetSaver(
    (ids, patch: AssetPatch) => setAssets((xs) => xs.map((a) => (ids.includes(a.id) ? applyPatch(a, patch) : a))),
    true,
  );

  // The photo being edited stays in view even after its status changes.
  const visible = useMemo(
    () => (filter === "all" ? assets : assets.filter((a) => a.status === filter || a.id === currentId)),
    [assets, filter, currentId],
  );
  const current = assets.find((a) => a.id === currentId) ?? visible[0];
  const idx = visible.findIndex((a) => a.id === current?.id);
  const counts = {
    all: assets.length,
    reviewed: assets.filter((a) => a.status === "reviewed").length,
    tagged: assets.filter((a) => a.status === "tagged").length,
    needs_details: assets.filter((a) => a.status === "needs_details").length,
  };

  function go(delta: number) {
    const next = visible[Math.min(Math.max(idx + delta, 0), visible.length - 1)];
    if (next) setCurrentId(next.id);
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select,[role=dialog]")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const others = selected.filter((id) => id !== current?.id);

  /** Fill blanks on the given photos from what the rest of the batch shares. */
  function autoSuggest(ids: string[]) {
    for (const a of assets.filter((x) => ids.includes(x.id))) {
      const p = suggestFor(a, assets);
      if (Object.keys(p).length) save([a.id], p);
    }
  }

  function markReviewedAndNext() {
    if (!current) return;
    save([current.id], { status: "reviewed" });
    const rest = visible.filter((a) => a.id !== current.id && a.status !== "reviewed");
    const after = rest.find((a) => visible.indexOf(a) > idx) ?? rest[0];
    if (after) setCurrentId(after.id);
  }

  const [eventFilter, setEventFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const years = [...new Set(assets.map((a) => a.takenAt?.slice(0, 4)).filter((y): y is string => !!y))].sort();
  const listed = visible.filter(
    (a) => (!eventFilter || a.eventId === eventFilter) && (!yearFilter || a.takenAt?.startsWith(yearFilter)) && (!placeFilter || a.placeId === placeFilter),
  );
  const pct = (n: number) => `${(n / Math.max(counts.all, 1)) * 100}%`;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col px-3 pt-4 lg:px-6">
      {/* Steps + script line */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <ol className="flex items-center gap-3 text-[12px]">
          {["Upload", "Review & Organize", "Save to Archive"].map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              {i > 0 && <ChevronRight className="size-4 text-ink-2" />}
              <span className="flex items-center gap-2">
                <span className={cn("grid size-7 place-items-center rounded-full text-[12px] font-medium", i === 1 ? "bg-gradient-to-b from-accent-2 to-accent text-white" : "bg-white text-ink-2 shadow-[var(--shadow-soft)]")}>{i + 1}</span>
                <span className={i === 1 ? "font-medium text-ink" : i === 0 ? "text-ink-2" : "text-faint"}>{t}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="hidden font-script text-[26px] text-[#3a4a6b] lg:block">“ Same lake. New stories. Still family. ♡</p>
      </div>

      {/* Header row */}
      <div className="mt-3 grid gap-3 rounded-[22px] border border-white/80 bg-white/55 p-3 shadow-[0_10px_40px_rgb(31_37_54/0.07)] backdrop-blur-md lg:grid-cols-[1fr_minmax(300px,360px)_minmax(270px,300px)]">
        <div className="px-3 py-1">
          <div className="text-[10px] font-medium tracking-[0.2em] text-ink-2 uppercase">Batch review</div>
          <h1 className="font-serif text-[34px] leading-[1.05] font-medium text-ink">Review &amp; Organize Your Photos</h1>
          <p className="mt-1 max-w-md text-[12.5px] leading-snug text-ink-2">Take a moment to add details, tag people, and make these memories easy to find for generations to come.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken text-ink">
            <CloudUpload className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-ink">{plural(counts.all, "photo")} uploaded</div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-sunken">
              <span className="bg-accent transition-all" style={{ width: pct(counts.reviewed) }} />
              <span className="bg-person/70 transition-all" style={{ width: pct(counts.tagged) }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" /> {counts.reviewed} reviewed</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-person/70" /> {counts.tagged} tagged</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#f2c55c]" /> {counts.needs_details} need details</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
          <div className="flex gap-2">
            <Button variant="secondary" className="h-11 flex-1" onClick={() => router.push(`/projects/${meta.projectId}/uploads`)}>
              <Clock className="size-4" /> Finish later
            </Button>
            <Button variant="primary" className="h-11 flex-[1.3]" onClick={() => router.push(`/projects/${meta.projectId}`)}>
              Save to Archive <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="flex justify-end">
            <SaveIndicator pending={pending} savedAt={savedAt} idle="Your progress is saved automatically." />
          </div>
        </div>
      </div>

      {!assets.length ? (
        <div className="mt-3 grid place-items-center rounded-2xl bg-surface p-14 text-center shadow-[var(--shadow-soft)]">
          <div>
            <Check className="mx-auto size-8 text-accent" />
            <h2 className="mt-3 font-serif text-[26px]">All caught up</h2>
            <p className="text-[13px] text-ink-2">Every memory in this project has details. Nice work.</p>
            <Link href={`/projects/${meta.projectId}`} className="mt-4 inline-block text-[13px] font-medium text-accent">
              Back to the archive
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 rounded-[22px] border border-white/80 bg-white/55 p-3 shadow-[0_10px_40px_rgb(31_37_54/0.07)] backdrop-blur-md lg:grid-cols-[minmax(300px,1fr)_minmax(0,1.05fr)_minmax(290px,0.85fr)]">
          {/* Left: the batch */}
          <section className="flex min-h-0 flex-col rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)] lg:max-h-[calc(100vh-130px)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-serif text-[22px] leading-tight font-medium text-ink">Photos in This Upload</h2>
                <p className="text-[11px] text-ink-2">
                  {plural(counts.all, "photo")} <span className="text-muted">· Select, filter, and add details in bulk.</span>
                </p>
              </div>
              <div className="flex rounded-lg bg-sunken p-0.5">
                {(["grid", "list"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] capitalize", view === v ? "bg-gradient-to-b from-accent-2 to-accent text-white" : "text-ink-2")}
                  >
                    {v === "grid" ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />} {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All", counts.all, ""],
                  ["reviewed", "Reviewed", counts.reviewed, "bg-accent"],
                  ["tagged", "Tagged", counts.tagged, "bg-person/70"],
                  ["needs_details", "Needs Details", counts.needs_details, "bg-[#f2c55c]"],
                ] as const
              ).map(([k, label, n, dot]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-full px-3 text-[11.5px]",
                    filter === k ? "bg-gradient-to-b from-accent-2 to-accent text-white" : k === "needs_details" ? "bg-[#fdf3dc] text-ink-2" : "bg-sunken text-ink-2",
                  )}
                >
                  {dot && <span className={cn("size-2.5 rounded-full", dot)} />}
                  {label} ({n})
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ["Event", eventFilter, setEventFilter, "All events", meta.events.map((e) => [e.id, e.name])],
                  ["Year", yearFilter, setYearFilter, "All years", years.map((y) => [y, y])],
                  ["Location", placeFilter, setPlaceFilter, "All locations", meta.places.map((p) => [p.id, p.name])],
                ] as const
              ).map(([label, value, set, all, opts]) => (
                <label key={label} className="block">
                  <span className="mb-1 block text-[10.5px] text-ink-2">{label}</span>
                  <select value={value} onChange={(e) => set(e.target.value)} className="field h-8 px-2 text-[11.5px]">
                    <option value="">{all}</option>
                    {opts.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 text-[11.5px] text-ink">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                  checked={listed.length > 0 && listed.every((a) => selected.includes(a.id))}
                  onChange={(e) => setSelected(e.target.checked ? listed.map((a) => a.id) : [])}
                />
                Select all ({listed.length})
              </label>
              <Button size="sm" variant="secondary" disabled={!selected.length} onClick={() => document.getElementById("apply-selected")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                <Tag className="size-3.5" /> Apply details
              </Button>
              <Button size="sm" variant="secondary" onClick={() => autoSuggest(selected.length ? selected : listed.map((a) => a.id))}>
                <Sparkles className="size-3.5 text-place" /> Auto-suggest
              </Button>
            </div>
            <div className={cn("scroll-thin mt-3 min-h-0 flex-1 content-start overflow-y-auto pr-1", view === "grid" ? "grid grid-cols-3 gap-x-2.5 gap-y-3 xl:grid-cols-4" : "space-y-1")}>
              {listed.map((a) => {
                const isSel = selected.includes(a.id);
                const isCur = current?.id === a.id;
                return view === "grid" ? (
                  <div key={a.id} className="min-w-0">
                    <div className="relative">
                      <button type="button" onClick={() => setCurrentId(a.id)} className={cn("relative block aspect-[4/3] w-full overflow-hidden rounded-md", isCur && "ring-2 ring-accent ring-offset-2")}>
                        <AssetThumb asset={a} className="size-full" />
                      </button>
                      <SelectBox on={isSel} onClick={() => setSelected((s) => (isSel ? s.filter((x) => x !== a.id) : [...s, a.id]))} />
                    </div>
                    <div className="mt-1 flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="truncate text-[10.5px] text-ink">{a.filename}</div>
                        <div className="truncate text-[9.5px] text-muted">{formatTakenAt(a.takenAt, a.datePrecision)}</div>
                      </div>
                      <StatusDot status={a.status} />
                    </div>
                  </div>
                ) : (
                  <div key={a.id} className={cn("flex items-center gap-2.5 rounded-lg p-1.5", isCur ? "bg-accent-soft" : "hover:bg-sunken")}>
                    <input type="checkbox" checked={isSel} onChange={() => setSelected((s) => (isSel ? s.filter((x) => x !== a.id) : [...s, a.id]))} className="accent-[var(--color-accent)]" />
                    <button type="button" onClick={() => setCurrentId(a.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      <AssetThumb asset={a} className="h-9 w-12 rounded" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] text-ink">{a.filename}</span>
                        <span className="block text-[10px] text-muted">{formatTakenAt(a.takenAt, a.datePrecision)}</span>
                      </span>
                      <StatusDot status={a.status} label />
                    </button>
                  </div>
                );
              })}
              {!listed.length && <p className="col-span-full py-8 text-center text-[12.5px] text-muted">Nothing in this view.</p>}
            </div>
          </section>

          {/* Center: viewer */}
          <section className="flex min-w-0 flex-col gap-3">
            <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
              {current && (
                <Viewer
                  key={current.id}
                  asset={current}
                  index={idx}
                  total={visible.length}
                  onPrev={() => go(-1)}
                  onNext={() => go(1)}
                  onTag={(personId, box) => {
                    setAssets((xs) =>
                      xs.map((a) =>
                        a.id === current.id
                          ? applyPatch({ ...a, people: a.people.some((p) => p.personId === personId) ? a.people.map((p) => (p.personId === personId ? { ...p, box } : p)) : [...a.people, { personId, box, confirmed: true }] }, {})
                          : a,
                      ),
                    );
                    void setFaceBoxAction(current.id, personId, box);
                  }}
                  onUntag={(personId) => save([current.id], { removePersonIds: [personId] })}
                  strip={
                    <div className="flex items-center gap-1.5">
                      <button type="button" aria-label="Previous" onClick={() => go(-1)} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-2 hover:bg-sunken">
                        <ChevronLeft className="size-4" />
                      </button>
                      <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
                        {visible.slice(Math.max(0, idx - 2), Math.max(0, idx - 2) + 6).map((a) => (
                          <button key={a.id} type="button" onClick={() => setCurrentId(a.id)} className={cn("min-w-0 flex-1 overflow-hidden rounded-md", a.id === current.id ? "ring-2 ring-accent ring-offset-1" : "opacity-85 hover:opacity-100")}>
                            <AssetThumb asset={a} className="aspect-[4/3] w-full" />
                          </button>
                        ))}
                      </div>
                      <button type="button" aria-label="Next" onClick={() => go(1)} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-2 hover:bg-sunken">
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  }
                />
              )}
            </div>
            {current && <Suggestions asset={current} pool={assets} onApply={(p) => save([current.id], p)} />}
          </section>

          {/* Right: details */}
          <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)]">
            {current && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-serif text-[22px] font-medium text-ink">Photo Details</h3>
                  <SaveIndicator pending={pending} savedAt={savedAt} />
                </div>
                <AssetDetailsForm assets={[current]} save={save} showAlbums={false} />
                <Button variant="secondary" className="mt-4 w-full" onClick={markReviewedAndNext}>
                  <Check className="size-4 text-accent" /> Looks good — next photo
                </Button>
                <div className="mt-5 border-t border-line pt-5" id="apply-selected">
                  <ApplyToSelected source={current} targetIds={others} onApply={(p) => save(others, p)} onClear={() => setSelected([])} />
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* More tools */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/55 p-2 backdrop-blur-md md:grid-cols-5">
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-ink shadow-[var(--shadow-soft)]">
            <Layers className="size-4" />
          </span>
          <span>
            <span className="block font-serif text-[16px] leading-tight font-medium text-ink">More Tools for This Batch</span>
            <span className="block text-[10.5px] text-ink-2">Save time with helpful tools.</span>
          </span>
        </div>
        <ToolButton icon={<Copy />} title="Find duplicates" hint="Find similar photos in this upload." onClick={() => setTool("dupes")} />
        <ToolButton
          icon={<HelpCircle />}
          title="Mystery photos"
          hint="Show photos without people or dates."
          onClick={() => {
            const mystery = assets.filter((a) => !a.people.length && !a.takenAt);
            setFilter("all");
            setSelected(mystery.map((a) => a.id));
            if (mystery[0]) setCurrentId(mystery[0].id);
          }}
        />
        <CreateEventTool selectedIds={selected} onDone={(eventId) => save(selected, { eventId })} />
        <ToolButton icon={<Users />} title="Ask family to help" hint="Send to relatives for identification." onClick={() => setTool("share")} />
      </div>
      {tool === "dupes" && <DuplicatesModal assets={assets} onClose={() => setTool(null)} onSelect={(ids) => (setSelected(ids), setFilter("all"), setTool(null))} />}
      {tool === "share" && <ShareModal onClose={() => setTool(null)} />}
    </div>
  );
}

function SelectBox({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={on ? "Deselect" : "Select"}
      onClick={onClick}
      className={cn("absolute top-1.5 left-1.5 grid size-[18px] place-items-center rounded-[4px] border-[1.5px]", on ? "border-accent bg-accent text-white" : "border-white bg-white/70 text-transparent")}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}

function ToolButton({ icon, title, hint, onClick }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-left shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-person-soft text-person [&>svg]:size-4">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-ink">{title}</span>
        <span className="block truncate text-[10px] text-muted">{hint}</span>
      </span>
    </button>
  );
}

// ───────── Viewer with face tagging ─────────

function Viewer({
  asset,
  index,
  total,
  onPrev,
  onNext,
  onTag,
  onUntag,
  strip,
}: {
  asset: Asset;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onTag: (personId: string, box: FaceBox) => void;
  onUntag: (personId: string) => void;
  strip?: React.ReactNode;
}) {
  const meta = useMeta();
  const [zoom, setZoom] = useState(1);
  const [tagging, setTagging] = useState(false);
  const [draft, setDraft] = useState<FaceBox | null>(null);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [placing, setPlacing] = useState<FaceBox | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  function rel(e: React.PointerEvent) {
    const r = imgRef.current!.getBoundingClientRect();
    return { x: Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1), y: Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) };
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-3">
        <Button size="sm" variant="secondary" onClick={onPrev} disabled={index <= 0} aria-label="Previous photo">
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[18px] leading-tight font-medium text-ink">{asset.filename}</div>
          <div className="text-[10.5px] text-muted">
            {index + 1} of {total}
            {asset.contributorName && ` · from ${asset.contributorName}`}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={onNext} disabled={index >= total - 1} aria-label="Next photo">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="relative grid min-h-[280px] flex-1 place-items-center overflow-auto rounded-lg bg-sunken">
        {asset.kind === "photo" ? (
          <div
            ref={imgRef}
            className={cn("relative select-none", tagging && "cursor-crosshair")}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            onPointerDown={(e) => {
              // Only draw when pressing on the photo itself, not the person picker.
              if (!tagging || placing || (e.target as HTMLElement).tagName !== "IMG") return;
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              const p = rel(e);
              setDrawing(p);
              setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
            }}
            onPointerMove={(e) => {
              if (!drawing) return;
              const p = rel(e);
              setDraft({ x: Math.min(p.x, drawing.x), y: Math.min(p.y, drawing.y), w: Math.abs(p.x - drawing.x), h: Math.abs(p.y - drawing.y) });
            }}
            onPointerUp={() => {
              if (!drawing) return;
              setDrawing(null);
              if (draft && draft.w > 0.02 && draft.h > 0.02) setPlacing(draft);
              else setDraft(null);
            }}
          >
            <img src={asset.url} alt={asset.caption ?? asset.filename} draggable={false} className="block max-h-[46vh] w-auto max-w-full" />
            {asset.people
              .filter((p) => p.box)
              .map((p) => {
                const person = meta.person(p.personId);
                return (
                  <div
                    key={p.personId}
                    className={cn("group absolute rounded-md border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]", tagging && "pointer-events-none")}
                    style={{ left: `${p.box!.x * 100}%`, top: `${p.box!.y * 100}%`, width: `${p.box!.w * 100}%`, height: `${p.box!.h * 100}%` }}
                  >
                    <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-ink shadow">
                      {person?.name ?? "Unknown"}
                    </span>
                  </div>
                );
              })}
            {draft && (
              <div
                className="absolute rounded-md border-2 border-accent bg-accent/10"
                style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
              />
            )}
            {placing && (
              <div className="absolute z-10" style={{ left: `${placing.x * 100}%`, top: `${(placing.y + placing.h) * 100}%` }}>
                <Combobox
                  defaultOpen
                  placeholder="Who is this?"
                  options={meta.people.map((p) => ({ id: p.id, label: p.name, hint: p.branch, icon: <Avatar name={p.name} size={22} /> }))}
                  selected={[]}
                  onSelect={(id) => {
                    onTag(id, placing);
                    setPlacing(null);
                    setDraft(null);
                    setTagging(false);
                  }}
                  onClose={() => (setPlacing(null), setDraft(null))}
                  trigger={() => <span />}
                />
              </div>
            )}
          </div>
        ) : (
          <AssetThumb asset={asset} className="h-64 w-64 rounded-xl" />
        )}
        {asset.kind === "photo" && (
          <button
            type="button"
            onClick={() => setTagging((t) => !t)}
            className={cn(
              "absolute top-3 right-3 flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium shadow",
              tagging ? "bg-accent text-white" : "bg-ink/85 text-white hover:bg-ink",
            )}
          >
            {tagging ? <ScanFace className="size-3.5" /> : <MapPin className="size-3.5" />} {tagging ? "Drag around a face" : "Click a face to tag"}
          </button>
        )}
      </div>

      <div className="relative mt-2 flex items-center justify-center gap-2 text-[12px] text-ink-2">
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="grid size-7 place-items-center rounded-md hover:bg-sunken">
          <ZoomOut className="size-4" />
        </button>
        <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="grid size-7 place-items-center rounded-md hover:bg-sunken">
          <ZoomIn className="size-4" />
        </button>
        <a href={asset.url} target="_blank" rel="noreferrer" aria-label="Open full size" className="absolute right-0 grid size-7 place-items-center rounded-md border border-line hover:bg-sunken">
          <Expand className="size-4" />
        </a>
      </div>

      {strip && <div className="mt-3">{strip}</div>}

      <div className="mt-3 border-t border-line pt-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-sunken text-ink-2">
            <ScanFace className="size-4" />
          </span>
          <span className="flex-1 font-serif text-[16px] font-medium text-ink">People in this photo ({asset.people.length})</span>
          {asset.kind === "photo" && (
            <button type="button" onClick={() => setTagging(true)} className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[11.5px] text-ink-2 hover:text-ink">
              <Pencil className="size-3.5" /> Edit Faces
            </button>
          )}
        </div>
        {asset.people.length ? (
          <div className="flex flex-wrap gap-3">
            {asset.people.map((p) => {
              const person = meta.person(p.personId);
              if (!person) return null;
              return (
                <div key={p.personId} className="group relative flex w-16 flex-col items-center text-center">
                  <Avatar name={person.name} size={42} />
                  <span className="mt-1 w-full truncate text-[11px] font-medium text-ink">{person.name.split(" ")[0]}</span>
                  <span className="text-[9px] text-faint">{p.box ? "Face tagged" : "Tag to confirm"}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${person.name}`}
                    onClick={() => onUntag(p.personId)}
                    className="absolute -top-1 right-2 grid size-4 place-items-center rounded-full bg-ink text-white opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-muted">No one tagged yet. Use “Tag a face” or add people in the details panel.</p>
        )}
      </div>
    </div>
  );
}

// ───────── Suggestions ─────────

function mostCommon<T>(xs: (T | undefined)[]) {
  const c = new Map<T, number>();
  xs.forEach((x) => x !== undefined && c.set(x, (c.get(x) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Blank fields on `asset`, filled with what the rest of the batch most often has. */
function suggestFor(asset: Asset, pool: Asset[]): AssetPatch {
  const tagged = pool.filter((a) => a.id !== asset.id && (a.eventId || a.placeId));
  const p: AssetPatch = {};
  const eventId = !asset.eventId ? mostCommon(tagged.map((a) => a.eventId)) : undefined;
  const placeId = !asset.placeId ? mostCommon(tagged.map((a) => a.placeId)) : undefined;
  const month = !asset.takenAt ? mostCommon(tagged.map((a) => a.takenAt?.slice(0, 7))) : undefined;
  if (eventId) p.eventId = eventId;
  if (placeId) p.placeId = placeId;
  if (month) Object.assign(p, { takenAt: `${month}-01`, datePrecision: "month" });
  return p;
}

/** Suggest details based on other photos in the same batch: whatever the
 *  neighbouring, already-tagged photos share. Users confirm, never auto-applied. */
function Suggestions({ asset, pool, onApply }: { asset: Asset; pool: Asset[]; onApply: (p: AssetPatch) => void }) {
  const meta = useMeta();
  const tagged = pool.filter((a) => a.id !== asset.id && (a.eventId || a.placeId));
  const mode = <T,>(xs: (T | undefined)[]) => {
    const c = new Map<T, number>();
    xs.forEach((x) => x !== undefined && c.set(x, (c.get(x) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const eventId = !asset.eventId ? mode(tagged.map((a) => a.eventId)) : undefined;
  const placeId = !asset.placeId ? mode(tagged.map((a) => a.placeId)) : undefined;
  const takenAt = !asset.takenAt ? mode(tagged.map((a) => a.takenAt?.slice(0, 7))) : undefined;
  const tagIds = [...new Set(tagged.flatMap((a) => a.tagIds))].filter((t) => !asset.tagIds.includes(t)).slice(0, 3);

  const items: { key: string; label: string; kind: "event" | "place" | "year" | "tag"; patch: AssetPatch; icon?: React.ReactNode }[] = [];
  if (eventId) items.push({ key: "e", label: meta.event(eventId)?.name ?? "", kind: "event", patch: { eventId } });
  if (placeId) items.push({ key: "p", label: meta.place(placeId)?.name ?? "", kind: "place", patch: { placeId }, icon: <Home /> });
  if (takenAt) items.push({ key: "d", label: formatTakenAt(`${takenAt}-01`, "month"), kind: "year", patch: { takenAt: `${takenAt}-01`, datePrecision: "month" } });
  tagIds.forEach((t) => items.push({ key: t, label: meta.tag(t)?.name ?? "", kind: "tag", patch: { addTagIds: [t] } }));
  if (!items.length) return null;

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-place-soft text-place">
            <Sparkles className="size-4" />
          </span>
          <div>
            <div className="font-serif text-[16px] leading-tight font-medium text-ink">Suggestions</div>
            <div className="text-[10.5px] text-muted">Based on people, location, and similar photos in this batch.</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onApply(items.reduce<AssetPatch>((acc, i) => ({ ...acc, ...i.patch, addTagIds: [...(acc.addTagIds ?? []), ...(i.patch.addTagIds ?? [])] }), {}))}
          className="text-[11.5px] font-medium text-ink hover:text-accent"
        >
          Review all
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <button key={i.key} type="button" onClick={() => onApply(i.patch)} title="Click to apply">
            <Chip kind={i.kind} icon={i.icon} className="hover:brightness-95">
              + {i.label}
            </Chip>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── Apply to selected ─────────

function ApplyToSelected({ source, targetIds, onApply, onClear }: { source: Asset; targetIds: string[]; onApply: (p: AssetPatch) => void; onClear: () => void }) {
  const [fields, setFields] = useState({ date: true, event: true, location: true, people: false, tags: false });
  const [done, setDone] = useState(false);
  const toggle = (k: keyof typeof fields) => setFields((f) => ({ ...f, [k]: !f[k] }));
  const n = targetIds.length;

  function apply() {
    const p: AssetPatch = {};
    if (fields.date && source.takenAt) Object.assign(p, { takenAt: source.takenAt, datePrecision: source.datePrecision });
    if (fields.event && source.eventId) p.eventId = source.eventId;
    if (fields.location && source.placeId) p.placeId = source.placeId;
    if (fields.people) p.addPersonIds = source.people.map((x) => x.personId);
    if (fields.tags) p.addTagIds = source.tagIds;
    onApply(p);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className={cn("rounded-xl bg-field p-4 transition", n === 0 && "opacity-75")}>
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-soft)]">
          <Copy className="size-4" />
        </span>
        <div>
          <div className="font-serif text-[16px] leading-tight font-medium text-ink">
            Apply to Selected Photos {n > 0 && <span className="font-sans text-[11px] text-ink-2">({n} selected)</span>}
          </div>
          <div className="text-[10.5px] text-muted">Quickly add the same details to multiple photos.</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {(
          [
            ["date", "Date or year"],
            ["event", "Event"],
            ["location", "Location"],
            ["people", "People"],
            ["tags", "Tags"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-[12.5px] text-ink-2">
            <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={fields[k]} onChange={() => toggle(k)} />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant={done ? "forest" : "secondary"} className={cn("flex-1", !done && n > 0 && "border-accent/20 bg-accent-soft text-accent hover:text-accent")} disabled={!n} onClick={apply}>
          {done ? (
            <>
              <Check className="size-4" /> Applied
            </>
          ) : n ? (
            <>
              Apply to {plural(n, "photo")} <ArrowRight className="size-4" />
            </>
          ) : (
            "Select photos on the left"
          )}
        </Button>
        {n > 0 && (
          <Button variant="ghost" onClick={onClear} aria-label="Clear selection">
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ───────── Tools ─────────

function CreateEventTool({ selectedIds, onDone }: { selectedIds: string[]; onDone: (eventId: string) => void }) {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <ToolButton
        icon={<CalendarPlus />}
        title="Create event from selection"
        hint={selectedIds.length ? `Group ${selectedIds.length} photos as an event` : "Select photos first"}
        onClick={() => selectedIds.length && setOpen(true)}
      />
      {open && (
        <Modal
          title="Create an event"
          description={`The ${selectedIds.length} selected photos will be added to it.`}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!name.trim() || pending}
                onClick={() =>
                  start(async () => {
                    const e = await createEventAction(meta.projectId, name);
                    meta.add("events", e);
                    onDone(e.id);
                    setOpen(false);
                  })
                }
              >
                Create event
              </Button>
            </>
          }
        >
          <input autoFocus className="field" placeholder="e.g. Memorial Day Weekend 1993" value={name} onChange={(e) => setName(e.target.value)} />
        </Modal>
      )}
    </>
  );
}

export function DuplicatesModal({ assets, onClose, onSelect }: { assets: Asset[]; onClose: () => void; onSelect: (ids: string[]) => void }) {
  // Without content hashes in demo mode, match on file name; with real uploads
  // this uses the checksum column.
  const groups = Object.values(
    assets.reduce<Record<string, Asset[]>>((acc, a) => ((acc[a.filename.toLowerCase()] ??= []).push(a), acc), {}),
  ).filter((g) => g.length > 1);
  return (
    <Modal title="Possible duplicates" description="Photos that look like the same file uploaded more than once." onClose={onClose}>
      {groups.length ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g[0].id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              {g.map((a) => (
                <AssetThumb key={a.id} asset={a} className="size-14 rounded-lg" />
              ))}
              <Button size="sm" className="ml-auto" onClick={() => onSelect(g.slice(1).map((a) => a.id))}>
                Select extras
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <Check className="mx-auto size-6 text-accent" />
          <p className="mt-2 text-[13.5px] font-semibold">No duplicates found</p>
          <p className="text-[12.5px] text-muted">Every photo in this batch looks unique.</p>
        </div>
      )}
    </Modal>
  );
}
