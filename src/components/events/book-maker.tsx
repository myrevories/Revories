"use client";

import { useState, useTransition } from "react";
import { BookOpen, CalendarDays, ChevronDown, ChevronRight, Home, LayoutGrid, Lightbulb, List, MapPin, MoreHorizontal, Pencil, Plus, Sun, Trash2, Users, UsersRound, X } from "lucide-react";
import { createBookFromMomentsAction, updateEventAction } from "@/app/actions";
import { Modal } from "@/components/modal";
import { SaveIndicator } from "@/components/assets/asset-details";
import type { Asset, Event } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface Moment {
  id: string;
  title: string;
  assetIds: string[];
}

const IDEAS = ["Welcome & Arrival", "Life on the Dock", "Good Food, Great Company", "Kids Growing Up", "Sunset Reflections"];

/**
 * Book Maker: group an event's memories into "moments" (future book
 * sections), with notes, key details and page ideas alongside.
 */
export function BookMaker({
  projectId,
  event,
  pool,
  initialMoments,
  details,
  artifacts,
}: {
  projectId: string;
  event: Event;
  pool: Asset[];
  initialMoments: Moment[];
  details: [string, string][];
  artifacts: Asset[];
}) {
  const byId = new Map(pool.map((a) => [a.id, a]));
  const [moments, setMoments] = useState(initialMoments);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const [notes, setNotes] = useState(event.description ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [drag, setDrag] = useState<{ id: string; from: string } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const used = new Set(moments.flatMap((m) => m.assetIds));
  const total = used.size;
  // Called from event handlers only.
  function touch() {
    setSavedAt(new Date().getTime());
  }
  const update = (fn: (m: Moment[]) => Moment[]) => (setMoments(fn), touch());

  function move(assetId: string, from: string, to: string) {
    if (from === to) return;
    update((ms) => ms.map((m) => (m.id === from ? { ...m, assetIds: m.assetIds.filter((x) => x !== assetId) } : m.id === to ? { ...m, assetIds: [...m.assetIds, assetId] } : m)));
  }
  const addMoment = (title = "New moment") => update((ms) => [...ms, { id: `m-${crypto.randomUUID().slice(0, 6)}`, title, assetIds: [] }]);

  const DetailIcon = [CalendarDays, MapPin, Sun, Users, Home, UsersRound];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-[1.02] font-medium text-ink">Book Maker</h1>
          <p className="mt-1 text-[14px] text-ink-2">Turn these memories into a beautiful family story.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SaveIndicator pending={pending} savedAt={savedAt} idle="Saved automatically" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview(true)} className="flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-5 text-[13px] text-ink-2 shadow-[var(--shadow-soft)] hover:text-ink">
              <BookOpen className="size-4" /> Preview Book
            </button>
            <button
              type="button"
              disabled={pending || !total}
              onClick={() =>
                start(() =>
                  createBookFromMomentsAction({
                    projectId,
                    title: `${event.name} Book`,
                    moments: moments.filter((m) => m.assetIds.length).map((m) => ({ title: m.title, assetIds: m.assetIds })),
                  }),
                )
              }
              className="flex h-11 items-center rounded-lg bg-gradient-to-b from-accent-2 to-accent px-7 text-[13px] font-medium text-white shadow-[0_2px_6px_rgb(124_92_240/0.3)] hover:brightness-110 disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create Book"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_330px]">
        {/* Moments */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[22px] font-medium text-ink">Selected Memories ({total})</h2>
              <p className="text-[11.5px] text-ink-2">Drag to reorder, group into moments, and build your pages.</p>
            </div>
            <label className="block">
              <span className="mb-0.5 block text-[10.5px] text-ink-2">Sort by</span>
              <select className="h-9 rounded-lg border border-line bg-surface px-3 text-[12px] text-ink-2">
                <option>Custom Order</option>
              </select>
            </label>
            <div className="mt-4 flex rounded-lg border border-line p-0.5">
              <button type="button" aria-label="Large thumbnails" onClick={() => setCompact(false)} className={cn("grid size-8 place-items-center rounded-md", !compact ? "bg-gradient-to-b from-accent-2 to-accent text-white" : "text-ink-2")}>
                <List className="size-4" />
              </button>
              <button type="button" aria-label="Compact" onClick={() => setCompact(true)} className={cn("grid size-8 place-items-center rounded-md", compact ? "bg-gradient-to-b from-accent-2 to-accent text-white" : "text-ink-2")}>
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {moments.map((m, i) => {
              const closed = collapsed.includes(m.id);
              return (
                <div
                  key={m.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => drag && (move(drag.id, drag.from, m.id), setDrag(null))}
                  className={cn("rounded-xl border border-line bg-field/70 p-3 transition", drag && drag.from !== m.id && "border-accent/40 bg-accent-soft/40")}
                >
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={closed ? "Expand" : "Collapse"} onClick={() => setCollapsed((c) => (closed ? c.filter((x) => x !== m.id) : [...c, m.id]))} className="text-accent">
                      {closed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4 fill-current" />}
                    </button>
                    <span className="font-serif text-[16px] text-ink">{i + 1}.</span>
                    <input
                      value={m.title}
                      onChange={(e) => update((ms) => ms.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))}
                      className="min-w-0 bg-transparent font-serif text-[16px] text-ink outline-none"
                      style={{ width: `${Math.max(m.title.length, 6) + 1}ch` }}
                      aria-label="Moment name"
                    />
                    <span className="text-[11px] text-muted">({m.assetIds.length} photos)</span>
                    <button type="button" aria-label="Remove moment" onClick={() => update((ms) => ms.filter((x) => x.id !== m.id))} className="ml-auto grid size-8 place-items-center rounded-lg border border-line bg-surface text-ink-2 hover:text-danger">
                      {m.assetIds.length ? <MoreHorizontal className="size-4" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                  {!closed && (
                    <div className={cn("mt-2.5 grid gap-2", compact ? "grid-cols-6" : "grid-cols-4")}>
                      {m.assetIds.map((id) => {
                        const a = byId.get(id);
                        return (
                          <div key={id} draggable onDragStart={() => setDrag({ id, from: m.id })} className="group relative aspect-[16/10] cursor-grab overflow-hidden rounded-md bg-sunken">
                            {a && <img src={a.thumbUrl} alt="" className="size-full object-cover" draggable={false} />}
                            <button
                              type="button"
                              aria-label="Remove from moment"
                              onClick={() => update((ms) => ms.map((x) => (x.id === m.id ? { ...x, assetIds: x.assetIds.filter((y) => y !== id) } : x)))}
                              className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                      <button type="button" onClick={() => setAdding(m.id)} className="grid aspect-[16/10] place-items-center rounded-md border border-dashed border-line-strong bg-surface text-ink-2 hover:border-accent hover:text-accent">
                        <Plus className="size-5" strokeWidth={1.5} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => addMoment()} className="flex w-full items-center justify-center gap-1.5 py-2 text-[12px] text-ink-2 hover:text-accent">
              <Plus className="size-3.5" /> Add a new moment
            </button>
          </div>
        </section>

        {/* Side panel */}
        <aside className="space-y-3">
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-medium text-ink">Event Notes</h3>
              <button
                type="button"
                onClick={() => {
                  if (editingNotes) start(async () => (await updateEventAction(event.id, { description: notes }), touch()));
                  setEditingNotes((e) => !e);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[11.5px] text-ink-2 hover:text-ink"
              >
                <Pencil className="size-3" /> {editingNotes ? "Done" : "Edit"}
              </button>
            </div>
            {editingNotes ? (
              <textarea autoFocus rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className="field mt-2 resize-none text-[12.5px]" />
            ) : (
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{notes || "Add a few lines about this event — what made it special?"}</p>
            )}
            <h3 className="mt-5 font-serif text-[18px] font-medium text-ink">Key Details</h3>
            <ul className="mt-2 space-y-2 text-[12.5px] text-ink-2">
              {details.map(([, text], i) => {
                const Icon = DetailIcon[i] ?? CalendarDays;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <Icon className={cn("size-[18px]", i === 2 ? "text-[#e9a23b]" : "text-iconblue")} /> {text}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-medium text-ink">Artifacts for This Event</h3>
              <a href={`/projects/${projectId}/uploads`} className="flex h-8 items-center gap-1 rounded-lg border border-line px-3 text-[11.5px] text-ink-2 hover:text-ink">
                <Plus className="size-3" /> Add
              </a>
            </div>
            <ul className="mt-3 space-y-2.5">
              {artifacts.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <img src={a.thumbUrl} alt="" className="h-12 w-[72px] rounded-md object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-ink">{a.caption ?? a.filename}</span>
                    <span className="block truncate text-[11px] text-muted">{a.filename}</span>
                  </span>
                </li>
              ))}
              {!artifacts.length && <li className="text-[12px] text-muted">Scans of tickets, shirts, signs and letters will show up here.</li>}
            </ul>
          </section>

          <section className="rounded-2xl border border-accent/15 bg-accent-soft/70 p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-5 text-[#9bb23a]" />
              <h3 className="flex-1 font-serif text-[17px] font-medium text-ink">Page Ideas</h3>
              <ChevronRight className="size-4 text-ink-2" />
            </div>
            <ul className="mt-2 space-y-1 text-[12.5px] text-ink-2">
              {IDEAS.map((idea) => (
                <li key={idea}>
                  <button type="button" onClick={() => addMoment(idea)} className="flex items-center gap-2 hover:text-accent">
                    <span className="size-1 rounded-full bg-current" /> {idea}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <p className="font-script text-[24px] leading-tight text-[#3a4a6b]">
          Use selected memories to
          <br />
          build a cohesive spread. →
        </p>
        <div className="h-[110px] w-[200px] overflow-hidden rounded-lg shadow-[var(--shadow-lift)]">
          <img src="/home/hero.jpg" alt="" className="h-full w-full object-cover object-[60%_45%]" />
        </div>
      </div>

      {adding && (
        <Modal title="Add photos to this moment" description="Pick from this event’s memories." onClose={() => setAdding(null)} width="max-w-2xl">
          <div className="grid grid-cols-4 gap-2">
            {pool.map((a) => {
              const inThis = moments.find((m) => m.id === adding)?.assetIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    update((ms) =>
                      ms.map((m) => (m.id === adding ? { ...m, assetIds: inThis ? m.assetIds.filter((x) => x !== a.id) : [...m.assetIds, a.id] } : { ...m, assetIds: m.assetIds.filter((x) => x !== a.id) })),
                    )
                  }
                  className={cn("relative aspect-[4/3] overflow-hidden rounded-md", inThis ? "ring-2 ring-accent ring-offset-2" : used.has(a.id) && "opacity-50")}
                >
                  <img src={a.thumbUrl} alt="" className="size-full object-cover" />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title={`${event.name} — preview`} description="One spread per moment. You’ll fine-tune layouts in the book studio." onClose={() => setPreview(false)} width="max-w-4xl">
          <div className="space-y-6">
            {moments
              .filter((m) => m.assetIds.length)
              .map((m, i) => (
                <div key={m.id} className="grid aspect-[16/7] grid-cols-2 gap-1 rounded-md bg-[#fbfaf7] p-4 shadow-[var(--shadow-lift)]">
                  <div className="flex flex-col justify-center pr-6">
                    <div className="text-[10px] tracking-[0.2em] text-muted uppercase">Chapter {i + 1}</div>
                    <div className="font-serif text-[30px] leading-tight text-ink">{m.title}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {m.assetIds.slice(0, 4).map((id) => (
                      <img key={id} src={byId.get(id)?.thumbUrl} alt="" className="size-full rounded-sm object-cover" />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
