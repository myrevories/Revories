"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, MoreVertical, Play, User } from "lucide-react";
import type { AlbumSummary } from "@/lib/data";
import type { Asset, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALBUM_CATS: [Category | "all", string][] = [
  ["all", "All Albums"],
  ["family", "Family"],
  ["milestones", "Milestones"],
  ["everyday", "Everyday Life"],
  ["holidays", "Holidays"],
  ["travel", "Travel"],
  ["school", "School"],
  ["sports", "Sports"],
];

export function Pills<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: [T, string][]; size?: "sm" | "md" }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={cn("rounded-full transition", size === "sm" ? "h-7 px-3.5 text-[11.5px]" : "h-8 px-4 text-[12.5px]", value === k ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** "Albums" section of the project overview: category pills + album cards. */
export function ProjectAlbums({ albums, base }: { albums: AlbumSummary[]; base: string }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const shown = albums.filter((a) => cat === "all" || a.category === cat).slice(0, 6);
  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h2 className="font-display text-[32px] leading-none text-ink">Albums</h2>
        <Pills value={cat} onChange={setCat} options={ALBUM_CATS} />
        <Link href={`${base}/albums`} className="ml-auto flex items-center gap-1.5 text-[13px] text-ink hover:text-accent">
          View All <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {shown.map((al) => (
          <Link key={al.id} href={`${base}/albums/${al.id}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden rounded-[8px] bg-sunken">{al.cover && <img src={al.cover.thumbUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />}</div>
            <div className="mt-2 truncate font-display text-[16px] text-ink">{al.name}</div>
            <div className="text-[11.5px] text-muted">{al.description && !al.years?.includes("–") ? al.description : (al.years ?? "—")}</div>
            <div className="mt-2 flex items-center gap-4 text-[11.5px] text-ink-2 [&_svg]:size-[15px] [&_svg]:stroke-[1.6]">
              <span className="flex items-center gap-1.5">
                <ImageIcon /> {al.count}
              </span>
              <span className="flex items-center gap-1.5">
                <User /> {al.peopleCount}
              </span>
              <MoreVertical className="ml-auto" />
            </div>
          </Link>
        ))}
        {!shown.length && <p className="col-span-full py-8 text-center text-[13px] text-muted">No albums in this category yet.</p>}
      </div>
    </section>
  );
}

const MEMORY_KINDS: [string, string][] = [
  ["all", "All"],
  ["photo", "Photos"],
  ["video", "Videos"],
  ["document", "Documents"],
  ["audio", "Audio"],
];

export function fmtDuration(sec?: number) {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** "Recent Memories" strip with type pills. */
export function RecentMemories({ assets, base }: { assets: Asset[]; base: string }) {
  const [kind, setKind] = useState("all");
  const shown = assets.filter((a) => kind === "all" || a.kind === kind).slice(0, 12);
  return (
    <section className="glass p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h2 className="font-display text-[28px] leading-none text-ink">Recent Memories</h2>
        <Pills value={kind} onChange={setKind} options={MEMORY_KINDS} size="sm" />
        <Link href={`${base}/uploads`} className="ml-auto flex items-center gap-1.5 text-[13px] text-ink hover:text-accent">
          View All <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-4 flex gap-2.5 overflow-x-auto [scrollbar-width:none]">
        {shown.map((a) => (
          <Link key={a.id} href={`${base}/uploads?focus=${a.id}`} className="relative h-[82px] w-[94px] shrink-0 overflow-hidden rounded-[8px] bg-sunken">
            {a.kind === "document" ? <span className="grid size-full place-items-center text-[10px] text-muted">PDF</span> : <img src={a.thumbUrl} alt="" className="size-full object-cover" />}
            {a.kind === "video" && (
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-7 place-items-center rounded-full bg-white/90 text-ink">
                  <Play className="size-3 fill-current" />
                </span>
              </span>
            )}
          </Link>
        ))}
        {!shown.length && <p className="py-6 text-[13px] text-muted">Nothing of this kind yet.</p>}
      </div>
    </section>
  );
}
