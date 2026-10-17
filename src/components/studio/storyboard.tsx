"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  GripVertical,
  Images,
  LayoutGrid,
  ListOrdered,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Rows3,
  Sparkles,
  ThumbsUp,
  Trash2,
  User,
  Wand2,
  X,
} from "lucide-react";
import { saveSectionsAction, updateStoryDetailsAction } from "@/app/actions";
import { Modal } from "@/components/modal";
import { MiniMap } from "@/components/places/mini-map";
import { BookCover3D } from "@/components/studio/book-cover";
import { coverOf, sizeOf, styleOf } from "@/lib/book-options";
import type { Asset, Place, Story, StorySection } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";

const CHAPTER_IDEAS = ["Getting There", "Our Stay", "Exploring the Islands", "Local Food & Culture", "People We Met", "Tips for Our Next Visit"];
const uid = () => `sec-${crypto.randomUUID().slice(0, 8)}`;
type AutoKind = "sections" | "best" | "date" | "location";

function StorySidebar({
  story,
  projectId,
  count,
  onAuto,
  onAdd,
}: {
  story: Story & { coverUrl?: string };
  projectId: string;
  count: { photos: number; videos: number };
  onAuto: (k: AutoKind) => void;
  onAdd: () => void;
}) {
  const [bookOpen, setBookOpen] = useState(true);
  const base = `/projects/${projectId}`;
  const link = "flex h-10 items-center gap-3.5 rounded-xl px-3 text-[14px] text-ink-2 hover:bg-white/50 hover:text-ink [&_svg]:size-[19px] [&_svg]:stroke-[1.6]";
  return (
    <aside className="glass flex flex-col p-4">
      <Link href={base} className="flex items-center gap-2 px-2 py-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> Back to Project
      </Link>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/50 p-2">
        <span className="size-[72px] shrink-0 overflow-hidden rounded-[14px] bg-sunken">{story.coverUrl && <img src={story.coverUrl} alt="" className="size-full object-cover" />}</span>
        <span className="min-w-0">
          <span className="block font-display text-[18px] leading-[1.1] text-ink">{story.title}</span>
          {story.details?.dateLabel && <span className="mt-1 block text-[11px] text-ink-2">{story.details.dateLabel.replace(/June/g, "Jun")}</span>}
          <span className="block text-[11px] text-muted">
            {count.photos} photos • {count.videos} videos
          </span>
        </span>
      </div>
      <nav className="mt-4 space-y-0.5">
        <Link href={base} className={link}>
          <LayoutGrid /> Overview
        </Link>
        <Link href={`${base}/uploads`} className={link}>
          <Images /> Photos &amp; Videos
        </Link>
        <Link href={`${base}/people`} className={link}>
          <User /> People
        </Link>
        <Link href={`${base}/places`} className={link}>
          <MapPin /> Places
        </Link>
        <Link href={`${base}/stories`} className={link}>
          <ListOrdered /> Stories
        </Link>
        <div className="mt-2 border-t border-ink/10 pt-2">
          <button type="button" onClick={() => setBookOpen((o) => !o)} className={cn(link, "w-full text-ink")}>
            <BookOpen /> <span className="flex-1 text-left">Book</span> <ChevronDown className={cn("!size-4 transition", !bookOpen && "-rotate-90")} />
          </button>
        </div>
        {bookOpen && (
          <div className="ml-5 space-y-0.5 border-l border-ink/10 pl-3">
            <span className="flex h-10 items-center rounded-xl bg-accent-soft/90 px-3 text-[13.5px] font-medium text-accent">Storyboard</span>
            <Link href={`/stories/${story.id}/editor`} className="flex h-9 items-center rounded-xl px-3 text-[13.5px] text-ink-2 hover:bg-white/50">
              Design &amp; Edit
            </Link>
            <Link href={`/stories/${story.id}/editor?preview=1`} className="flex h-9 items-center rounded-xl px-3 text-[13.5px] text-ink-2 hover:bg-white/50">
              Preview
            </Link>
            <Link href={`/stories/${story.id}/publish`} className="flex h-9 items-center rounded-xl px-3 text-[13.5px] text-ink-2 hover:bg-white/50">
              Print &amp; Publish
            </Link>
          </div>
        )}
      </nav>
      <button type="button" onClick={onAdd} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-ink/80 text-[14.5px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-ink">
        <Plus className="size-5" /> Add to Book
      </button>
      <div className="mt-5 rounded-2xl bg-white/40 p-3">
        <div className="px-1 text-[10px] font-medium tracking-[0.24em] text-muted uppercase">Auto-suggest</div>
        {(
          [
            ["sections", <Wand2 key="w" />, "Create sections for me"],
            ["best", <Sparkles key="s" />, "Suggest best photos"],
            ["date", <CalendarDays key="d" />, "Order by date"],
            ["location", <MapPin key="l" />, "Group by location"],
          ] as const
        ).map(([k, icon, label]) => (
          <button key={k} type="button" onClick={() => onAuto(k)} className="mt-1 flex h-10 w-full items-center gap-3 rounded-xl px-2 text-left text-[13.5px] text-ink-2 hover:bg-white/60 hover:text-ink [&>svg]:size-[18px] [&>svg]:stroke-[1.6]">
            {icon}
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}

/**
 * Book Storyboard: plan the story section by section. Left: project + book
 * navigation and auto-suggest; center: sections; right: book details.
 */
export function Storyboard({
  story: initialStory,
  projectId,
  initialSections,
  assets,
  places,
}: {
  story: Story & { coverUrl?: string };
  projectId: string;
  initialSections: StorySection[];
  assets: Asset[];
  places: Place[];
}) {
  const router = useRouter();
  const [story, setStory] = useState(initialStory);
  const [sections, setSections] = useState(initialSections);
  const [saved, setSaved] = useState(initialSections);
  const [view, setView] = useState<"grid" | "timeline" | "map">("grid");
  const [picker, setPicker] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [notes, setNotes] = useState(story.details?.notes ?? "");
  const [preview, setPreview] = useState(false);
  const [, start] = useTransition();
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const photos = assets.filter((a) => a.kind === "photo");

  useEffect(() => {
    if (sections === saved) return;
    const t = setTimeout(
      () =>
        start(async () => {
          await saveSectionsAction(story.id, sections);
          setSaved(sections);
        }),
      700,
    );
    return () => clearTimeout(t);
  }, [sections, saved, story.id]);

  const patch = (id: string, p: Partial<StorySection>) => setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addSection = (title = "New section", assetIds: string[] = []) =>
    setSections((ss) => [...ss, { id: uid(), storyId: story.id, position: ss.length, title, subtitle: "", summary: "", layout: "full_width", assetIds }]);
  const estPages = Math.max(24, sections.length * 8);

  function auto(kind: AutoKind) {
    const dated = [...photos].sort((a, b) => (a.takenAt ?? "").localeCompare(b.takenAt ?? ""));
    if (kind === "sections") {
      // One section per day of photos, up to 8.
      const days = new Map<string, Asset[]>();
      dated.forEach((a) => days.set(a.takenAt ?? "undated", [...(days.get(a.takenAt ?? "undated") ?? []), a]));
      setSections(
        [...days.entries()].slice(0, 8).map(([day, list], i) => ({
          id: uid(),
          storyId: story.id,
          position: i,
          title: day === "undated" ? "More Moments" : `Day ${i + 1}`,
          subtitle: day === "undated" ? "" : formatTakenAt(day, "exact"),
          summary: "",
          layout: "grid",
          assetIds: list.map((a) => a.id),
        })),
      );
    } else if (kind === "best") {
      const ranked = [...photos].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || b.people.length - a.people.length);
      setSections((ss) => ss.map((s, i) => (s.assetIds.length >= 4 ? s : { ...s, assetIds: [...new Set([...s.assetIds, ...ranked.slice(i * 4, i * 4 + 4).map((a) => a.id)])] })));
    } else if (kind === "date") {
      setSections((ss) => ss.map((s) => ({ ...s, assetIds: [...s.assetIds].sort((a, b) => (byId.get(a)?.takenAt ?? "").localeCompare(byId.get(b)?.takenAt ?? "")) })));
    } else {
      const byPlace = new Map<string, Asset[]>();
      photos.forEach((a) => byPlace.set(a.placeId ?? "elsewhere", [...(byPlace.get(a.placeId ?? "elsewhere") ?? []), a]));
      setSections(
        [...byPlace.entries()].map(([pid, list], i) => ({
          id: uid(),
          storyId: story.id,
          position: i,
          title: places.find((p) => p.id === pid)?.name ?? "Along the Way",
          subtitle: places.find((p) => p.id === pid)?.address ?? "",
          summary: "",
          layout: "grid",
          assetIds: list.map((a) => a.id),
        })),
      );
    }
  }

  /** Draft narrative notes from the section titles (no AI service involved). */
  function suggestNotes() {
    const names = sections.map((s) => s.title.toLowerCase()).slice(0, 4);
    setNotes(`A story in ${sections.length} chapters — ${names.join(", ")}${sections.length > 4 ? ", and more" : ""}. The places we explored, the people we met, and the moments that made it so special.`);
  }

  const firstDate = (s: StorySection) => s.assetIds.map((id) => byId.get(id)?.takenAt).filter(Boolean).sort()[0];

  return (
    <div className="mx-3 mt-4 grid gap-4 lg:mx-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_360px]">
      <div className="hidden lg:block">
        <StorySidebar story={story} projectId={projectId} count={{ photos: photos.length, videos: assets.filter((a) => a.kind === "video").length }} onAuto={auto} onAdd={() => addSection()} />
      </div>

      {/* Center */}
      <main className="glass min-w-0 p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1">
            <p className="eyebrow-wide">Book storyboard</p>
            <h1 className="mt-3 font-display text-[clamp(34px,3.3vw,54px)] leading-none whitespace-nowrap text-ink">{story.title}</h1>
            <p className="mt-2 font-display text-[clamp(18px,1.6vw,24px)] text-ink">Turn your memories into a beautiful story.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Link href={`/stories/${story.id}/book`} className="glass-strong flex items-center gap-3 p-2 pr-3 text-left hover:bg-white">
              <span className="h-12 w-14 overflow-hidden rounded-md bg-sunken">{story.coverUrl && <img src={story.coverUrl} alt="" className="size-full object-cover" />}</span>
              <span>
                <span className="block text-[13.5px] text-ink">{story.title}</span>
                <span className="block text-[11px] text-ink-2">
                  {coverOf(story.details?.cover).name} • {sizeOf(story.details?.size).label}
                </span>
                <span className="block text-[11px] text-muted">Estimated {estPages} pages</span>
              </span>
              <ChevronRight className="size-4 text-ink-2" />
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPreview(true)} className="flex h-10 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 text-[13px] text-ink hover:bg-white">
                <Eye className="size-4" /> Preview Book
              </button>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    await saveSectionsAction(story.id, sections);
                    router.push(`/stories/${story.id}/editor`);
                  })
                }
                className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] text-white hover:bg-black"
              >
                Continue to Design <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-ink-2">
          Organize your photos into sections, add titles and notes, and create a natural flow. You can always reorder, add or remove sections, and let Revories suggest layouts when you’re ready.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/80 bg-white/50 p-1">
            {(
              [
                ["grid", <LayoutGrid key="g" />, "Grid View"],
                ["timeline", <Rows3 key="t" />, "Timeline View"],
                ["map", <MapPin key="m" />, "Map View"],
              ] as const
            ).map(([k, icon, label]) => (
              <button key={k} type="button" onClick={() => setView(k)} className={cn("flex h-9 items-center gap-2 rounded-full px-4 text-[13px] [&>svg]:size-4", view === k ? "bg-white text-ink shadow-sm" : "text-ink-2")}>
                {icon}
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => addSection()} className="ml-auto flex h-11 items-center gap-2 rounded-full bg-white/70 px-5 text-[13.5px] text-ink hover:bg-white">
            <Plus className="size-4" /> Add Section
          </button>
        </div>

        {view === "map" ? (
          <div className="mt-4 overflow-hidden rounded-2xl">
            <MiniMap pins={places.filter((p) => p.lat != null).map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, thumb: photos.find((a) => a.placeId === p.id)?.thumbUrl }))} className="h-[460px] w-full" />
          </div>
        ) : (
          <ol className={cn("mt-4 space-y-3", view === "timeline" && "border-l-2 border-accent-line pl-5")}>
            {sections.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === s.id) return;
                  setSections((ss) => {
                    const from = ss.findIndex((x) => x.id === dragId);
                    const next = [...ss];
                    const [m] = next.splice(from, 1);
                    next.splice(i, 0, m);
                    return next;
                  });
                  setDragId(null);
                }}
                className={cn("relative flex items-stretch gap-2", dragId === s.id && "opacity-50")}
              >
                {view === "timeline" && <span className="absolute top-6 -left-[27px] size-3 rounded-full border-2 border-white bg-accent" />}
                <span className="flex w-5 shrink-0 cursor-grab items-center text-ink-2/60">
                  <GripVertical className="size-4" />
                </span>
                <div className="glass-strong grid flex-1 gap-4 p-4 md:grid-cols-[minmax(200px,0.9fr)_minmax(0,1.4fr)_auto]">
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 bg-white text-[15px] text-ink">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <input value={s.title} onChange={(e) => patch(s.id, { title: e.target.value })} className="w-full min-w-0 bg-transparent font-display text-[19px] text-ink outline-none" aria-label="Section title" />
                        <Pencil className="size-3.5 shrink-0 text-ink-2" />
                      </div>
                      {view === "timeline" && firstDate(s) && <div className="text-[11px] text-accent">{formatTakenAt(firstDate(s), "exact")}</div>}
                      <input value={s.subtitle ?? ""} onChange={(e) => patch(s.id, { subtitle: e.target.value })} placeholder="Add a subtitle" className="w-full bg-transparent text-[12.5px] text-ink-2 outline-none placeholder:text-faint" />
                      <textarea value={s.summary ?? ""} onChange={(e) => patch(s.id, { summary: e.target.value })} rows={4} placeholder="What happens in this part of the story?" className="mt-1.5 w-full resize-none bg-transparent text-[12px] leading-snug text-ink-2 outline-none placeholder:text-faint" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {s.assetIds.slice(0, 4).map((id, k) => (
                      <div key={id} className="group relative aspect-[1/0.92] overflow-hidden rounded-[8px] bg-sunken">
                        {byId.get(id) && <img src={byId.get(id)!.thumbUrl} alt="" className="size-full object-cover" />}
                        {k === 3 && s.assetIds.length > 4 && (
                          <button type="button" onClick={() => setPicker(s.id)} className="absolute inset-0 grid place-items-center bg-black/45 text-[14px] font-medium text-white">
                            +{s.assetIds.length - 4}
                          </button>
                        )}
                        <button type="button" aria-label="Remove photo" onClick={() => patch(s.id, { assetIds: s.assetIds.filter((x) => x !== id) })} className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - s.assetIds.length) }).map((_, k) => (
                      <button key={k} type="button" onClick={() => setPicker(s.id)} className="grid aspect-[1/0.92] place-items-center rounded-[8px] border border-dashed border-ink/15 bg-white/40 text-ink-2/50 hover:bg-white/70 hover:text-accent" aria-label="Add photo">
                        <Plus className="size-4" />
                      </button>
                    ))}
                  </div>
                  <div className="flex w-[112px] flex-col items-stretch gap-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-ink-2">{s.assetIds.length} photos</span>
                      <div className="relative">
                        <button type="button" aria-label="Section options" onClick={() => setMenu(menu === s.id ? null : s.id)} className="text-ink-2">
                          <MoreHorizontal className="size-4" />
                        </button>
                        {menu === s.id && (
                          <div className="glass-strong animate-rise absolute top-full right-0 z-20 mt-1 w-40 p-1">
                            <button type="button" onClick={() => (setSections((ss) => ss.filter((x) => x.id !== s.id)), setMenu(null))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] text-danger hover:bg-danger-soft">
                              <Trash2 className="size-3.5" /> Delete section
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => setPicker(s.id)} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[12px] border border-accent-line bg-accent-soft/70 px-2 py-2 text-[12px] font-medium text-accent hover:bg-accent-soft">
                      <Images className="size-5" strokeWidth={1.6} />
                      Choose photos
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>

      {/* Right */}
      <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
        <Link href={`/stories/${story.id}/book`} className="block pt-2" aria-label="Change cover, size and style">
          <BookCover3D
            title={story.title}
            subtitle={story.subtitle}
            date={story.details?.dateLabel?.replace(/^(\w+) \d+.*?(\d{4})$/, "$1 $2")}
            photo={story.coverUrl}
            cover={story.details?.cover}
            style={story.details?.style}
            size={story.details?.size}
            maxSide={270}
          />
        </Link>
        <section className="glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[22px] text-ink">Book Details</h3>
            <button type="button" onClick={() => setEditingDetails(true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/70 px-3 text-[12px] text-ink hover:bg-white">
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 divide-y divide-ink/5 text-[12.5px]">
            {[
              ["Title", story.title],
              ["Subtitle", story.subtitle || "—"],
              ["Date", story.details?.dateLabel || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center py-2">
                <dt className="w-32 text-ink-2">{k}</dt>
                <dd className="flex-1 text-ink">{v}</dd>
              </div>
            ))}
            {[
              ["Cover", coverOf(story.details?.cover).name],
              ["Style", styleOf(story.details?.style).id],
              ["Size", `${sizeOf(story.details?.size).label} (${sizeOf(story.details?.size).shape})`],
              ["Estimated Pages", `${estPages} pages`],
            ].map(([k, v]) => (
              <Link key={k} href={`/stories/${story.id}/book`} className="-mx-2 flex items-center rounded-lg px-2 py-2 hover:bg-white/60">
                <dt className="w-32 text-ink-2">{k}</dt>
                <dd className="flex-1 text-ink">{v}</dd>
                <ChevronRight className="size-3.5 text-ink-2" />
              </Link>
            ))}
          </dl>
          <Link href={`/stories/${story.id}/book`} className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-white/70 text-[12.5px] text-ink hover:bg-white">
            <BookOpen className="size-4" /> Compare covers, sizes &amp; styles
          </Link>
        </section>
        <section className="glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[20px] text-ink">Narrative Notes</h3>
            <button type="button" onClick={suggestNotes} className="flex h-8 items-center gap-1.5 rounded-full bg-white/70 px-3 text-[12px] text-ink hover:bg-white">
              <Sparkles className="size-3.5" /> Suggest
            </button>
          </div>
          <textarea
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => start(() => updateStoryDetailsAction(story.id, { details: { notes } }))}
            rows={4}
            className="mt-3 w-full resize-none rounded-xl bg-white/70 p-3 text-[12.5px] leading-relaxed text-ink outline-none"
          />
          <div className="text-right text-[10.5px] text-muted">{notes.length}/500</div>
          <h3 className="mt-3 font-display text-[20px] text-ink">Chapter Suggestions</h3>
          <ul className="mt-2 divide-y divide-ink/5">
            {CHAPTER_IDEAS.filter((c) => !sections.some((s) => s.title === c)).map((c) => (
              <li key={c} className="flex items-center gap-3 py-2 text-[12.5px] text-ink">
                <ThumbsUp className="size-3.5 text-ink-2" />
                <span className="flex-1">{c}</span>
                <button type="button" aria-label={`Add ${c}`} onClick={() => addSection(c)} className="grid size-6 place-items-center rounded-full bg-white/80 text-ink hover:bg-accent-soft hover:text-accent">
                  <Plus className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {picker && (
        <Modal
          title={`Choose photos for “${sections.find((s) => s.id === picker)?.title ?? "this section"}”`}
          description="Tap photos to add or remove them. Your picks save automatically."
          onClose={() => setPicker(null)}
          width="max-w-3xl"
          footer={
            <>
              <span className="mr-auto text-[12.5px] text-ink-2">{sections.find((s) => s.id === picker)?.assetIds.length ?? 0} selected</span>
              <button type="button" onClick={() => setPicker(null)} className="flex h-10 items-center gap-2 rounded-full bg-ink px-6 text-[13px] text-white hover:bg-black">
                <Check className="size-4" /> Done
              </button>
            </>
          }
        >
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {photos.map((a) => {
              const on = sections.find((s) => s.id === picker)?.assetIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSections((ss) => ss.map((s) => (s.id === picker ? { ...s, assetIds: on ? s.assetIds.filter((x) => x !== a.id) : [...s.assetIds, a.id] } : s)))}
                  className={cn("relative aspect-square overflow-hidden rounded-lg", on && "ring-[3px] ring-accent")}
                >
                  <img src={a.thumbUrl} alt="" className="size-full object-cover" />
                  {on && (
                    <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-accent text-white shadow">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
      {editingDetails && (
        <Modal title="Book details" onClose={() => setEditingDetails(false)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const next = { title: String(f.get("title")), subtitle: String(f.get("subtitle")), details: { dateLabel: String(f.get("dateLabel")) } };
              setStory((st) => ({ ...st, ...next, details: { ...st.details, ...next.details } }));
              start(() => updateStoryDetailsAction(story.id, next));
              setEditingDetails(false);
            }}
          >
            {[
              ["title", "Title", story.title],
              ["subtitle", "Subtitle", story.subtitle ?? ""],
              ["dateLabel", "Date", story.details?.dateLabel ?? ""],
            ].map(([n, l, v]) => (
              <label key={n} className="block text-[12px] text-ink-2">
                {l}
                <input name={n} defaultValue={v} className="field mt-1" />
              </label>
            ))}
            <Link href={`/stories/${story.id}/book`} className="flex items-center gap-3 rounded-xl border border-line bg-field px-3 py-2.5 text-[12.5px] hover:bg-white">
              <BookOpen className="size-4 text-ink-2" />
              <span className="flex-1">
                <span className="block text-ink">
                  {coverOf(story.details?.cover).name} · {sizeOf(story.details?.size).label} · {styleOf(story.details?.style).id}
                </span>
                <span className="block text-[11.5px] text-muted">Compare cover types, sizes and styles</span>
              </span>
              <ChevronRight className="size-4 text-ink-2" />
            </Link>
            <div className="flex justify-end pt-2">
              <button type="submit" className="h-10 rounded-full bg-ink px-5 text-[13px] text-white">
                Save details
              </button>
            </div>
          </form>
        </Modal>
      )}
      {preview && (
        <Modal title={`${story.title} — preview`} description={`${sections.length} sections · about ${estPages} pages`} onClose={() => setPreview(false)} width="max-w-4xl">
          <div className="space-y-5">
            {sections.map((s, i) => (
              <div key={s.id} className="grid aspect-[16/7] grid-cols-2 gap-1 rounded-md bg-[#fbfaf7] p-5 shadow-[var(--shadow-lift)]">
                <div className="flex flex-col justify-center pr-6">
                  <div className="text-[10px] tracking-[0.3em] text-muted uppercase">Chapter {i + 1}</div>
                  <div className="font-display text-[30px] leading-tight text-ink">{s.title}</div>
                  <p className="mt-2 text-[12px] text-ink-2">{s.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {s.assetIds.slice(0, 4).map((id) => (
                    <img key={id} src={byId.get(id)?.thumbUrl} alt="" className="size-full rounded-sm object-cover" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
