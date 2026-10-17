import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { listAlbums, listAssets, type ProjectSummary } from "@/lib/data";
import { plural } from "@/lib/utils";
import { SideNav } from "./side-nav";

/** Left glass panel inside a project: project card, sections, and its albums. */
export async function ProjectSidebar({ project }: { project: ProjectSummary }) {
  const base = `/projects/${project.id}`;
  const [albums, assets] = await Promise.all([listAlbums(project.id), listAssets(project.id)]);
  const shown = albums.filter((a) => a.kind === "manual").slice(0, 6);
  const usedGb = Math.max(1, Math.round(assets.reduce((n, a) => n + (a.byteSize ?? 2_000_000), 0) / 1e9));

  return (
    <aside className="glass flex flex-col p-4">
      <Link href="/projects" className="flex items-center gap-2 px-2 py-1 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> All Projects
      </Link>
      <Link href={base} className="mt-3 flex items-center gap-3 rounded-2xl p-1.5 hover:bg-white/50">
        <span className="size-[68px] shrink-0 overflow-hidden rounded-[14px] bg-sunken">{project.cover && <img src={project.cover.thumbUrl} alt="" className="size-full object-cover" />}</span>
        <span className="min-w-0">
          <span className="block font-display text-[19px] leading-[1.1] text-ink">{project.name}</span>
          <span className="mt-1 block text-[11px] text-muted">
            {project.counts.photos.toLocaleString()} photos · {project.counts.albums} albums
          </span>
        </span>
      </Link>

      <div className="mt-4">
        <SideNav base={base} />
      </div>

      {shown.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-medium tracking-[0.24em] text-muted uppercase">Albums in this project</span>
            <Link href={`${base}/albums?new=1`} aria-label="New album" className="text-ink-2 hover:text-ink">
              <Plus className="size-4" />
            </Link>
          </div>
          <ul className="mt-2 space-y-1">
            {shown.map((al) => (
              <li key={al.id}>
                <Link href={`${base}/albums/${al.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/60">
                  <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-sunken">{al.cover && <img src={al.cover.thumbUrl} alt="" className="size-full object-cover" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-ink">{al.name}</span>
                    <span className="block text-[11px] text-muted">{plural(al.count, "memory", "memories")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`${base}/albums`} className="mt-2 flex items-center gap-2 px-2 text-[12px] text-ink-2 hover:text-ink">
            View all albums <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-auto pt-6">
        <div className="border-t border-ink/10 px-2 pt-4">
          <div className="text-[12px] text-ink">Storage</div>
          <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-ink/70" style={{ width: `${Math.min(100, (usedGb / 1000) * 100 + 8)}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-muted">{usedGb} GB of 1 TB used</div>
        </div>
      </div>
    </aside>
  );
}
