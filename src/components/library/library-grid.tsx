"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { ProjectSummary } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { CATEGORIES, ProjectTile, StatIcons, categoryLabel } from "./parts";

const SORTS = {
  updated: { label: "Last updated", fn: (a: ProjectSummary, b: ProjectSummary) => b.updatedAt.localeCompare(a.updatedAt) },
  name: { label: "Name", fn: (a: ProjectSummary, b: ProjectSummary) => a.name.localeCompare(b.name) },
  size: { label: "Most memories", fn: (a: ProjectSummary, b: ProjectSummary) => b.counts.assets - a.counts.assets },
};

/** Category pills, sort, grid/list toggle and the project grid from the Library concept. */
export function LibraryGrid({ projects }: { projects: ProjectSummary[] }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("updated");
  const [view, setView] = useState<"grid" | "list">("grid");
  const shown = projects.filter((p) => cat === "all" || p.category === cat).sort(SORTS[sort].fn);

  return (
    <div>
      <div className="glass flex flex-wrap items-center gap-2 p-2">
        <div className="flex flex-1 flex-wrap items-center gap-1">
          <button type="button" onClick={() => setCat("all")} className={cn("h-9 rounded-full px-4 text-[12.5px]", cat === "all" ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink")}>
            All Projects
          </button>
          {CATEGORIES.filter((c) => c.id !== "life_events").map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] [&>svg]:size-[15px] [&>svg]:stroke-[1.6] 2xl:px-4",
                cat === c.id ? "bg-accent-soft font-medium text-accent" : "bg-white/50 text-ink-2 hover:text-ink",
              )}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="h-10 rounded-full border border-white/80 bg-white/70 px-4 text-[12.5px] text-ink outline-none">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex rounded-full bg-white/60 p-1">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} type="button" aria-label={`${v} view`} onClick={() => setView(v)} className={cn("grid size-9 place-items-center rounded-full", view === v ? "bg-white text-ink shadow-sm" : "text-muted")}>
              {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>
        <Link href="/projects/new" className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[13.5px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-black">
          <Plus className="size-4" /> Create New Project
        </Link>
      </div>

      {view === "grid" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((p) => (
            <ProjectTile key={p.id} project={p} showTagline />
          ))}
        </div>
      ) : (
        <div className="glass mt-4 divide-y divide-ink/5 p-2">
          {shown.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-4 rounded-xl p-2 hover:bg-white/60">
              <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-sunken">{p.cover && <img src={p.cover.thumbUrl} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9.5px] tracking-[0.22em] text-muted uppercase">{categoryLabel(p.category)}</span>
                <span className="block font-display text-[18px] text-ink">{p.name}</span>
                <span className="block truncate text-[12px] text-ink-2">{p.tagline}</span>
              </span>
              <StatIcons photos={p.counts.photos + p.counts.videos} albums={p.counts.albums} people={p.counts.contributors} />
              <span className="hidden w-28 text-right text-[11.5px] text-muted md:block">Updated {formatRelative(p.updatedAt, Date.parse("2026-10-16T12:00:00Z"))}</span>
            </Link>
          ))}
        </div>
      )}
      {!shown.length && <p className="glass mt-4 p-10 text-center text-[14px] text-ink-2">No projects in this category yet. Create one to get started.</p>}
    </div>
  );
}
