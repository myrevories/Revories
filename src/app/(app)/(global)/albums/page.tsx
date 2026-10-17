import { Suspense } from "react";
import { listMyAlbums, listProjects } from "@/lib/data";
import { PageSkeleton } from "@/components/ui";
import { AlbumStrip } from "@/components/library/album-strip";

export const metadata = { title: "Albums" };

export default function AlbumsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Albums />
    </Suspense>
  );
}

async function Albums() {
  const [albums, projects] = await Promise.all([listMyAlbums(), listProjects()]);
  return (
    <div className="mx-3 mt-4 lg:mx-6">
      <section className="px-4 pt-4">
        <p className="eyebrow-wide">Every collection</p>
        <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink">All Albums</h1>
      </section>
      {projects
        .filter((p) => albums.some((a) => a.projectId === p.id))
        .map((p) => (
          <section key={p.id} className="glass mt-5 p-6">
            <h2 className="mb-3 font-display text-[28px] text-ink">{p.name}</h2>
            <AlbumStrip albums={albums.filter((a) => a.projectId === p.id)} wide />
          </section>
        ))}
    </div>
  );
}
