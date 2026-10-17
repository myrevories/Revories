import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAssetsById, getProjectMeta, getStory, listAssets } from "@/lib/data";
import { TopBar } from "@/components/shell/top-bar";
import { PageSkeleton } from "@/components/ui";
import { Storyboard } from "@/components/studio/storyboard";

export const metadata = { title: "Book storyboard" };

export default function StoryboardPage({ params }: PageProps<"/stories/[storyId]/storyboard">) {
  return (
    <>
      <TopBar />
      <Suspense fallback={<PageSkeleton />}>
        <Load params={params} />
      </Suspense>
    </>
  );
}

async function Load({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const found = await getStory(storyId);
  if (!found) notFound();
  const { story, sections } = found;
  const [assets, meta] = await Promise.all([listAssets(story.projectId, story.albumId ? { albumId: story.albumId } : {}), getProjectMeta(story.projectId)]);
  const [cover] = await getAssetsById([sections[0]?.assetIds[1] ?? sections[0]?.assetIds[0] ?? ""]);
  return <Storyboard story={{ ...story, coverUrl: cover?.url }} projectId={story.projectId} initialSections={sections} assets={assets} places={meta.places} />;
}
