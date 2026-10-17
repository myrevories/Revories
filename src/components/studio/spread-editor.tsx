"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Minus,
  NotebookPen,
  Plus,
  Quote,
  Redo2,
  Shapes,
  StickyNote,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { saveSpreadsAction } from "@/app/actions";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { StudioHeader } from "@/components/studio/studio-header";
import { StyleSwatch, WIDGET_TYPES, WidgetView, type WidgetStyle } from "@/components/studio/widgets";
import { MapInspector } from "@/components/studio/map-inspector";
import type { Asset, Place, Spread, SpreadElement, Story, StorySection, WidgetType } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPREAD_RATIO = 16 / 10; // two 8×10 pages side by side
const GRID = 1; // % snap grid
const SNAP_DIST = 1.2; // % distance to snap to guides

// Corner and edge handles. Edge handles are short bars centred on each side.
const RESIZE_HANDLES: { key: string; dir: NonNullable<Drag["dir"]>; className: string }[] = [
  { key: "nw", dir: { x: -1, y: -1 }, className: "-top-1.5 -left-1.5 size-3 cursor-nwse-resize" },
  { key: "ne", dir: { x: 1, y: -1 }, className: "-top-1.5 -right-1.5 size-3 cursor-nesw-resize" },
  { key: "sw", dir: { x: -1, y: 1 }, className: "-bottom-1.5 -left-1.5 size-3 cursor-nesw-resize" },
  { key: "se", dir: { x: 1, y: 1 }, className: "-right-1.5 -bottom-1.5 size-3 cursor-nwse-resize" },
  { key: "n", dir: { x: 0, y: -1 }, className: "-top-1 left-1/2 h-2 w-5 -translate-x-1/2 cursor-ns-resize" },
  { key: "s", dir: { x: 0, y: 1 }, className: "-bottom-1 left-1/2 h-2 w-5 -translate-x-1/2 cursor-ns-resize" },
  { key: "w", dir: { x: -1, y: 0 }, className: "top-1/2 -left-1 h-5 w-2 -translate-y-1/2 cursor-ew-resize" },
  { key: "e", dir: { x: 1, y: 0 }, className: "top-1/2 -right-1 h-5 w-2 -translate-y-1/2 cursor-ew-resize" },
];

const MIN_SIZE = 3; // % of the spread

/** New box after dragging the `dir` edges by (dx, dy)%. The opposite edges stay put. */
function resizeBox(o: SpreadElement, dir: NonNullable<Drag["dir"]>, dx: number, dy: number, keepRatio: boolean): SpreadElement {
  let w = dir.x === 0 ? o.w : o.w + dir.x * dx;
  let h = dir.y === 0 ? o.h : o.h + dir.y * dy;
  // Keep inside the spread and above a minimum size.
  const maxW = dir.x === -1 ? o.x + o.w : 100 - o.x;
  const maxH = dir.y === -1 ? o.y + o.h : 100 - o.y;
  if (keepRatio && dir.x !== 0 && dir.y !== 0) {
    // One scale factor for both axes, limited so neither side leaves the spread.
    const f = clamp(Math.max(w / o.w, h / o.h), Math.max(MIN_SIZE / o.w, MIN_SIZE / o.h), Math.min(maxW / o.w, maxH / o.h));
    w = o.w * f;
    h = o.h * f;
  }
  w = clamp(w, MIN_SIZE, maxW);
  h = clamp(h, MIN_SIZE, maxH);
  return { ...o, w, h, x: dir.x === -1 ? o.x + o.w - w : o.x, y: dir.y === -1 ? o.y + o.h - h : o.y };
}

const uid = () => `el-${crypto.randomUUID().slice(0, 8)}`;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ───────── Rendering of a single element (shared by canvas, thumbnails, preview) ─────────

function ElementView({ el, asset, mini }: { el: SpreadElement; asset?: Asset; mini?: boolean }) {
  // Thumbnails show text and widgets as simple blocks so they read at tiny sizes.
  if (mini && el.type !== "photo")
    return el.type === "widget" ? (
      <div className="size-full rounded-[2px] bg-sky-100 ring-1 ring-line" />
    ) : (
      <div className="flex size-full flex-col gap-[3px] overflow-hidden pt-[2px]">
        {Array.from({ length: el.type === "heading" ? 1 : 4 }).map((_, i) => (
          <span key={i} className={cn("block shrink-0 rounded-full bg-ink/25", el.type === "heading" ? "h-[4px] w-4/5 bg-ink/60" : "h-[2px] w-full")} />
        ))}
      </div>
    );
  const corner = el.style?.corner === "rounded" ? "rounded-[6%]" : el.style?.corner === "square" ? "" : "rounded-[2px]";
  switch (el.type) {
    case "photo":
      return asset ? (
        <img src={asset.url} alt="" draggable={false} className={cn("size-full object-cover shadow-sm", corner)} />
      ) : (
        <div className={cn("grid size-full place-items-center bg-sunken text-faint", corner)}>
          <ImageIcon className="size-[30%] max-h-8 max-w-8" />
        </div>
      );
    case "heading":
      return <div className="font-serif leading-[0.95] font-medium text-ink" style={{ fontSize: "clamp(10px, 3.4cqw, 64px)" }}>{el.text}</div>;
    case "text":
      return (
        <div className={cn("leading-relaxed text-ink-2", el.style?.align === "center" && "text-center")} style={{ fontSize: "clamp(5px, 0.95cqw, 15px)" }}>
          {el.text}
        </div>
      );
    case "quote":
      return (
        <div className="flex size-full flex-col justify-center" style={{ fontSize: "clamp(6px, 1.25cqw, 20px)" }}>
          <Quote className="mb-[4%] size-[1.6em] text-faint" />
          <div className="font-serif leading-snug italic">“{el.text}”</div>
        </div>
      );
    case "widget":
      return el.widget ? <WidgetView type={el.widget.type} settings={el.widget.settings} /> : null;
  }
}

