import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Home, MapPin, MoreHorizontal, Sun, Users, UsersRound } from "lucide-react";
import { getProjectMeta, listAssets, listMembers } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { fmtRange } from "@/lib/utils";
import { EventGallery } from "@/components/events/event-gallery";

export default function EventPage({ params }: PageProps<"/projects/[projectId]/events/[eventId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: { params: Promise<{ projectId: string; eventId: string }> }) {
  const { projectId, eventId } = await params;
  const [meta, members] = await Promise.all([getProjectMeta(projectId), listMembers(projectId)]);
  const event = meta.events.find((e) => e.id === eventId);
  if (!event) notFound();
  const assets = await listAssets(projectId, { eventId });
  const place = meta.places.find((p) => p.id === event.placeId);
  const parent = meta.events.find((e) => e.id === event.parentEventId);
  const occurrences = meta.events.filter((e) => e.parentEventId === event.id);
  const people = new Set(assets.flatMap((a) => a.people.map((p) => p.personId))).size;
  const contributors = new Set(assets.map((a) => a.uploadedBy ?? a.contributorName)).size;
  const names = Object.fromEntries(members.map((m) => [m.userId, m.user.name]));
  const years = assets.map((a) => a.takenAt?.slice(0, 4)).filter(Boolean).sort();
  const dates = fmtRange(event.startDate, event.endDate) ?? (years.length ? `${years[0]}${years.at(-1) !== years[0] ? ` – ${years.at(-1)}` : ""}` : "Dates not set");

  const info: [React.ReactNode, string][] = [
    [<CalendarDays key="d" />, dates],
    [<MapPin key="l" />, place?.address ?? "Location not set"],
    [<Sun key="w" className="!text-[#e9a23b]" />, event.weather ?? "Weather not recorded"],
    [<Users key="p" />, `${people} family members`],
    [<Home key="v" />, place?.name ?? "Venue not set"],
    [<UsersRound key="c" />, `${contributors} contributors`],
  ];

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <div>
          <div className="glass p-6">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-2">
              <Link href={`/projects/${projectId}/events`} className="hover:text-ink">
                Events
              </Link>
              {parent && (
                <>
                  <ChevronRight className="size-3" />
                  <Link href={`/projects/${projectId}/events/${parent.id}`} className="hover:text-ink">
                    {parent.name}
                  </Link>
                </>
              )}
              <ChevronRight className="size-3" />
              <span className="text-ink">{event.startDate?.slice(0, 4) ?? event.name}</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-[40px] leading-[1.02] font-medium text-ink">{event.name}</h1>
                {place?.address && <p className="font-serif text-[22px] text-ink">{place.address}</p>}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/projects/${projectId}/events/${eventId}/book`}
                  className="flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[12.5px] text-ink-2 shadow-[var(--shadow-soft)] hover:text-ink"
                >
                  Add to Book Project
                </Link>
                <span className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink-2 shadow-[var(--shadow-soft)]">
                  <MoreHorizontal className="size-4" />
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {info.map(([icon, text], i) => (
                <div key={i} className="flex h-11 items-center gap-3 rounded-xl border border-line bg-surface px-4 text-[13px] text-ink-2 [&>svg]:size-[18px] [&>svg]:text-iconblue">
                  {icon}
                  {text}
                </div>
              ))}
            </div>
            {event.description && <p className="mt-4 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">{event.description}</p>}
            {occurrences.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="text-ink-2">Years:</span>
                {occurrences.map((o) => (
                  <Link key={o.id} href={`/projects/${projectId}/events/${o.id}`} className="rounded-full bg-event-soft px-3 py-1 text-event hover:brightness-95">
                    {o.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6">
              <EventGallery assets={assets} contributors={names} bookHref={`/projects/${projectId}/events/${eventId}/book`} />
            </div>
          </div>
        </div>
      )}
    </ProjectScope>
  );
}
