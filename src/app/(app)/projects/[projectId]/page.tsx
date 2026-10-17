import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Calendar, Camera, Image as ImageIcon, Layers, Play, User, Users } from "lucide-react";
import { getPulse, getProjectMeta, listAlbums, listAssets, listStories } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { ProjectActions } from "@/components/project/project-actions";
import { ProjectAlbums, RecentMemories } from "@/components/project/album-cards";
import { BookCard, PeopleRow, PlacesCardBody, SideCard } from "@/components/project/side-cards";
import { categoryLabel } from "@/components/library/parts";
import { formatRelative } from "@/lib/utils";

const NOW = Date.parse("2026-10-16T12:00:00Z");

export default function ProjectOverviewPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Overview params={params} />
    </Suspense>
  );
}

function MiniStat({ thumb, icon, title, value, unit, sub, href }: { thumb?: string; icon: React.ReactNode; title: string; value: number; unit: string; sub: string; href: string }) {
  return (
    <Link href={href} className="glass-strong flex items-center gap-3 p-2.5 transition hover:bg-white">
      <span className="h-[78px] w-[62px] shrink-0 overflow-hidden rounded-xl bg-sunken 2xl:w-[72px]">{thumb && <img src={thumb} alt="" className="size-full object-cover" />}</span>
      <span className="hidden size-8 shrink-0 place-items-center self-start rounded-full bg-accent-soft text-accent 2xl:grid [&>svg]:size-4 [&>svg]:stroke-[1.6]">{icon}</span>
      <span className="min-w-0 self-start">
        <span className="block text-[12.5px] font-medium text-ink">{title}</span>
        <span className="block text-[12.5px] text-ink">
          <span className="text-[17px]">{value}</span> {unit}
        </span>
        <span className="block text-[10.5px] leading-snug text-muted">{sub}</span>
      </span>
    </Link>
  );
}

async function Overview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const base = `/projects/${projectId}`;
  const [albums, assets, meta, pulse, stories] = await Promise.all([listAlbums(projectId), listAssets(projectId), getProjectMeta(projectId), getPulse(projectId), listStories(projectId)]);
  const recent = [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unidentified = assets.filter((a) => a.kind === "photo" && !a.people.length);
  const countByPlace = Object.fromEntries(meta.places.map((p) => [p.id, assets.filter((a) => a.placeId === p.id).length]));
  const thumbByPlace = Object.fromEntries(meta.places.map((p) => [p.id, assets.find((a) => a.placeId === p.id && a.kind === "photo")?.thumbUrl]));

  return (
    <ProjectScope projectId={projectId}>
      {(project) => (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Hero */}
          <section className="relative min-h-[300px] overflow-hidden rounded-[22px] border border-white/70 shadow-[0_10px_40px_rgb(70_55_40/0.12)]">
            {project.cover && <img src={project.cover.url} alt="" className="absolute inset-0 size-full object-cover object-[70%_50%]" />}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-white/0" />
            <div className="relative p-8">
              <p className="eyebrow-wide">{categoryLabel(project.category)} project</p>
              <h1 className="mt-3 font-display text-[48px] leading-none tracking-[-0.015em] text-ink 2xl:text-[60px]">{project.name}</h1>
              {project.tagline && <p className="mt-2 font-display text-[22px] text-ink italic 2xl:text-[26px]">{project.tagline}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-2 [&_svg]:size-[17px] [&_svg]:stroke-[1.6]">
                <span className="flex items-center gap-2">
                  <ImageIcon /> {project.counts.photos.toLocaleString()} photos
                </span>
                <span className="flex items-center gap-2">
                  <Layers /> {project.counts.albums} albums
                </span>
                <span className="flex items-center gap-2">
                  <Users /> {project.counts.contributors} contributors
                </span>
                {project.years && (
                  <span className="flex items-center gap-2">
                    <Calendar /> {project.years}
                  </span>
                )}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href={`${base}/uploads`} className="pill-accent flex h-14 items-center gap-3 rounded-full pr-6 pl-2 text-[15px]">
                  <span className="grid size-10 place-items-center rounded-full bg-white/25">
                    <Play className="size-4 fill-current" />
                  </span>
                  Continue organizing <ArrowRight className="size-4" />
                </Link>
                <Link href={`${base}/stories`} className="flex items-center gap-3 text-[13px] text-ink-2 hover:text-ink">
                  <span className="grid size-11 place-items-center rounded-full border border-ink/15 bg-white/70">
                    <Play className="size-3.5 fill-current" />
                  </span>
                  Watch project story
                </Link>
              </div>
            </div>
            {project.hero?.quote && (
              <p className="absolute top-6 right-[8%] hidden -rotate-12 font-script text-[28px] leading-[0.95] whitespace-pre-line text-ink/85 lg:block">
                {project.hero.quote} ♡
              </p>
            )}
          </section>

          <ProjectActions base={base} />

          {/* Left column */}
          <div className="min-w-0 space-y-4">
            <div className="glass grid gap-2 p-2 md:grid-cols-2 2xl:grid-cols-4">
              <MiniStat href={`${base}/uploads`} thumb={pulse.recent.thumbs[0]?.thumbUrl} icon={<Camera />} title="Recent Uploads" value={pulse.recent.count} unit="new photos" sub={pulse.recent.latest ? `Added ${formatRelative(pulse.recent.latest, NOW)}` : "Nothing new this week"} />
              <MiniStat href={`${base}/uploads?filter=review`} thumb={pulse.attention.thumbs[1]?.thumbUrl} icon={<Bell />} title="Needs Attention" value={pulse.attention.count} unit="items" sub="Unidentified people, missing dates" />
              <MiniStat href={`${base}/contributors`} thumb={pulse.shared.thumbs[0]?.thumbUrl} icon={<Users />} title="Shared Activity" value={pulse.shared.count} unit="new memories" sub={`From ${pulse.shared.from.slice(0, 2).join(", ")}${pulse.shared.from.length > 2 ? ` and ${pulse.shared.from.length - 2} others` : ""}`} />
              <MiniStat href={`${base}/people`} thumb={unidentified[3]?.thumbUrl} icon={<User />} title="Unidentified People" value={unidentified.length} unit="photos" sub="Help identify and add names" />
            </div>
            <ProjectAlbums albums={albums.filter((a) => a.kind === "manual")} base={base} />
            <RecentMemories assets={recent} base={base} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <SideCard title="People in this Project" href={`${base}/people`}>
              <PeopleRow people={meta.people} href={`${base}/people`} />
            </SideCard>
            <SideCard title="Places in this Project" href={`${base}/places`}>
              <PlacesCardBody places={meta.places} counts={countByPlace} thumbs={thumbByPlace} href={`${base}/places`} />
              <Link href={`${base}/places`} className="mt-3 flex items-center justify-end gap-1 text-[12px] text-ink hover:text-accent">
                See all places <ArrowRight className="size-3.5" />
              </Link>
            </SideCard>
            <SideCard title="Books & Storyboards" href={`${base}/stories`}>
              <div className="space-y-2">
                {stories.slice(0, 2).map((st) => (
                  <BookCard key={st.id} story={st} cover={st.cover} href={`/stories/${st.id}/storyboard`} />
                ))}
                {!stories.length && <p className="text-[12.5px] text-muted">No books yet. Turn any album into a story when you’re ready.</p>}
              </div>
            </SideCard>
          </div>
        </div>
      )}
    </ProjectScope>
  );
}
