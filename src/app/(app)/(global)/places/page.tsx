import { Suspense } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { listMyPeopleAndPlaces } from "@/lib/data";
import { PageSkeleton } from "@/components/ui";
import { MiniMap } from "@/components/places/mini-map";
import { plural } from "@/lib/utils";

export const metadata = { title: "Places" };

export default function PlacesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Places />
    </Suspense>
  );
}

async function Places() {
  const { places, projects } = await listMyPeopleAndPlaces();
  const pins = places.filter((p) => p.lat != null && p.lng != null).map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, thumb: p.cover?.thumbUrl }));
  return (
    <div className="mx-3 mt-4 lg:mx-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <section className="px-4 pt-4">
          <p className="eyebrow-wide">Where it all happened</p>
          <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink">Places</h1>
          <p className="mt-3 max-w-md text-[16px] text-ink-2">Lake houses, hometowns, faraway islands — every place your memories were made.</p>
        </section>
        <div className="glass overflow-hidden p-2">
          <MiniMap pins={pins} className="h-[340px] w-full rounded-[16px]" />
        </div>
      </div>
      <section className="glass mt-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {places.map((p) => (
            <Link key={p.id} href={`/projects/${p.projectId}/places?place=${p.id}`} className="glass-strong flex items-center gap-3 p-3 hover:bg-white">
              <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-sunken">{p.cover && <img src={p.cover.thumbUrl} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[14px] text-ink">
                  <MapPin className="size-3.5 text-accent" /> {p.name}
                </span>
                <span className="block truncate text-[12px] text-ink-2">{p.address}</span>
                <span className="block text-[11px] text-muted">
                  {plural(p.count, "memory", "memories")} · {projects.find((x) => x.id === p.projectId)?.name}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
