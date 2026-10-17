import { Suspense } from "react";
import { listAssets } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { ReviewWorkspace } from "@/components/review/review-workspace";

export const metadata = { title: "Review & organize" };

export default function ReviewPage({ params }: PageProps<"/projects/[projectId]/uploads/review">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Review params={params} />
    </Suspense>
  );
}

async function Review({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // The queue: everything not yet reviewed, newest first.
  const queue = (await listAssets(projectId))
    .filter((a) => a.status !== "reviewed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <ProjectScope projectId={projectId}>{() => <ReviewWorkspace initial={queue} />}</ProjectScope>;
}
