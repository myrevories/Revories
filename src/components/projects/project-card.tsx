import Link from "next/link";
import type { ProjectSummary } from "@/lib/data";
import { ROLE_COPY, formatRelative, plural } from "@/lib/utils";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`} className="card group block overflow-hidden transition hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-sunken">
        {project.cover && <img src={project.cover.url} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" />}
        {project.counts.needsReview > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-warn shadow-[var(--shadow-soft)]">
            {project.counts.needsReview} to review
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-[18px] leading-snug font-medium">{project.name}</h3>
          {project.role !== "owner" && <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[10.5px] font-medium text-ink-2">{ROLE_COPY[project.role].label}</span>}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">{project.tagline}</p>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-2">
          <span>{plural(project.counts.assets, "memory", "memories")}</span>
          <span className="text-faint">·</span>
          <span>{plural(project.counts.albums, "album")}</span>
          <span className="ml-auto text-muted">Updated {formatRelative(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
