import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, ChevronRight, Gift, GraduationCap, Heart, Home, Image as ImageIcon, Plane, Sparkles, Trophy, User, Users } from "lucide-react";
import type { AlbumSummary, ProjectSummary } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CATEGORIES: { id: Category; label: string; icon: ReactNode; blurb: string }[] = [
  { id: "family", label: "Family", icon: <Users />, blurb: "Family memories" },
  { id: "travel", label: "Travel", icon: <Plane />, blurb: "Adventures near and far" },
  { id: "milestones", label: "Milestones", icon: <Heart />, blurb: "Life’s biggest milestones" },
  { id: "sports", label: "Sports", icon: <Trophy />, blurb: "Sports and hobbies" },
  { id: "school", label: "School", icon: <GraduationCap />, blurb: "School and achievements" },
  { id: "holidays", label: "Holidays", icon: <Gift />, blurb: "Holidays and traditions" },
  { id: "everyday", label: "Everyday", icon: <Home />, blurb: "Everyday moments" },
  { id: "life_events", label: "Life Events", icon: <Sparkles />, blurb: "Weddings, moves, new chapters" },
];
export const categoryLabel = (c?: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? "";

export function SectionHead({ title, href, children, className }: { title: ReactNode; href?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      <h2 className="font-display text-[30px] leading-none text-ink sm:text-[34px]">{title}</h2>
      {children}
      {href && (
        <Link href={href} className="ml-auto flex items-center gap-1.5 text-[13px] text-ink hover:text-accent">
          View All <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

/** One of the small status cards: icon, title, count, sub-line, thumbnails. */
export function PulseCard({
  href,
  icon,
  title,
  count,
  unit,
  sub,
  thumbs,
  faces,
  tint = "bg-accent-soft text-accent",
  compact,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  count: number;
  unit: string;
  sub?: string;
  thumbs?: string[];
  faces?: { name: string; src?: string }[];
  tint?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="glass-strong group flex min-w-0 items-center gap-3.5 p-4 transition hover:bg-white/90">
      <span className={cn("grid shrink-0 place-items-center rounded-full [&>svg]:stroke-[1.6]", tint, compact ? "size-10 [&>svg]:size-5" : "size-12 [&>svg]:size-[22px]")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-ink">{title}</span>
        <span className="block text-[13px] text-ink">
          <span className="text-[17px] font-medium">{count.toLocaleString()}</span> {unit}
        </span>
        {sub && <span className="block truncate text-[11px] text-muted">{sub}</span>}
      </span>
      {thumbs && thumbs.length > 0 && (
        <span className="hidden gap-1.5 sm:flex">
          {thumbs.slice(0, 3).map((t, i) => (
            <img key={t} src={t} alt="" className={cn("rounded-lg object-cover", compact ? "size-11" : "h-[54px] w-[46px]", i === 2 && "hidden min-[1700px]:block")} />
          ))}
        </span>
      )}
      {faces && (
        <span className="flex -space-x-2">
          {faces.slice(0, 3).map((f) => (
            <span key={f.name} className="size-9 overflow-hidden rounded-full ring-2 ring-white">
              {f.src ? <img src={f.src} alt={f.name} className="size-full object-cover" /> : null}
            </span>
          ))}
          {faces.length > 3 && <span className="grid size-9 place-items-center rounded-full bg-white text-[11px] text-ink-2 ring-2 ring-white">+{faces.length - 3}</span>}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 self-start text-ink-2 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export function StatIcons({ photos, albums, people }: { photos: number; albums: number; people: number }) {
  return (
    <div className="flex items-center gap-5 text-[11.5px] text-ink-2 [&_svg]:size-[15px] [&_svg]:stroke-[1.6]">
      <span className="flex items-center gap-1.5">
        <ImageIcon /> {photos.toLocaleString()}
      </span>
      <span className="flex items-center gap-1.5">
        <BookOpen /> {albums}
      </span>
      <span className="flex items-center gap-1.5">
        <User /> {people}
      </span>
    </div>
  );
}

export function ProjectTile({ project, showTagline }: { project: ProjectSummary; showTagline?: boolean }) {
  return (
    <Link href={`/projects/${project.id}`} className="group block overflow-hidden rounded-[16px] bg-white/85 shadow-[0_4px_18px_rgb(70_55_40/0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgb(70_55_40/0.14)]">
      <div className={cn("relative overflow-hidden bg-sunken", showTagline ? "aspect-[16/8.4]" : "aspect-[16/9.5]")}>
        {project.cover && <img src={project.cover.thumbUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
        <span className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-white/90 text-[13px] leading-none text-ink shadow">···</span>
      </div>
      <div className="px-3.5 pt-3 pb-3.5">
        {showTagline && <div className="text-[9.5px] tracking-[0.22em] text-muted uppercase">{categoryLabel(project.category)}</div>}
        <div className="font-display text-[19px] leading-tight text-ink">{project.name}</div>
        {showTagline ? (
          <div className="mt-0.5 truncate text-[12.5px] text-ink-2">{project.tagline}</div>
        ) : (
          <div className="text-[9.5px] tracking-[0.22em] text-muted uppercase">{categoryLabel(project.category)}</div>
        )}
        <div className="mt-2.5">
          <StatIcons photos={project.counts.photos + project.counts.videos} albums={project.counts.albums} people={project.counts.contributors} />
        </div>
      </div>
    </Link>
  );
}

export function AlbumMini({ album, wide }: { album: AlbumSummary; wide?: boolean }) {
  return (
    <Link href={`/projects/${album.projectId}/albums/${album.id}`} className={cn("group block shrink-0", wide ? "w-[160px]" : "w-[112px]")}>
      <div className={cn("overflow-hidden rounded-[6px] bg-sunken shadow-sm", wide ? "aspect-[16/10]" : "aspect-[4/3]")}>
        {album.cover && <img src={album.cover.thumbUrl} alt="" className="size-full object-cover transition group-hover:scale-[1.04]" />}
      </div>
      <div className="mt-1.5 truncate text-[12px] text-ink">{album.name}</div>
      <div className="truncate text-[10.5px] text-muted">
        {album.years?.includes("–") && !wide ? `${album.years.slice(0, 3)}0s • ` : ""}
        {album.count} photos
      </div>
    </Link>
  );
}
