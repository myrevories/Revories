import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { getProjectMeta, listAssets } from "@/lib/data";
import { PageBody, ProjectScope } from "@/components/project-scope";
import { EmptyState, PageHeader, PageSkeleton, SectionTitle } from "@/components/ui";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { PlacesView } from "@/components/places/places-view";
import { plural } from "@/lib/utils";

export const metadata = { title: "Places" };

export default function PlacesPage(props: PageProps<"/projects/[projectId]/places">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Places {...props} />
    </Suspense>
  );
}

async function Places({ params, searchParams }: PageProps<"/projects/[projectId]/places">) {
  const [{ projectId }, sp] = await Promise.all([params, searchParams]);
  const placeId = typeof sp.place === "string" ? sp.place : undefined;
  const [meta, assets] = await Promise.all([getProjectMeta(projectId), listAssets(projectId)]);
  const counts = Object.fromEntries(meta.places.map((p) => [p.id, assets.filter((a) => a.placeId === p.id).length]));
  const place = meta.places.find((p) => p.id === placeId);
  const here = place ? assets.filter((a) => a.placeId === place.id) : [];

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <PageBody wide>
          <PageHeader eyebrow="Places" title="Where our memories happened" description="Every saved place, on a map. Pick one to see the photos taken there." />
          <div className="mt-6">
            <PlacesView counts={counts} selectedId={placeId} />
          </div>
          {place && (
            <section className="mt-10">
              <SectionTitle title={place.name} hint={`${place.address ? `${place.address} · ` : ""}${plural(here.length, "photo")} · ${place.precision === "exact" ? "exact location" : "approximate location"}`} />
              <AssetBrowser
                assets={here}
                empty={<EmptyState icon={<MapPin />} title="No photos here yet" body="Tag photos with this place while reviewing, and they’ll show up here." />}
              />
            </section>
          )}
        </PageBody>
      )}
    </ProjectScope>
  );
}