/** Static render of a spread — page strip thumbnails and preview. */
function SpreadView({ spread, byId, className, mini }: { spread: Spread; byId: Map<string, Asset>; className?: string; mini?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-[#fbfaf7] [container-type:inline-size]", className)} style={{ aspectRatio: SPREAD_RATIO }}>
      <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 shadow-[0_0_12px_rgba(0,0,0,0.15)]" />
      {spread.elements.map((el) => (
        <div key={el.id} className="absolute" style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` }}>
          <ElementView el={el} asset={el.assetId ? byId.get(el.assetId) : undefined} mini={mini} />
        </div>
      ))}
    </div>
  );
}

// ───────── Editor ─────────

type Drag = {
  id: string;
  mode: "move" | "resize";
  /** Which edges a resize moves: -1 = left/top, 1 = right/bottom, 0 = that axis stays. */
  dir?: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
  startX: number;
  startY: number;
  orig: SpreadElement;
};

export function SpreadEditor({
  story,
  sections,
  initialSpreads,
  assets,
  places = [],
  initialSectionId,
}: {
  story: Story;
  sections: StorySection[];
  initialSpreads: Spread[];
  assets: Asset[];
  places?: Place[];
  initialSectionId?: string;
}) {
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const [spreads, setSpreads] = useState(initialSpreads);
  const [past, setPast] = useState<Spread[][]>([]);
  const [future, setFuture] = useState<Spread[][]>([]);
  const [index, setIndex] = useState(() => Math.max(0, initialSpreads.findIndex((s) => s.sectionId === initialSectionId)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [guidesOn, setGuidesOn] = useState(true);
  const [snapOn, setSnapOn] = useState(true);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [rail, setRail] = useState<"sections" | "photos" | "text" | "widgets">("sections");
  const [inspectorTab, setInspectorTab] = useState<"element" | "page" | "layout">("element");
  const [preview, setPreview] = useState(false);
  const [saving, start] = useTransition();
  const [saved, setSaved] = useState(initialSpreads);
  const dirty = spreads !== saved;
  const canvasRef = useRef<HTMLDivElement>(null);

  const spread = spreads[index] ?? spreads[0];
  const section = sections.find((s) => s.id === spread?.sectionId);
  const selected = spread?.elements.find((e) => e.id === selectedId);
  const sectionPhotos = (section?.assetIds ?? []).map((id) => byId.get(id)).filter((a): a is Asset => !!a);

  // Auto-save
  useEffect(() => {
    if (spreads === saved) return;
    const t = setTimeout(
      () =>
        start(async () => {
          await saveSpreadsAction(story.id, spreads);
          setSaved(spreads);
        }),
      900,
    );
    return () => clearTimeout(t);
  }, [spreads, saved, story.id]);

  /** Commit a change with undo history. */
  const commit = useCallback(
    (fn: (s: Spread[]) => Spread[]) => {
      setPast((p) => [...p.slice(-49), spreads]);
      setFuture([]);
      setSpreads(fn);
    },
    [spreads],
  );
  const updateSpread = (fn: (sp: Spread) => Spread) => commit((all) => all.map((s, i) => (i === index ? fn(s) : s)));
  const updateEl = (id: string, p: Partial<SpreadElement>) => updateSpread((sp) => ({ ...sp, elements: sp.elements.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  const addEl = (el: Omit<SpreadElement, "id">) => {
    const full = { ...el, id: uid() };
    updateSpread((sp) => ({ ...sp, elements: [...sp.elements, full] }));
    setSelectedId(full.id);
    setInspectorTab("element");
  };
  const removeEl = (id: string) => (updateSpread((sp) => ({ ...sp, elements: sp.elements.filter((e) => e.id !== id) })), setSelectedId(null));
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [spreads, ...f]);
    setSpreads(past.at(-1)!);
    setPast((p) => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, spreads]);
    setSpreads(future[0]);
    setFuture((f) => f.slice(1));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeEl(selectedId);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // ── Drag / resize with snapping ──
  function pct(e: { clientX: number; clientY: number }) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  function snap(el: SpreadElement, mode: Drag["mode"], dir: Drag["dir"] = { x: 1, y: 1 }) {
    if (!snapOn) return { el, v: [], h: [] };
    const others = spread.elements.filter((o) => o.id !== el.id);
    const vLines = [0, 50, 100, 4, 96, 46, 54, ...others.flatMap((o) => [o.x, o.x + o.w, o.x + o.w / 2])];
    const hLines = [0, 100, 8, 92, 50, ...others.flatMap((o) => [o.y, o.y + o.h, o.y + o.h / 2])];
    const out = { ...el };
    const v: number[] = [];
    const h: number[] = [];
    const tryAxis = (edges: number[], lines: number[], apply: (delta: number) => void, hit: number[]) => {
      let best: { d: number; line: number } | null = null;
      for (const e of edges) for (const l of lines) if (Math.abs(e - l) < SNAP_DIST && (!best || Math.abs(e - l) < Math.abs(best.d))) best = { d: l - e, line: l };
      if (best) {
        apply(best.d);
        hit.push(best.line);
      }
    };
    if (mode === "move") {
      tryAxis([out.x, out.x + out.w, out.x + out.w / 2], vLines, (d) => (out.x += d), v);
      tryAxis([out.y, out.y + out.h, out.y + out.h / 2], hLines, (d) => (out.y += d), h);
    } else {
      // Snap only the edges being dragged.
      if (dir.x === 1) tryAxis([out.x + out.w], vLines, (d) => (out.w += d), v);
      if (dir.x === -1) tryAxis([out.x], vLines, (d) => ((out.x += d), (out.w -= d)), v);
      if (dir.y === 1) tryAxis([out.y + out.h], hLines, (d) => (out.h += d), h);
      if (dir.y === -1) tryAxis([out.y], hLines, (d) => ((out.y += d), (out.h -= d)), h);
      return { el: out, v, h };
    }
    if (!v.length) out.x = Math.round(out.x / GRID) * GRID;
    if (!h.length) out.y = Math.round(out.y / GRID) * GRID;
    return { el: out, v, h };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = pct(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    let next: SpreadElement =
      drag.mode === "move"
        ? { ...drag.orig, x: clamp(drag.orig.x + dx, -drag.orig.w + 2, 98), y: clamp(drag.orig.y + dy, -drag.orig.h + 2, 98) }
        : resizeBox(drag.orig, drag.dir ?? { x: 1, y: 1 }, dx, dy, e.shiftKey);
    // Shift-resizes keep their exact proportions, so skip edge snapping for them.
    const snapped = drag.mode === "resize" && e.shiftKey ? { el: next, v: [], h: [] } : snap(next, drag.mode, drag.dir);
    next = snapped.el;
    setGuides({ v: snapped.v, h: snapped.h });
    // live update without history; history is recorded on pointer up
    setSpreads((all) => all.map((s, i) => (i === index ? { ...s, elements: s.elements.map((el) => (el.id === drag.id ? next : el)) } : s)));
  }

  function onPointerUp() {
    if (!drag) return;
    const final = spread.elements.find((e) => e.id === drag.id);
    if (final && (final.x !== drag.orig.x || final.y !== drag.orig.y || final.w !== drag.orig.w || final.h !== drag.orig.h)) {
      setPast((p) => [...p.slice(-49), spreads.map((s, i) => (i === index ? { ...s, elements: s.elements.map((el) => (el.id === drag.id ? drag.orig : el)) } : s))]);
      setFuture([]);
    }
    setDrag(null);
    setGuides({ v: [], h: [] });
  }

  function startDrag(e: React.PointerEvent, el: SpreadElement, mode: Drag["mode"], dir?: Drag["dir"]) {
    e.stopPropagation();
    if (editingText === el.id) return;
    setSelectedId(el.id);
    setInspectorTab("element");
    const p = pct(e);
    setDrag({ id: el.id, mode, dir, startX: p.x, startY: p.y, orig: el });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const assetId = e.dataTransfer.getData("text/asset");
    const widget = e.dataTransfer.getData("text/widget") as WidgetType;
    const p = pct(e);
    const target = spread.elements.find((el) => el.type === "photo" && p.x >= el.x && p.x <= el.x + el.w && p.y >= el.y && p.y <= el.y + el.h);
    if (assetId && target) return updateEl(target.id, { assetId });
    if (assetId) return addEl({ type: "photo", assetId, x: clamp(p.x - 10, 0, 80), y: clamp(p.y - 12, 0, 76), w: 20, h: 24 });
    if (widget) addEl({ type: "widget", widget: { type: widget, settings: {} }, x: clamp(p.x - 10, 0, 80), y: clamp(p.y - 9, 0, 82), w: 20, h: 18 });
  }

  const selectedPx = selected ? { w: Math.round((selected.w / 100) * 1600), h: Math.round((selected.h / 100) * 1000) } : null;

  return (
    <>
      <StudioHeader
        storyId={story.id}
        projectId={story.projectId}
        title={story.title}
        subtitle={story.subtitle}
        step={1}
        actions={
          <>
            <span className="hidden items-center gap-1 text-[11.5px] text-muted lg:flex">
              {saving || dirty ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-accent" />}
              {saving || dirty ? "Saving…" : "Saved"}
            </span>
            <Button variant="secondary" onClick={() => setPreview(true)}>
              <Maximize2 className="size-4" /> <span className="hidden sm:inline">Preview book</span>
            </Button>
            <Button variant="ink" onClick={() => start(() => saveSpreadsAction(story.id, spreads))}>
              Save <Check className="size-4" />
            </Button>
          </>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_280px] max-lg:grid-cols-[minmax(0,1fr)]">
        {/* Left rail */}
        <aside className="glass m-3 mr-0 flex min-h-0 flex-col p-3 max-lg:hidden">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-sunken p-1">
            {(
              [
                ["sections", <LayoutTemplate key="s" />, "Sections"],
                ["photos", <ImageIcon key="p" />, "Photos"],
                ["text", <Type key="t" />, "Text"],
                ["widgets", <Shapes key="w" />, "Widgets"],
              ] as const
            ).map(([k, icon, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRail(k)}
                className={cn("flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10.5px] font-medium [&>svg]:size-4", rail === k ? "bg-surface text-accent shadow-[var(--shadow-soft)]" : "text-muted")}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto">
            {rail === "sections" && (
              <div className="space-y-1.5">
                {sections.map((s, i) => {
                  const spIdx = spreads.findIndex((sp) => sp.sectionId === s.id);
                  const count = spreads.filter((sp) => sp.sectionId === s.id).length;
                  const cover = byId.get(s.assetIds[0]);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => spIdx >= 0 && (setIndex(spIdx), setSelectedId(null))}
                      className={cn("flex w-full items-center gap-2.5 rounded-xl border p-2 text-left", spread?.sectionId === s.id ? "border-accent bg-accent-soft/40" : "border-transparent hover:bg-sunken")}
                    >
                      {cover ? <img src={cover.thumbUrl} alt="" className="h-9 w-12 rounded-md object-cover" /> : <span className="h-9 w-12 rounded-md bg-sunken" />}
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold">
                          {i + 1}. {s.title}
                        </span>
                        <span className="block text-[11px] text-muted">{count * 2} pages</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {(rail === "photos" || rail === "sections") && (
              <div className={rail === "sections" ? "mt-5" : ""}>
                <div className="mb-2 text-[12px] font-semibold">
                  {rail === "sections" ? `Section photos (${sectionPhotos.length})` : `All photos (${assets.length})`}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(rail === "sections" ? sectionPhotos : assets).map((a) => {
                    const onPage = spread?.elements.some((e) => e.assetId === a.id);
                    return (
                      <div
                        key={a.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/asset", a.id)}
                        onDoubleClick={() => addEl({ type: "photo", assetId: a.id, x: 60, y: 30, w: 20, h: 24 })}
                        className="relative aspect-square cursor-grab overflow-hidden rounded-md"
                        title="Drag onto the page (or double-click)"
                      >
                        <img src={a.thumbUrl} alt="" className="size-full object-cover" draggable={false} />
                        {onPage && (
                          <span className="absolute right-1 bottom-1 grid size-4 place-items-center rounded-full bg-accent text-white">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 rounded-lg bg-accent-soft/60 px-2 py-2 text-center text-[11px] text-accent">Drag a photo onto the page — or onto another photo to swap it</p>
              </div>
            )}
            {rail === "text" && (
              <div className="space-y-2">
                {(
                  [
                    ["heading", "Heading", "Add a title", { w: 24, h: 14 }],
                    ["text", "Paragraph", "Tell a bit of the story here.", { w: 20, h: 18 }],
                    ["quote", "Quote", "A line worth remembering.", { w: 20, h: 16 }],
                  ] as const
                ).map(([type, label, text, size]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addEl({ type, text, x: 8, y: 40, ...size })}
                    className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-left text-[12.5px] hover:border-accent-line"
                  >
                    <Plus className="size-3.5 text-accent" /> {label}
                  </button>
                ))}
              </div>
            )}
            {rail === "widgets" && (
              <div className="space-y-2">
                {WIDGET_TYPES.map((t) => (
                  <div
                    key={t.type}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/widget", t.type)}
                    onClick={() => addEl({ type: "widget", widget: { type: t.type, settings: {} }, x: 60, y: 10, w: 20, h: 18 })}
                    className="cursor-grab rounded-xl border border-line p-2 hover:border-accent-line"
                  >
                    <div className="h-14">
                      <WidgetView type={t.type} />
                    </div>
                    <div className="mt-1.5 text-[11.5px] font-medium">{t.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas column */}
        <main className="glass m-3 flex min-h-0 min-w-0 flex-col overflow-hidden !bg-white/35">
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/60 bg-white/60 px-3 py-1.5 text-[12px]">
            <div className="mr-2 min-w-0">
              <div className="truncate text-[13px] font-semibold">{section?.title ?? "Untitled spread"}</div>
              <div className="text-[11px] text-muted">
                Pages {index * 2 + 2}–{index * 2 + 3} · spread {index + 1} of {spreads.length}
              </div>
            </div>
            <ToolbarBtn label="Undo" onClick={undo} disabled={!past.length}>
              <Undo2 />
            </ToolbarBtn>
            <ToolbarBtn label="Redo" onClick={redo} disabled={!future.length}>
              <Redo2 />
            </ToolbarBtn>
            <span className="mx-1 h-5 w-px bg-line" />
            <ToolbarBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
              <Minus />
            </ToolbarBtn>
            <span className="w-11 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <ToolbarBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
              <Plus />
            </ToolbarBtn>
            <button type="button" onClick={() => setZoom(1)} className="rounded-md px-2 py-1 font-medium text-ink-2 hover:bg-sunken">
              Fit spread
            </button>
            <span className="mx-1 h-5 w-px bg-line" />
            <Toggle label="Guides" on={guidesOn} onChange={setGuidesOn} />
            <Toggle label="Snap" on={snapOn} onChange={setSnapOn} />
            <div className="ml-auto flex items-center gap-1">
              <ToolbarBtn label="Previous spread" onClick={() => (setIndex((i) => Math.max(0, i - 1)), setSelectedId(null))} disabled={index === 0}>
                <ChevronLeft />
              </ToolbarBtn>
              <ToolbarBtn label="Next spread" onClick={() => (setIndex((i) => Math.min(spreads.length - 1, i + 1)), setSelectedId(null))} disabled={index >= spreads.length - 1}>
                <ChevronRight />
              </ToolbarBtn>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && addEl({ ...selected, x: Math.min(selected.x + 2, 90), y: Math.min(selected.y + 2, 90) })}
                className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-ink-2 hover:bg-sunken disabled:opacity-40"
              >
                <Copy className="size-3.5" /> Duplicate
              </button>
            </div>
          </div>

          <div className="scroll-thin grid min-h-0 flex-1 place-items-center overflow-auto p-6" onPointerDown={() => (setSelectedId(null), setEditingText(null))}>
            {spread ? (
              <div style={{ width: `${Math.min(100, 92 * zoom)}%`, maxWidth: 1400 * zoom }}>
                <div
                  ref={canvasRef}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="relative bg-[#fbfaf7] shadow-[0_20px_50px_rgba(0,0,0,0.18)] [container-type:inline-size]"
                  style={{ aspectRatio: SPREAD_RATIO }}
                >
                  {/* gutter */}
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.07] to-transparent" />
                  {guidesOn && (
                    <div className="pointer-events-none absolute inset-[4%_4%_8%_4%] border border-dashed border-accent/15" />
                  )}
                  {spread.elements.map((el) => {
                    const isSel = el.id === selectedId;
                    return (
                      <div
                        key={el.id}
                        onPointerDown={(e) => startDrag(e, el, "move")}
                        onDoubleClick={() => el.type !== "photo" && el.type !== "widget" && setEditingText(el.id)}
                        className={cn("absolute touch-none select-none", isSel ? "z-10 outline-2 outline-offset-2 outline-accent" : "hover:outline hover:outline-1 hover:outline-accent/50", drag?.id === el.id ? "cursor-grabbing" : "cursor-grab")}
                        style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` }}
                      >
                        {editingText === el.id ? (
                          <textarea
                            autoFocus
                            defaultValue={el.text}
                            onPointerDown={(e) => e.stopPropagation()}
                            onBlur={(e) => (updateEl(el.id, { text: e.target.value }), setEditingText(null))}
                            className="size-full resize-none bg-white/90 p-1 text-[13px] outline-none"
                          />
                        ) : (
                          <ElementView el={el} asset={el.assetId ? byId.get(el.assetId) : undefined} />
                        )}
                        {isSel && (
                          <>
                            {selectedPx && (
                              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white">
                                {selectedPx.w} × {selectedPx.h}
                              </span>
                            )}
                            {RESIZE_HANDLES.map((h) => (
                              <span
                                key={h.key}
                                role="presentation"
                                aria-label="Resize"
                                onPointerDown={(e) => startDrag(e, el, "resize", h.dir)}
                                className={cn("absolute z-20 rounded-sm border-2 border-accent bg-white shadow-sm", h.className)}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {guides.v.map((x) => (
                    <div key={`v${x}`} className="pointer-events-none absolute inset-y-0 w-px bg-accent" style={{ left: `${x}%` }} />
                  ))}
                  {guides.h.map((y) => (
                    <div key={`h${y}`} className="pointer-events-none absolute inset-x-0 h-px bg-accent" style={{ top: `${y}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-muted">No spreads yet. Add a section in the storyboard first.</p>
            )}
          </div>

          {/* Page strip */}
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-white/60 bg-white/60 px-3 py-2">
            {spreads.map((sp, i) => (
              <button key={sp.id} type="button" onClick={() => (setIndex(i), setSelectedId(null))} className="shrink-0 text-center">
                <SpreadView mini spread={sp} byId={byId} className={cn("w-[112px] rounded-sm ring-1", i === index ? "ring-2 ring-accent" : "ring-line")} />
                <span className={cn("mt-1 block text-[10.5px]", i === index ? "font-semibold text-accent" : "text-muted")}>
                  {i * 2 + 2}–{i * 2 + 3}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                commit((all) => [...all.slice(0, index + 1), { id: `spread-${uid()}`, sectionId: spread?.sectionId, elements: [] }, ...all.slice(index + 1)]);
                setIndex(index + 1);
              }}
              className="grid h-[70px] w-[90px] shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-[11px] font-medium text-accent hover:bg-accent-soft/40"
            >
              <span>
                <Plus className="mx-auto size-4" /> Add page
              </span>
            </button>
          </div>
        </main>

        {/* Inspector */}
        <aside className="glass scroll-thin m-3 ml-0 min-h-0 overflow-y-auto p-4 max-lg:hidden">
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1">
            {(["element", "page", "layout"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setInspectorTab(t)}
                className={cn("h-7 rounded-lg text-[12px] font-medium capitalize", inspectorTab === t ? "bg-surface text-accent shadow-[var(--shadow-soft)]" : "text-muted")}
              >
                {t}
              </button>
            ))}
          </div>
          {inspectorTab === "element" &&
            (selected ? (
              <ElementInspector el={selected} byId={byId} sectionPhotos={sectionPhotos} places={places} onChange={(p) => updateEl(selected.id, p)} onDelete={() => removeEl(selected.id)} />
            ) : (
              <p className="text-[12.5px] text-muted">Select something on the page to edit it. Double-click text to type directly.</p>
            ))}
          {inspectorTab === "page" && spread && (
            <div className="space-y-4">
              <label className="block">
                <span className="label mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="size-3.5" /> Page notes
                </span>
                <textarea
                  rows={6}
                  defaultValue={spread.notes}
                  key={spread.id}
                  onBlur={(e) => updateSpread((sp) => ({ ...sp, notes: e.target.value }))}
                  className="field resize-none"
                  placeholder="Reminders for yourself or co-editors — not printed."
                />
              </label>
              <Button
                variant="danger"
                className="w-full"
                disabled={spreads.length <= 1}
                onClick={() => (commit((all) => all.filter((_, i) => i !== index)), setIndex((i) => Math.max(0, i - 1)))}
              >
                <Trash2 className="size-4" /> Delete this spread
              </Button>
            </div>
          )}
          {inspectorTab === "layout" && spread && (
            <LayoutPresets
              photos={sectionPhotos}
              current={spread.elements}
              section={section}
              onApply={(elements) => updateSpread((sp) => ({ ...sp, elements }))}
            />
          )}
        </aside>
      </div>

      <footer className="glass mx-3 mb-3 flex shrink-0 items-center gap-3 !rounded-[18px] px-4 py-2">
        <Link href={`/stories/${story.id}/storyboard`} className="flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-ink">
          <ChevronLeft className="size-4" /> Back to storyboard
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInspectorTab("page")}>
            <NotebookPen className="size-4" /> Notes
          </Button>
          <Button variant="ink" size="sm" onClick={() => setPreview(true)}>
            Preview this spread <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </footer>

      {preview && spread && (
        <Modal title={section?.title ?? "Preview"} description={`Spread ${index + 1} of ${spreads.length}`} onClose={() => setPreview(false)} width="max-w-6xl">
          <SpreadView spread={spread} byId={byId} className="w-full rounded shadow-[var(--shadow-lift)]" />
          <div className="mt-4 flex justify-between">
            <Button disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button disabled={index >= spreads.length - 1} onClick={() => setIndex((i) => i + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ToolbarBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid size-7 place-items-center rounded-md text-ink-2 hover:bg-sunken disabled:opacity-30 [&>svg]:size-4">
      {children}
    </button>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-ink-2 hover:bg-sunken" aria-pressed={on}>
      {label}
      <span className={cn("relative h-4 w-7 rounded-full transition", on ? "bg-accent" : "bg-line-strong")}>
        <span className={cn("absolute top-0.5 size-3 rounded-full bg-white transition", on ? "left-3.5" : "left-0.5")} />
      </span>
    </button>
  );
}

function ElementInspector({
  el,
  byId,
  sectionPhotos,
  places,
  onChange,
  onDelete,
}: {
  el: SpreadElement;
  byId: Map<string, Asset>;
  sectionPhotos: Asset[];
  places: Place[];
  onChange: (p: Partial<SpreadElement>) => void;
  onDelete: () => void;
}) {
  const title = { photo: "Photo", heading: "Heading", text: "Text", quote: "Quote", widget: "Widget" }[el.type];
  const settings = el.widget?.settings ?? {};
  const patchW = (p: Record<string, unknown>) => el.widget && onChange({ widget: { ...el.widget, settings: { ...settings, ...p } } });
  const setW = (k: string, v: unknown) => patchW({ [k]: v });
  // Trip places first: ones tagged on this section's photos, then the rest of the project.
  const used = new Set(sectionPhotos.map((a) => a.placeId));
  const tripPlaces = [...places].sort((a, b) => Number(used.has(b.id)) - Number(used.has(a.id))).slice(0, 8);
  return (
    <div className="space-y-5">
      <div className="text-[14px] font-semibold">{el.type === "widget" ? `${WIDGET_TYPES.find((w) => w.type === el.widget?.type)?.label} widget` : title}</div>

      {el.type === "photo" && (
        <>
          {el.assetId && byId.get(el.assetId) && <img src={byId.get(el.assetId)!.thumbUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />}
          <div>
            <span className="label mb-1.5 block">Swap photo</span>
            <div className="grid grid-cols-4 gap-1">
              {sectionPhotos.map((a) => (
                <button key={a.id} type="button" onClick={() => onChange({ assetId: a.id })} className={cn("aspect-square overflow-hidden rounded", a.id === el.assetId && "ring-2 ring-accent")}>
                  <img src={a.thumbUrl} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {(el.type === "heading" || el.type === "text" || el.type === "quote") && (
        <label className="block">
          <span className="label mb-1.5 block">Text</span>
          <textarea key={el.id} rows={el.type === "text" ? 7 : 3} defaultValue={el.text} onBlur={(e) => onChange({ text: e.target.value })} className="field resize-none" />
        </label>
      )}

      {el.type === "widget" && el.widget && (
        <>
          {el.widget.type === "map" ? (
            <MapInspector key={el.id} settings={settings} onPatch={patchW} places={tripPlaces} />
          ) : (
            <div className="h-24 rounded-xl bg-gradient-to-br from-sky-100 to-amber-50 p-3">
              <WidgetView type={el.widget.type} settings={settings} />
            </div>
          )}
          {el.widget.type === "weather" && (
            <label className="block">
              <span className="label mb-1.5 block">Destination</span>
              <input className="field" defaultValue={String(settings.placeName ?? "")} placeholder="Santorini, Greece" onBlur={(e) => setW("placeName", e.target.value)} />
            </label>
          )}
          {el.widget.type === "quote" && (
            <label className="block">
              <span className="label mb-1.5 block">Quote</span>
              <textarea className="field resize-none" rows={3} defaultValue={String(settings.text ?? "")} onBlur={(e) => setW("text", e.target.value)} />
            </label>
          )}
          <div>
            <span className="label mb-1.5 block">Style</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["minimal", "glass", "bold", "photo"] as WidgetStyle[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setW("style", s)}
                  className={cn("rounded-lg border p-1 text-[10px] capitalize", (settings.style ?? "minimal") === s ? "border-accent ring-2 ring-accent-soft" : "border-line")}
                >
                  <div className="mb-1 h-7">
                    <StyleSwatch style={s} />
                  </div>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {el.widget.type === "weather" && (
          <div>
            <span className="label mb-1.5 block">Show elements</span>
            {(
              [
                ["showLocation", "Location name"],
                ["showDescription", "Condition text"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-1 text-[12.5px]">
                {label}
                <input type="checkbox" className="accent-[var(--color-accent)]" checked={settings[k] !== false} onChange={(e) => setW(k, e.target.checked)} />
              </label>
            ))}
          </div>
          )}
        </>
      )}

      {(el.type === "photo" || el.type === "widget") && (
        <div>
          <span className="label mb-1.5 block">Corner style</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(["default", "rounded", "square"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ style: { ...el.style, corner: c } })}
                className={cn("h-8 rounded-lg border text-[11.5px] capitalize", (el.style?.corner ?? "default") === c ? "border-accent bg-accent-soft/50 text-accent" : "border-line")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11.5px] text-muted">
        <span>X {el.x.toFixed(0)}%</span>
        <span>Y {el.y.toFixed(0)}%</span>
        <span>W {el.w.toFixed(0)}%</span>
        <span>H {el.h.toFixed(0)}%</span>
      </div>

      <Button variant="danger" className="w-full" onClick={onDelete}>
        <Trash2 className="size-4" /> Delete element
      </Button>
    </div>
  );
}

type PresetEl = Omit<SpreadElement, "id">;
type Rect = { x: number; y: number; w: number; h: number };

// Layout geometry, in % of the full spread. Horizontal % are scaled by SPREAD_RATIO
// so margins and gaps look equal on both axes.
const MX = 4;
const MY = MX * SPREAD_RATIO;
const GX = 1.6;
const GY = GX * SPREAD_RATIO;
const LEFT: Rect = { x: MX, y: MY, w: 50 - 2 * MX, h: 100 - 2 * MY };
const RIGHT: Rect = { ...LEFT, x: 50 + MX };
const SPREAD: Rect = { x: MX, y: MY, w: 100 - 2 * MX, h: 100 - 2 * MY };

/** Split a rect into an evenly gapped cols × rows grid, row by row. */
function cells(r: Rect, cols: number, rows: number): Rect[] {
  const w = (r.w - GX * (cols - 1)) / cols;
  const h = (r.h - GY * (rows - 1)) / rows;
  return Array.from({ length: cols * rows }, (_, i) => ({
    x: r.x + (i % cols) * (w + GX),
    y: r.y + Math.floor(i / cols) * (h + GY),
    w,
    h,
  }));
}

type PresetGroup = { title: string; presets: { name: string; build: () => PresetEl[] }[] };

function LayoutPresets({
  photos,
  current,
  section,
  onApply,
}: {
  photos: Asset[];
  current: SpreadElement[];
  section?: StorySection;
  onApply: (els: SpreadElement[]) => void;
}) {
  // Photos already on this spread come first, so switching layouts keeps your picks.
  const order = [
    ...current.flatMap((e) => (e.type === "photo" && e.assetId ? [e.assetId] : [])),
    ...photos.map((a) => a.id),
  ].filter((id, i, all) => all.indexOf(id) === i);
  const p = (i: number) => order[i];
  const heading = section?.title ?? "Title";
  const body = section?.summary ?? "";
  const square = { corner: "square" as const };
  const photosIn = (rects: Rect[], from = 0, style?: SpreadElement["style"]): PresetEl[] =>
    rects.map((r, i) => ({ type: "photo", assetId: p(from + i), ...r, style }));

  const groups: PresetGroup[] = [
    {
      title: "Full spread",
      presets: [
        { name: "Panorama", build: () => photosIn([{ x: 0, y: 0, w: 100, h: 100 }], 0, square) },
        { name: "Panorama, framed", build: () => photosIn([SPREAD]) },
        {
          name: "Panorama + caption",
          build: () => [
            ...photosIn([{ x: 0, y: 0, w: 100, h: 74 }], 0, square),
            { type: "heading", text: heading, x: MX, y: 79, w: 40, h: 10 },
            { type: "text", text: body, x: 50 + MX, y: 79, w: 50 - 2 * MX, h: 16 },
          ],
        },
      ],
    },
    {
      title: "Photos per page",
      presets: [
        { name: "One per page", build: () => photosIn([{ x: 0, y: 0, w: 50, h: 100 }, { x: 50, y: 0, w: 50, h: 100 }], 0, square) },
        { name: "One per page, framed", build: () => photosIn([LEFT, RIGHT]) },
        { name: "Two per page, stacked", build: () => photosIn([...cells(LEFT, 1, 2), ...cells(RIGHT, 1, 2)]) },
        { name: "Two per page, side by side", build: () => photosIn([...cells(LEFT, 2, 1), ...cells(RIGHT, 2, 1)]) },
        { name: "Hero + four", build: () => photosIn([{ x: 0, y: 0, w: 50, h: 100 }], 0, square).concat(photosIn(cells(RIGHT, 2, 2), 1)) },
        {
          name: "Mosaic",
          build: () => {
            const [top, ...bottom] = cells(RIGHT, 1, 2);
            return photosIn([LEFT, top, ...cells(bottom[0], 2, 1)]);
          },
        },
      ],
    },
    {
      title: "Grids",
      presets: [
        { name: "Grid of four", build: () => photosIn(cells(SPREAD, 2, 2)) },
        {
          name: "Grid of six",
          build: () => [
            { type: "heading", text: heading, x: 4, y: 6, w: 40, h: 10 },
            ...photosIn(cells({ x: MX, y: 20, w: 100 - 2 * MX, h: 100 - 20 - MY }, 3, 2)),
          ],
        },
        { name: "Grid of eight", build: () => photosIn([...cells(LEFT, 2, 2), ...cells(RIGHT, 2, 2)]) },
        { name: "Contact sheet", build: () => photosIn([...cells(LEFT, 3, 3), ...cells(RIGHT, 3, 3)]) },
      ],
    },
    {
      title: "Photos & words",
      presets: [
        {
          name: "Big photo",
          build: () => [
            ...photosIn([{ x: 0, y: 0, w: 50, h: 100 }], 0, square),
            { type: "heading", text: heading, x: 56, y: 12, w: 36, h: 16 },
            { type: "text", text: body, x: 56, y: 32, w: 32, h: 24 },
            ...photosIn([{ x: 56, y: 60, w: 38, h: 32 }], 1),
          ],
        },
        {
          name: "Photo + story",
          build: () => [
            ...photosIn([{ x: 0, y: 0, w: 50, h: 100 }], 0, square),
            { type: "heading", text: heading, x: 50 + 8, y: 26, w: 34, h: 14 },
            { type: "text", text: body, x: 50 + 8, y: 44, w: 34, h: 32 },
          ],
        },
        {
          name: "Story & collage",
          build: () => [
            { type: "heading", text: heading, x: 5, y: 10, w: 38, h: 14 },
            { type: "text", text: body, x: 5, y: 30, w: 36, h: 30 },
            { type: "quote", text: "The best moments happened in between the plans.", x: 5, y: 66, w: 36, h: 20 },
            ...photosIn([{ x: 54, y: 6, w: 42, h: 44 }, { x: 54, y: 53, w: 20, h: 40 }, { x: 76, y: 53, w: 20, h: 40 }]),
          ],
        },
      ],
    },
  ];

  const apply = (els: PresetEl[]) => onApply(els.map((e) => ({ ...e, id: uid() })));

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted">Start from a layout — you can still move everything afterwards. Photos already on this spread are kept.</p>

      <button
        type="button"
        onClick={() => apply([])}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong p-3 text-left hover:border-accent-line"
      >
        <Shapes className="size-5 shrink-0 text-accent" />
        <span>
          <span className="block text-[12.5px] font-medium">Freestyle</span>
          <span className="block text-[11.5px] text-muted">Blank spread — drag in photos, text and widgets and place them anywhere.</span>
        </span>
      </button>

      {groups.map((g) => (
        <div key={g.title}>
          <span className="label mb-1.5 block">{g.title}</span>
          <div className="grid grid-cols-2 gap-2">
            {g.presets.map((pr) => (
              <button
                key={pr.name}
                type="button"
                onClick={() => apply(pr.build())}
                className="rounded-xl border border-line p-1.5 text-left hover:border-accent-line"
              >
                <div className="relative w-full overflow-hidden rounded bg-[#fbfaf7] ring-1 ring-line" style={{ aspectRatio: SPREAD_RATIO }}>
                  <div className="absolute inset-y-0 left-1/2 w-px bg-black/10" />
                  {pr.build().map((e, i) => (
                    <div
                      key={i}
                      className={cn("absolute rounded-[1px]", e.type === "photo" ? "bg-line-strong" : "bg-accent/25")}
                      style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.type === "photo" ? e.h : Math.min(e.h, 6)}%` }}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[11.5px] font-medium leading-tight">{pr.name}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
