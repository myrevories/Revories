"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  CalendarPlus,
  ChevronDown,
  CloudUpload,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  ListOrdered,
  MapPin,
  MoreHorizontal,
  NotebookPen,
  Quote,
  Smartphone,
  UserRound,
} from "lucide-react";
import { addProjectNoteAction, addWrittenStoryAction } from "@/app/actions";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import { ShareModal } from "@/components/sharing/share-modal";
import { UploadDrawer } from "@/components/upload/upload-drawer";
import { AddPlaceButton } from "@/components/places/places-view";
import { Avatar } from "@/components/ui";
import type { ActivityItem } from "@/lib/data";
import type { Asset, Event, User } from "@/lib/types";
import { cn, formatRelative, formatTakenAt } from "@/lib/utils";

const NOW = Date.parse("2026-10-16T12:00:00Z");

type Tab = "contribute" | "gallery" | "people" | "places" | "timeline" | "notes";

export interface ContributorRow {
  user: User;
  role: string;
  added: number;
}

function SourceTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2.5 text-[12px] text-ink">
      <span className="grid size-[58px] place-items-center rounded-2xl bg-white shadow-[0_4px_14px_rgb(70_55_40/0.08)] transition hover:-translate-y-0.5">{icon}</span>
      {label}
    </button>
  );
}

function AddedBy({ asset, who }: { asset: Asset; who?: User }) {
  const name = who?.nickname ?? who?.name.split(" ")[0] ?? asset.contributorName?.replace(/ \(.+\)$/, "") ?? "family";
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-[12px] bg-sunken shadow-sm">
      {asset.kind === "document" ? (
        <span className="grid size-full place-items-center bg-[#f3eee6] px-3 text-center font-script text-[21px] leading-tight text-ink-2">{asset.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")}</span>
      ) : (
        <img src={asset.thumbUrl} alt={asset.caption ?? ""} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      )}
      <span className="absolute top-2 left-2 size-6 rounded-full border-2 border-white/90 bg-black/10" />
      <span className="absolute top-2 right-2 text-white/90">
        <MoreHorizontal className="size-4" />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/50 to-transparent px-2 pt-6 pb-2 text-[11.5px] text-white">
        <Avatar name={name} src={who?.avatarUrl} size={22} ring /> Added by {name}
      </span>
    </div>
  );
}

/**
 * Shared project / contributor experience: hero, tabs, an easy contribute
 * panel, recent contributions, contributors, activity and notes.
 */
