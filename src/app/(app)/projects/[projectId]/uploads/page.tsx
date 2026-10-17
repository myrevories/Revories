import { Suspense } from "react";
import { listAssets } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { UploadReview } from "@/components/upload/upload-review";

export const metadata = { title: "Upload & review" };

export default function UploadsPage(props: PageProps<"/projects/[projectId]/uploads">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Uploads {...props} />
    </Suspense>
  );
}

const FILTERS = ["all", "review", "album", "people", "location", "duplicates"] as const;

async function Uploads({ params, searchParams }: PageProps<"/projects/[projectId]/uploads">) {
  const [{ projectId }, sp] = await Promise.all([params, searchParams]);
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filter = FILTERS.find((f) => f === one("filter"));
  const assets = await listAssets(projectId, { tagId: one("tag") });
  return (
    <ProjectScope projectId={projectId}>
      {(project) => <UploadReview initial={assets} projectName={project.name} initialFilter={filter} initialAlbumId={one("album")} initialFocus={one("focus")} />}
    </ProjectScope>
  );
}
