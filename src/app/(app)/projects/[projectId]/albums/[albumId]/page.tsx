import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Home } from "lucide-react";
import { getAlbum, getProject, getProjectMeta, listAssets } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { AlbumGallery } from "@/components/assets/album-gallery";
import { AboutAlbum, AlbumActions } from "@/components/project/album-side";
import { PeopleRow, PlacesCardBody, SideCard } from "@/components/project/side-cards";
import { plural } from "@/lib/utils";

export default function AlbumPage(props: PageProps<"/projects/[projectId]/albums/[albumId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Album {...props} />
    </Suspense>
  );
}

async function Album({ params }: PageProps<"/projects/[projectId]/albums/[albumId]">) {
  const { projectId, albumId } = await params;
  const [album, project, meta] = await Promise.all([getAlbum(albumId), getProject(projectId), getProjectMeta(projectId)]);
  if (!album || !project || album.projectId !== projectId) notFound();
  const assets = await listAssets(projectId, { albumId });
  const base = `/projects/${projectId}`;
  const people = meta.people.filter((p) => assets.some((a) => a.people.some((x) => x.personId === p.id)));
  const places = meta.places.filter((p) => assets.some((a) => a.placeId === p.id));
  const placeCounts = Object.fromEntries(places.map((p) => [p.id, assets.filter((a) => a.placeId === p.id).length]));
  const placeThumbs = Object.fromEntries(places.map((p) => [p.id, assets.find((a) => a.placeId === p.id && a.kind === "photo")?.thumbUrl]));
  const tags = meta.tags.map((t) => ({ ...t, n: assets.filter((a) => a.tagIds.includes(t.id)).length })).filter((t) => t.n).sort((a, b) => b.n - a.n);

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="glass min-w-0 p-5 lg:p-6">
            <nav className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
              <Home className="size-4" />
              <Link href="/projects" className="hover:text-ink">
                Library
              </Link>
              <span>/</span>
              <Link href={base} className="hover:text-ink">
                {project.name}
              </Link>
              <span>/</span>
              <span className="font-medium text-ink">{album.name}</span>
            </nav>
            <div className="relative mt-4 flex flex-wrap items-center gap-6">
              <span className="h-[96px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-sunken shadow">{album.cover && <img src={album.cover.thumbUrl} alt="" className="size-full object-cover" />}</span>
              <div className="min-w-0">
                <h1 className="font-display text-[44px] leading-none text-ink 2xl:text-[56px]">{album.name}</h1>
                <p className="mt-3 font-display text-[17px] text-ink-2">
                  {[album.years, plural(album.count, "memory", "memories"), plural(album.peopleCount, "person", "people"), plural(album.placeCount, "place")].filter(Boolean).join("  ·  ")}
                </p>
              </div>
              <p className="absolute top-0 right-2 hidden -rotate-12 font-script text-[25px] leading-[0.95] text-ink/80 2xl:block">
                Same people.
                <br />
                &nbsp;New generations.
                <br />
                &nbsp;&nbsp;Always special. ♡
              </p>
            </div>
            <div className="mt-5">
              <AlbumGallery initial={assets} albumId={album.kind === "manual" ? album.id : undefined} />
            </div>
          </section>

          <aside className="space-y-3">
            <AlbumActions albumId={album.id} albumName={album.name} assetIds={assets.map((a) => a.id)} />
            <AboutAlbum albumId={album.id} description={album.description} />
            <SideCard title="People in This Album" href={`${base}/people`}>
              {people.length ? <PeopleRow people={people} href={`${base}/people`} /> : <p className="text-[12.5px] text-muted">No one tagged yet.</p>}
            </SideCard>
            {places.length > 0 && (
              <SideCard title="Places" href={`${base}/places`}>
                <PlacesCardBody places={places} counts={placeCounts} thumbs={placeThumbs} href={`${base}/places`} unit="memories" />
              </SideCard>
            )}
            {tags.length > 0 && (
              <SideCard title="Tags" href={`${base}/uploads`}>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 6).map((t) => (
                    <Link key={t.id} href={`${base}/uploads?tag=${t.id}`} className="flex h-8 items-center gap-2 rounded-full bg-white/75 px-3.5 text-[12.5px] text-ink hover:bg-white">
                      {t.name} <span className="text-[11px] text-muted">{t.n}</span>
                    </Link>
                  ))}
                </div>
              </SideCard>
            )}
            <section className="glass p-5">
              <h3 className="font-display text-[23px] text-ink">Create a Book or Story</h3>
              <div className="mt-3 flex items-center gap-4">
                <span className="h-[62px] w-[90px] shrink-0 -rotate-3 overflow-hidden rounded-sm bg-white p-1 shadow-[0_6px_16px_rgb(0_0_0/0.15)]">
                  {album.cover && <img src={album.cover.thumbUrl} alt="" className="size-full object-cover" />}
                </span>
                <p className="flex-1 text-[12.5px] text-ink-2">Turn these memories into a beautiful book or story.</p>
                <Link href={`${base}/stories`} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[12.5px] font-medium text-accent hover:bg-accent hover:text-white">
                  Create Book <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}
    </ProjectScope>
  );
}