export function SharedProject({
  project,
  cover,
  subtitle,
  contributors,
  recent,
  activity,
  notes,
  events,
  users,
}: {
  project: { id: string; name: string; description?: string; firstStoryId?: string };
  cover?: string;
  subtitle: string;
  contributors: ContributorRow[];
  recent: Asset[];
  activity: ActivityItem[];
  notes: { id: string; user?: User; text: string; createdAt: string }[];
  events: Event[];
  users: User[];
}) {
  const meta = useMeta();
  const base = `/projects/${project.id}`;
  const [tab, setTab] = useState<Tab>("contribute");
  const [files, setFiles] = useState<File[] | null>(null);
  const [share, setShare] = useState(false);
  const [story, setStory] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [newest, setNewest] = useState(true);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const userOf = (id?: string) => users.find((u) => u.id === id);
  const me = contributors.find((c) => c.role === "owner")?.user;
  const sortedRecent = newest ? recent : [...recent].reverse();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="glass min-w-0 p-3">
        {/* Hero */}
        <section className="relative min-h-[300px] overflow-hidden rounded-[18px]">
          {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/0" />
          <div className="relative max-w-[440px] p-7">
            <p className="eyebrow-wide">Shared project</p>
            <h1 className="mt-3 font-display text-[50px] leading-none text-ink">{project.name.replace(/ Archive$/, "")}</h1>
            <p className="mt-1 font-display text-[24px] text-ink">{subtitle}</p>
            {project.description && <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{project.description}</p>}
            <div className="mt-5 flex items-center gap-3">
              <span className="flex -space-x-2.5">
                {contributors.slice(0, 5).map((c) => (
                  <Avatar key={c.user.id} name={c.user.name} src={c.user.avatarUrl} size={38} ring />
                ))}
                {contributors.length > 5 && <span className="grid size-[38px] place-items-center rounded-full bg-ink/45 text-[12px] text-white ring-2 ring-white">+{contributors.length - 5}</span>}
              </span>
              <button type="button" onClick={() => setShare(true)} className="flex h-10 items-center gap-2 rounded-full bg-white/90 px-4 text-[13px] text-ink shadow hover:bg-white">
                <Link2 className="size-4" /> Invite People
              </button>
            </div>
          </div>
          <div className="absolute top-5 right-5 flex gap-2">
            {project.firstStoryId && (
              <Link href={`/stories/${project.firstStoryId}/storyboard`} className="flex h-11 items-center gap-2 rounded-full bg-ink/80 px-5 text-[13px] text-white backdrop-blur hover:bg-ink">
                View Story <ArrowRight className="size-4" />
              </Link>
            )}
            <Link href={`${base}/settings/sharing`} aria-label="Sharing settings" className="grid size-11 place-items-center rounded-full bg-white/80 text-ink backdrop-blur hover:bg-white">
              <MoreHorizontal className="size-5" />
            </Link>
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-3 flex flex-wrap gap-1 rounded-2xl bg-white/40 p-1.5">
          {(
            [
              ["contribute", <CloudUpload key="c" />, "Contribute"],
              ["gallery", <ImageIcon key="g" />, "Gallery"],
              ["people", <UserRound key="p" />, "People"],
              ["places", <MapPin key="pl" />, "Places"],
              ["timeline", <ListOrdered key="t" />, "Timeline"],
              ["notes", <NotebookPen key="n" />, "Story Notes"],
            ] as const
          ).map(([k, icon, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn("flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[13px] whitespace-nowrap [&>svg]:size-4 [&>svg]:stroke-[1.6]", tab === k ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink")}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="p-3">
          {tab === "contribute" && (
            <>
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files.length) setFiles([...e.dataTransfer.files]);
                  }}
                  className="flex items-center gap-6 rounded-[18px] bg-white/50 p-6"
                >
                  <CloudUpload className="size-14 shrink-0 stroke-[1.2] text-ink" />
                  <div>
                    <div className="font-display text-[22px] text-ink">Add Your Memories</div>
                    <div className="text-[12.5px] text-muted">Drag and drop photos, videos, or files here</div>
                    <button type="button" onClick={() => input.current?.click()} className="mt-3 h-11 rounded-full bg-ink px-8 text-[13.5px] text-white hover:bg-black">
                      Choose Files
                    </button>
                    <input ref={input} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => (e.target.files?.length && setFiles([...e.target.files]), (e.target.value = ""))} />
                  </div>
                </div>
                <div className="flex items-center justify-around rounded-[18px] bg-white/40 p-4">
                  <SourceTile icon={<Smartphone className="size-6 stroke-[1.5]" />} label="Add from Phone" onClick={() => setPhone("phone")} />
                  <SourceTile icon={<span className="text-[22px]">✦</span>} label="Google Photos" onClick={() => setPhone("Google Photos")} />
                  <SourceTile icon={<span className="text-[22px] text-[#0061ff]">◆</span>} label="Dropbox" onClick={() => setPhone("Dropbox")} />
                  <SourceTile icon={<span className="text-[22px] text-[#0364b8]">☁</span>} label="OneDrive" onClick={() => setPhone("OneDrive")} />
                </div>
              </div>
              <div className="my-4 flex items-center gap-3 text-[11px] text-muted">
                <span className="h-px flex-1 bg-ink/10" /> OR <span className="h-px flex-1 bg-ink/10" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setStory(true)} className="flex h-11 items-center gap-2 rounded-xl bg-white/70 px-6 text-[13px] text-ink hover:bg-white">
                  <FileText className="size-4" /> Add a Story
                </button>
                <AddPlaceButtonInline />
                <Link href={`${base}/uploads?filter=people`} className="flex h-11 items-center gap-2 rounded-xl bg-white/70 px-6 text-[13px] text-ink hover:bg-white">
                  <UserRound className="size-4" /> Tag People
                </Link>
                <Link href={`${base}/uploads?filter=review`} className="flex h-11 items-center gap-2 rounded-xl bg-white/70 px-6 text-[13px] text-ink hover:bg-white">
                  <CalendarPlus className="size-4" /> Add a Date
                </Link>
              </div>
            </>
          )}

          {(tab === "contribute" || tab === "gallery") && (
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <h2 className="flex-1 font-display text-[24px] text-ink">{tab === "gallery" ? "Gallery" : "Recently Added by Contributors"}</h2>
                <label className="relative flex h-9 items-center rounded-full bg-white/70 pr-2 pl-4 text-[12px]">
                  <select value={newest ? "new" : "old"} onChange={(e) => setNewest(e.target.value === "new")} className="appearance-none bg-transparent pr-6 outline-none">
                    <option value="new">Newest First</option>
                    <option value="old">Oldest First</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 size-3.5" />
                </label>
                <span className="flex rounded-full bg-white/60 p-0.5">
                  <span className="grid size-8 place-items-center rounded-full bg-white shadow-sm">
                    <LayoutGrid className="size-3.5" />
                  </span>
                  <Link href={`${base}/uploads`} aria-label="List view" className="grid size-8 place-items-center rounded-full text-ink-2">
                    <List className="size-3.5" />
                  </Link>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
                {sortedRecent.slice(0, tab === "gallery" ? 30 : 10).map((a) => (
                  <Link key={a.id} href={`${base}/uploads?focus=${a.id}`}>
                    <AddedBy asset={a} who={userOf(a.uploadedBy)} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tab === "people" && (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
              {meta.people.map((p) => (
                <Link key={p.id} href={`${base}/people?person=${p.id}`} className="flex flex-col items-center gap-2 rounded-2xl bg-white/50 p-4 text-center hover:bg-white">
                  <Avatar name={p.name} src={p.avatarUrl} size={64} />
                  <span className="text-[13px] text-ink">{p.name}</span>
                </Link>
              ))}
            </div>
          )}

          {tab === "places" && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {meta.places.map((p) => (
                <li key={p.id}>
                  <Link href={`${base}/places?place=${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white/50 p-4 hover:bg-white">
                    <MapPin className="size-5 text-accent" />
                    <span>
                      <span className="block text-[14px] text-ink">{p.name}</span>
                      <span className="block text-[12px] text-muted">{p.address}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {tab === "timeline" && (
            <ol className="space-y-2 border-l-2 border-accent-line pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute top-3 -left-[27px] size-3 rounded-full border-2 border-white bg-accent" />
                  <Link href={`${base}/events/${e.id}`} className="block rounded-2xl bg-white/50 p-4 hover:bg-white">
                    <span className="block font-display text-[18px] text-ink">{e.name}</span>
                    <span className="block text-[12px] text-muted">{e.startDate ? formatTakenAt(e.startDate, "exact") : e.recurring ? "A family tradition" : ""}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              {recent
                .filter((a) => a.caption)
                .map((a) => (
                  <blockquote key={a.id} className="flex gap-3 rounded-2xl bg-white/60 p-4">
                    <Quote className="size-5 shrink-0 text-accent" />
                    <span>
                      <span className="block text-[14px] leading-relaxed text-ink">{a.caption}</span>
                      <span className="mt-1 block text-[11.5px] text-muted">— {userOf(a.uploadedBy)?.nickname ?? userOf(a.uploadedBy)?.name ?? a.contributorName}</span>
                    </span>
                  </blockquote>
                ))}
              <button type="button" onClick={() => setStory(true)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[13px] text-white">
                <FileText className="size-4" /> Write a story
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <aside className="space-y-4">
        <section className="glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[22px] text-ink">Contributors ({contributors.length})</h3>
            <button type="button" onClick={() => setShare(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/80 px-3.5 text-[12px] text-ink hover:bg-white">
              <Link2 className="size-3.5" /> Invite
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {contributors.slice(0, 5).map((c) => (
              <li key={c.user.id} className="flex items-center gap-3">
                <Avatar name={c.user.name} src={c.user.avatarUrl} size={42} />
                <span>
                  <span className="block text-[14px] text-ink">{c.user.id === me?.id ? `You (${c.user.name.split(" ")[0]})` : (c.user.nickname ?? c.user.name)}</span>
                  <span className="block text-[12px] text-muted">
                    {c.role === "owner" ? "Owner · " : ""}Added {c.added} items
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Link href={`${base}/settings/sharing`} className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-ink hover:text-accent">
            See All Contributors <ArrowRight className="size-3.5" />
          </Link>
        </section>

        <section className="glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[22px] text-ink">Activity</h3>
            <Link href={`${base}/uploads`} className="flex items-center gap-1 text-[12px] text-ink hover:text-accent">
              View All <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-3 space-y-4">
            {activity.slice(0, 5).map((it) => (
              <li key={it.id} className="flex items-start gap-3">
                {it.kind === "story" ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/80 text-ink">
                    <Quote className="size-4" />
                  </span>
                ) : it.kind === "document" ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/80 text-ink">
                    <FileText className="size-4" />
                  </span>
                ) : (
                  <Avatar name={it.who} src={it.user?.avatarUrl} size={36} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] text-ink">
                    {it.who} {it.kind === "story" ? "added a story" : it.kind === "document" ? "added a document" : `added ${it.count} photo${it.count > 1 ? "s" : ""}`}
                  </span>
                  <span className="block text-[11px] text-muted">{formatRelative(it.at, NOW)}</span>
                  {it.text && <span className="mt-1 line-clamp-2 block text-[11.5px] text-ink-2">“{it.text}”</span>}
                  {it.filename && (
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-2">
                      <FileText className="size-3.5" /> {it.filename}
                    </span>
                  )}
                </span>
                {it.kind === "added" && (
                  <span className="flex gap-1">
                    {it.thumbs.slice(0, 2).map((a) => (
                      <img key={a.id} src={a.thumbUrl} alt="" className="size-9 rounded-md object-cover" />
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-5">
          <h3 className="font-display text-[22px] text-ink">Leave a Note for Contributors</h3>
          <ul className="mt-3 space-y-2">
            {notes.slice(-3).map((n) => (
              <li key={n.id} className="flex gap-2 text-[12px]">
                <Avatar name={n.user?.name ?? "?"} src={n.user?.avatarUrl} size={24} />
                <span className="rounded-xl rounded-tl-sm bg-white/70 px-3 py-2 text-ink-2">
                  <span className="font-medium text-ink">{n.user?.nickname ?? n.user?.name.split(" ")[0]}</span> {n.text}
                </span>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex items-start gap-2 rounded-2xl bg-white/70 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = note;
              setNote("");
              start(() => addProjectNoteAction(project.id, text));
            }}
          >
            <Avatar name={me?.name ?? "You"} src={me?.avatarUrl} size={32} />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Share a message, ask for specific photos, or say thanks…" className="flex-1 resize-none bg-transparent pt-1 text-[12.5px] text-ink outline-none placeholder:text-muted" />
            <button type="submit" disabled={!note.trim() || pending} aria-label="Send note" className="mt-auto grid size-8 place-items-center rounded-full bg-ink/10 text-ink disabled:opacity-40">
              <ArrowUp className="size-4" />
            </button>
          </form>
        </section>
      </aside>

      {files && <UploadDrawer initialFiles={files} onClose={() => setFiles(null)} />}
      {share && <ShareModal onClose={() => setShare(false)} />}
      {story && <StoryModal projectId={project.id} onClose={() => setStory(false)} />}
      {phone && (
        <Modal title={phone === "phone" ? "Add from your phone" : `Import from ${phone}`} onClose={() => setPhone(null)}>
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            {phone === "phone"
              ? "Open this project on your phone and tap Add memories to pick photos from your camera roll — or ask the project owner for an upload link."
              : "Direct import is coming soon. For now, download the photos and drop them into the Add Your Memories box."}
          </p>
        </Modal>
      )}
    </div>
  );
}

function AddPlaceButtonInline() {
  return <AddPlaceButton label="Add a Location" className="flex h-11 items-center gap-2 rounded-xl bg-white/70 px-6 text-[13px] text-ink hover:bg-white" />;
}

function StoryModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  return (
    <Modal title="Add a story" description="Write down a memory — it becomes part of the archive." onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          start(async () => {
            await addWrittenStoryAction(projectId, String(f.get("title") ?? ""), String(f.get("text") ?? ""));
            onClose();
          });
        }}
      >
        <input name="title" placeholder="Give it a title (optional)" className="field" />
        <textarea name="text" required rows={6} placeholder="This was the first year we all made it to the lake together…" className="field resize-none" />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="h-10 rounded-full bg-ink px-6 text-[13px] text-white">
            {pending ? "Saving…" : "Save story"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
