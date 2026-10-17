import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProjectMeta, listAssets } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { BookMaker, type Moment } from "@/components/events/book-maker";
import { fmtRange } from "@/lib/utils";

export const metadata = { title: "Book maker" };

const MOMENT_NAMES = ["Arrival", "Dock & Lake", "Cooking & Eating", "Group Photo", "Sunset & Reflections"];

export default function BookMakerPage(props: PageProps<"/projects/[projectId]/events/[eventId]/book">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Load {...props} />
    </Suspense>
  );
}

async function Load({ params, searchParams }: PageProps<"/projects/[projectId]/events/[eventId]/book">) {
  const [{ projectId, eventId }, sp] = await Promise.all([params, searchParams]);
  const meta = await getProjectMeta(projectId);
  const event = meta.events.find((e) => e.id === eventId);
  if (!event) notFound();
  const pool = (await listAssets(projectId, { eventId })).filter((a) => a.kind === "photo").sort((a, b) => (a.takenAt ?? "").localeCompare(b.takenAt ?? ""));
  const picked = typeof sp.ids === "string" ? sp.ids.split(",").filter((id) => pool.some((a) => a.id === id)) : pool.slice(0, 15).map((a) => a.id);

  // Start with a gentle chronological grouping: a few photos per moment.
  const sizes = [3, 4, 3, 3, 2];
  const moments: Moment[] = [];
  let i = 0;
  for (let m = 0; i < picked.length; m++) {
    const n = sizes[m] ?? 3;
    moments.push({ id: `m-${m}`, title: MOMENT_NAMES[m] ?? `Moment ${m + 1}`, assetIds: picked.slice(i, i + n) });
    i += n;
  }
  const place = meta.places.find((p) => p.id === event.placeId);
  const people = new Set(pool.flatMap((a) => a.people.map((p) => p.personId))).size;
  const contributors = new Set(pool.map((a) => a.uploadedBy ?? a.contributorName)).size;
  const parent = meta.events.find((e) => e.id === event.parentEventId);
  const details: [string, string][] = [
    ["date", fmtRange(event.startDate, event.endDate) ?? "Dates not set"],
    ["place", place?.address ?? "Location not set"],
    ["weather", event.weather ?? "Weather not recorded"],
    ["people", `${people} family members`],
    ["venue", place?.name ?? "Venue not set"],
    ["contributors", `${contributors} contributors`],
  ];
  const artifacts = (await listAssets(projectId)).filter((a) => a.kind === "artifact" || a.kind === "document").slice(0, 3);

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <div>
          <div className="glass p-6">
            <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-2">
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
              <Link href={`/projects/${projectId}/events/${event.id}`} className="hover:text-ink">
                {event.startDate?.slice(0, 4) ?? event.name}
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-ink">Book Maker</span>
            </nav>
            <BookMaker projectId={projectId} event={event} pool={pool} initialMoments={moments} details={details} artifacts={artifacts} />
          </div>
        </div>
      )}
    </ProjectScope>
  );
}
