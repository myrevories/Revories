import { Suspense } from "react";
import { FolderHeart } from "lucide-react";
import { listAlbums } from "@/lib/data";
import { PageBody, ProjectScope } from "@/components/project-scope";
import { EmptyState, PageHeader, PageSkeleton, SectionTitle } from "@/components/ui";
import { AlbumCard } from "@/components/albums/album-card";
import { NewAlbumButton } from "@/components/albums/new-album";

export const metadata = { title: "Albums" };

export default function AlbumsPage({ params }: PageProps<"/projects/[projectId]/albums">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Albums params={params} />
    </Suspense>
  );
}

async function Albums({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const albums = await listAlbums(projectId);
  const manual = albums.filter((a) => a.kind !== "smart");
  const smart = albums.filter((a) => a.kind === "smart");
  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <PageBody>
          <PageHeader
            eyebrow="Albums"
            title="Collections in this archive"
            description="Albums group memories by era, event, or family branch. A photo can live in several albums without leaving the archive."
            actions={<NewAlbumButton />}
          />
          <div className="mt-8">
            {manual.length > 1 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
                {manual.map((al) => (
                  <AlbumCard key={al.id} album={al} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FolderHeart />}
                title="No albums yet"
                body="Make one for a trip, a holiday, or a branch of the family. You can also select photos anywhere and choose “New album from selection.”"
                action={<NewAlbumButton />}
              />
            )}
          </div>
          {smart.length > 0 && (
            <div className="mt-12">
              <SectionTitle title="Smart albums" hint="These fill themselves based on a rule — like every photo from 1992, or everything at the lake house." />
              <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
                {smart.map((al) => (
                  <AlbumCard key={al.id} album={al} />
                ))}
              </div>
            </div>
          )}
        </PageBody>
      )}
    </ProjectScope>
  );
}
