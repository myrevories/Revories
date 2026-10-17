import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CloudUpload, Image as ImageIcon, Play, Sparkles, UserPlus, Users } from "lucide-react";
import { getCurrentUser, getPulse, listAssets, listMyAlbums, listProjects } from "@/lib/data";
import { PageSkeleton } from "@/components/ui";
import { PulseCard, ProjectTile, SectionHead } from "@/components/library/parts";
import { AlbumStrip } from "@/components/library/album-strip";
import { ScrollRow } from "@/components/library/scroll-row";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Home" };

const NOW = Date.parse("2026-10-16T12:00:00Z");

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

async function Dashboard() {
  const [user, projects, pulse, albums] = await Promise.all([getCurrentUser(), listProjects(), getPulse(), listMyAlbums()]);
  const last = projects[0];
  const strip = last ? (await listAssets(last.id)).filter((a) => a.kind === "photo" && a.id !== last.cover?.id) : [];

  return (
    <div className="mx-3 mt-4 space-y-4 lg:mx-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)_minmax(0,0.95fr)]">
        {/* Greeting */}
        <section className="px-4 pt-6 xl:pr-0">
          <p className="eyebrow-wide">
            {greeting()}, {user.name.split(" ")[0]}
          </p>
          <h1 className="mt-5 font-display text-[54px] leading-[0.98] tracking-[-0.02em] text-ink 2xl:text-[66px]">
            Your memories,
            <br />
            beautifully
            <br />
            <em>in motion.</em>
          </h1>
          <p className="mt-6 max-w-[360px] text-[16px] leading-relaxed text-ink-2">
            A place for every memory that matters. Trips, family, milestones, everyday moments — all the stories that make your life, yours.
          </p>
        </section>

        {/* Continue where you left off */}
        {last && (
          <section className="relative min-h-[380px] overflow-hidden rounded-[22px] border border-white/70 shadow-[0_10px_40px_rgb(70_55_40/0.14)]">
            {last.cover && <img src={last.cover.url} alt="" className="absolute inset-0 size-full object-cover object-[60%_50%]" />}
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent" />
            <div className="relative flex h-full flex-col p-7">
              <p className="eyebrow-wide !tracking-[0.3em]">Continue where you left off</p>
              <h2 className="mt-3 font-display text-[40px] leading-none text-ink 2xl:text-[46px]">{last.name}</h2>
              <p className="mt-2 text-[13px] text-ink-2">Last updated {formatRelative(last.updatedAt, NOW)}</p>
              <p className="mt-4 text-[12.5px] text-ink-2">
                {last.counts.photos.toLocaleString()} photos &nbsp;•&nbsp; {last.counts.albums} albums &nbsp;•&nbsp; {last.counts.contributors} contributors
              </p>
              <Link href={`/projects/${last.id}/uploads`} className="mt-5 flex h-12 w-fit items-center gap-3 rounded-full border border-accent-line bg-white/85 pr-5 pl-2 text-[14px] text-accent shadow-[0_4px_16px_rgb(124_92_240/0.18)] backdrop-blur hover:bg-white">
                <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
                  <Play className="size-3.5 fill-current" />
                </span>
                Continue Organizing <ArrowRight className="size-4" />
              </Link>
              {last.hero?.quote && (
                <p className="absolute top-6 right-8 hidden -rotate-12 font-script text-[25px] leading-[0.95] whitespace-pre-line text-ink/80 md:block">
                  {last.hero.quote} ♡
                </p>
              )}
              <div className="mt-auto grid grid-cols-7 gap-2 pt-6">
                {strip.slice(0, 6).map((a) => (
                  <Link key={a.id} href={`/projects/${last.id}/uploads`} className="aspect-[4/3] overflow-hidden rounded-[6px] border-2 border-white/90 shadow">
                    <img src={a.thumbUrl} alt="" className="size-full object-cover" />
                  </Link>
                ))}
                <Link href={`/projects/${last.id}/uploads`} className="grid aspect-[4/3] place-items-center rounded-[6px] border-2 border-white/90 bg-ink/45 text-[13px] text-white shadow backdrop-blur">
                  +{Math.max(0, strip.length - 6)}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Pulse */}
        <section className="grid min-w-0 content-start gap-2.5">
          <PulseCard href="/upload" icon={<CloudUpload />} title="Recent Uploads" count={pulse.recent.count} unit="new photos" sub={`Added this week${pulse.recent.latest ? ` • ${formatRelative(pulse.recent.latest, NOW)}` : ""}`} thumbs={pulse.recent.thumbs.map((a) => a.thumbUrl)} />
          <PulseCard
            href="/projects"
            icon={<Users />}
            title="Shared with You"
            count={pulse.shared.count}
            unit="new items"
            sub={`From ${pulse.shared.from.slice(0, 2).join(", ")}${pulse.shared.from.length > 2 ? ` and ${pulse.shared.from.length - 2} others` : ""}`}
            thumbs={pulse.shared.thumbs.map((a) => a.thumbUrl)}
          />
          <PulseCard href={last ? `/projects/${last.id}/uploads?filter=review` : "/projects"} icon={<Sparkles />} title="Needs Attention" count={pulse.attention.count} unit="items" sub="Unidentified people, missing dates" thumbs={pulse.attention.thumbs.map((a) => a.thumbUrl)} />
          <PulseCard
            href={last ? `/projects/${last.id}/contributors` : "/projects"}
            icon={<BarChart3 />}
            title="Memory Activity"
            count={pulse.activity.contributors.length}
            unit="contributors"
            sub={`Added ${pulse.activity.added} photos this week`}
            faces={pulse.activity.contributors.map((u) => ({ name: u.name, src: u.avatarUrl }))}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.75fr)_minmax(0,0.95fr)]">
        <section className="glass space-y-7 p-6">
          <div>
            <SectionHead title="Your Projects" href="/projects" />
            <div className="mt-4">
              <ScrollRow>
                {projects.map((p) => (
                  <ProjectTile key={p.id} project={p} />
                ))}
              </ScrollRow>
            </div>
          </div>
          <div>
            <SectionHead title="Recent Albums" href="/projects" />
            <div className="mt-3">
              <AlbumStrip albums={albums} />
            </div>
          </div>
        </section>

        <section className="glass relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -top-3 -right-6 w-[150px] rotate-[9deg]">
            <div className="rounded-sm bg-white p-2 pb-7 shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
              <img src={projects.find((p) => p.category === "travel")?.cover?.thumbUrl ?? last?.cover?.thumbUrl} alt="" className="aspect-square w-full object-cover" />
              <p className="mt-1.5 text-center font-script text-[14px] text-ink-2">Every trip, every story.</p>
            </div>
          </div>
          <h2 className="max-w-[62%] font-display text-[30px] leading-[1.05] text-ink min-[1700px]:max-w-none min-[1700px]:whitespace-nowrap">Start something new</h2>
          <p className="mt-3 max-w-[235px] text-[13.5px] leading-relaxed text-ink-2">Turn your memories into something beautiful. Create a new project, invite family, or start a keepsake book.</p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {[
              ["/projects/new", <BookOpen key="p" />, "Create Project", "Trips, family, milestones or anything in between."],
              [last ? `/projects/${last.id}/albums?new=1` : "/projects/new", <ImageIcon key="a" />, "Create Album", "Organize a collection of photos and videos."],
              [last ? `/projects/${last.id}/settings/sharing` : "/projects", <UserPlus key="i" />, "Invite Contributors", "Gather family and friends to add their memories."],
              ["/stories", <BookOpen key="b" />, "Make a Book", "Turn your memories into a beautiful keepsake."],
            ].map(([href, icon, title, hint]) => (
              <Link key={title as string} href={href as string} className="glass-strong group p-3.5 transition hover:bg-white">
                <span className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent [&>svg]:size-[18px] [&>svg]:stroke-[1.6]">{icon}</span>
                  <span className="min-w-0">
                    <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
                      {title} <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-muted">{hint}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
