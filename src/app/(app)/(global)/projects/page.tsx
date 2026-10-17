import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Bell, ChevronRight, CloudUpload, ListChecks, MoreHorizontal, Plus, Users } from "lucide-react";
import { getPulse, listMyAlbums, listProjects } from "@/lib/data";
import { PageSkeleton } from "@/components/ui";
import { CATEGORIES, PulseCard } from "@/components/library/parts";
import { LibraryGrid } from "@/components/library/library-grid";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Library" };

const NOW = Date.parse("2026-10-16T12:00:00Z");

export default function LibraryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Library />
    </Suspense>
  );
}

async function Library() {
  const [projects, pulse, albums] = await Promise.all([listProjects(), getPulse(), listMyAlbums()]);
  const busiest = [...projects].sort((a, b) => b.counts.needsReview - a.counts.needsReview)[0];
  const travel = projects.find((p) => p.category === "travel") ?? projects[0];

  return (
    <div className="mx-3 mt-4 space-y-4 lg:mx-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)_minmax(0,1.3fr)]">
        <section className="px-4 pt-4">
          <p className="eyebrow-wide">Your memories, together</p>
          <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink 2xl:text-[80px]">Your Library</h1>
          <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-ink-2">
            A home for family, milestones, travel, sports, school, holidays, and everyday moments — all the stories that make your life, yours.
          </p>
        </section>

        <Link href="/stories" className="group relative min-h-[190px] overflow-hidden rounded-[22px] border border-white/70 shadow-[0_10px_30px_rgb(70_55_40/0.12)]">
          {travel?.cover && <img src={travel.cover.url} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]" />}
          <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/55 to-transparent" />
          <div className="relative flex h-full flex-col p-6">
            <p className="max-w-[200px] font-display text-[22px] leading-[1.15] text-ink">Turn your memories into something extraordinary.</p>
            <span className="mt-auto flex h-10 w-fit items-center gap-2 rounded-full bg-white/90 px-4 text-[13px] text-ink shadow">
              Create a Book <ArrowRight className="size-4" />
            </span>
          </div>
        </Link>

        <section className="glass grid grid-cols-2 gap-2 p-2">
          <PulseCard compact href="/projects" icon={<Users />} title="Shared With You" count={pulse.shared.count} unit="new memories" sub={`from ${pulse.shared.from.slice(0, 2).join(", ")}${pulse.shared.from.length > 2 ? ` and ${pulse.shared.from.length - 2} others` : ""}`} />
          <PulseCard compact href="/upload" icon={<CloudUpload />} title="Recent Uploads" count={pulse.recent.count} unit="new photos" sub={pulse.recent.latest ? `Added ${formatRelative(pulse.recent.latest, NOW)}` : undefined} />
          <PulseCard compact href={busiest ? `/projects/${busiest.id}/uploads` : "/projects"} icon={<Bell />} tint="bg-branch-soft text-branch" title="Needs Attention" count={pulse.attention.count} unit="items" sub="Unlabeled people, missing dates" />
          {busiest && (
            <Link href={`/projects/${busiest.id}/uploads`} className="glass-strong group flex items-center gap-3.5 p-4 hover:bg-white/90">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <ListChecks className="size-5 stroke-[1.6]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-ink">Continue Organizing</span>
                <span className="mt-1 flex items-center gap-2">
                  {busiest.cover && <img src={busiest.cover.thumbUrl} alt="" className="size-9 rounded-md object-cover" />}
                  <span className="min-w-0">
                    <span className="block truncate text-[11.5px] text-ink">{busiest.name}</span>
                    <span className="block text-[10.5px] text-muted">{busiest.counts.needsReview} items left</span>
                  </span>
                </span>
              </span>
              <ChevronRight className="size-4 self-start text-ink-2" />
            </Link>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <LibraryGrid projects={projects} />
        <aside className="glass hidden p-7 xl:block">
          <h2 className="font-display text-[34px] leading-[1.08] text-ink">All of life deserves a beautiful place.</h2>
          <ul className="mt-7 space-y-4">
            {CATEGORIES.filter((c) => c.id !== "life_events").map((c) => (
              <li key={c.id} className="flex items-center gap-3.5 text-[13.5px] text-ink-2 [&_svg]:size-[18px] [&_svg]:stroke-[1.6] [&_svg]:text-ink">
                {c.icon}
                {c.blurb}
              </li>
            ))}
          </ul>
          <div className="mt-8 h-px w-10 bg-ink/30" />
          <p className="mt-6 -rotate-6 font-script text-[25px] leading-[1.05] text-ink-2">
            Different stories.
            <br />
            &nbsp;&nbsp;A brighter tomorrow.
          </p>
        </aside>
      </div>

      <section>
        <h2 className="flex items-center gap-2 px-1 font-display text-[28px] text-ink">
          Recent Albums <ChevronRight className="size-5 text-ink-2" />
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {albums.slice(0, 8).map((al) => (
            <Link key={al.id} href={`/projects/${al.projectId}/albums/${al.id}`} className="group w-[190px] shrink-0 overflow-hidden rounded-[14px] bg-white/85 shadow-[0_4px_14px_rgb(70_55_40/0.08)]">
              <div className="relative aspect-[16/9] overflow-hidden bg-sunken">
                {al.cover && <img src={al.cover.thumbUrl} alt="" className="size-full object-cover transition group-hover:scale-[1.04]" />}
                <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-white/90 text-ink shadow">
                  <MoreHorizontal className="size-3.5" />
                </span>
              </div>
              <div className="px-3 py-2">
                <div className="truncate text-[12.5px] text-ink">{al.name}</div>
                <div className="text-[10.5px] text-muted">{al.count} photos</div>
              </div>
            </Link>
          ))}
          <Link href="/albums" className="grid w-[110px] shrink-0 place-items-center rounded-[14px] bg-white/70 text-center text-[12px] text-ink shadow-[0_4px_14px_rgb(70_55_40/0.08)] hover:bg-white">
            <span>
              <Plus className="mx-auto mb-1 size-5" strokeWidth={1.5} />
              View All
              <br />
              Albums
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
