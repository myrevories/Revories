import { Suspense } from "react";
import { CalendarHeart } from "lucide-react";
import { getProjectMeta, listAssets, listMembers } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { EmptyState, PageSkeleton } from "@/components/ui";
import { NewEventButton } from "@/components/events/new-event";
import { EventDirectory, type EventCardData } from "@/components/events/event-directory";

export const metadata = { title: "Gatherings & events" };

export default function EventsPage({ params }: PageProps<"/projects/[projectId]/events">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Events params={params} />
    </Suspense>
  );
}

async function Events({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [meta, assets, members] = await Promise.all([getProjectMeta(projectId), listAssets(projectId), listMembers(projectId)]);
  const nameOf = (id?: string) => members.find((m) => m.userId === id)?.user.name;

  // Top-level events only; yearly occurrences roll up into their tradition.
  const cards: EventCardData[] = meta.events
    .filter((e) => !e.parentEventId)
    .map((e) => {
      const ids = new Set([e.id, ...meta.events.filter((x) => x.parentEventId === e.id).map((x) => x.id)]);
      const items = assets.filter((a) => a.eventId && ids.has(a.eventId));
      const years = items.map((a) => a.takenAt?.slice(0, 4)).filter((y): y is string => !!y).sort();
      const places = new Set(items.map((a) => a.placeId).filter(Boolean));
      const place = meta.places.find((p) => p.id === e.placeId);
      const contributors = [...new Set(items.map((a) => nameOf(a.uploadedBy) ?? a.contributorName).filter((n): n is string => !!n))];
      return {
        id: e.id,
        name: e.name,
        recurring: e.recurring,
        cover: items.find((a) => a.kind === "photo")?.thumbUrl,
        years: years.length ? (years.at(-1) === years[0] ? years[0] : `${years[0]} – ${years.at(-1)}`) : "",
        location: places.size > 1 ? "Various Locations" : (place?.address ?? meta.places.find((p) => places.has(p.id))?.address ?? "Location not set"),
        photos: items.filter((a) => a.kind === "photo").length,
        videos: items.filter((a) => a.kind === "video").length,
        contributors,
        venue: places.size > 1 ? "Rotating Location" : (place?.name ?? meta.places.find((p) => places.has(p.id))?.name ?? "—"),
        firstYear: years[0] ? Number(years[0]) : undefined,
        placeId: e.placeId,
        branches: [...new Set(items.flatMap((a) => a.people.map((p) => meta.people.find((x) => x.id === p.personId)?.branch)).filter((b): b is string => !!b))],
      };
    });

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <div>
          <div className="glass p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10.5px] font-medium tracking-[0.2em] text-ink-2 uppercase">Gather together</div>
                <h1 className="mt-1 font-serif text-[40px] leading-[1.02] font-medium text-ink">Family Gatherings &amp; Events</h1>
                <p className="mt-1 text-[14px] text-ink-2">All of our memories, organized by the moments that bring us together.</p>
              </div>
              <NewEventButton />
            </div>
            {cards.length ? (
              <EventDirectory cards={cards} branches={[...new Set(meta.people.map((p) => p.branch).filter((b): b is string => !!b))]} places={meta.places} />
            ) : (
              <EmptyState className="mt-6" icon={<CalendarHeart />} title="No events yet" body="Events gather photos from a holiday, reunion, or tradition — even across many years." action={<NewEventButton />} />
            )}
          </div>
          <p className="mt-6 text-center font-script text-[26px] text-[#3a4a6b]">
            “Same people. New chapters. A lifetime of together.” <span className="ml-2 font-sans text-[10px] tracking-[0.2em] text-muted uppercase">— the family</span>
          </p>
        </div>
      )}
    </ProjectScope>
  );
}
