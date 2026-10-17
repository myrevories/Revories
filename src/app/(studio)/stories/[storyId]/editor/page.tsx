import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProjectMeta, getSpreads, getStory, listAssets } from "@/lib/data";
import { Skeleton } from "@/components/ui";
import { SpreadEditor } from "@/components/studio/spread-editor";

export const metadata = { title: "Spread editor" };

export default function EditorPage(props: PageProps<"/stories/[storyId]/editor">) {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-full" />}>
      <Load {...props} />
    </Suspense>
  );
}

async function Load({ params, searchParams }: PageProps<"/stories/[storyId]/editor">) {
  const [{ storyId }, sp] = await Promise.all([params, searchParams]);
  const found = await getStory(storyId);
  if (!found) notFound();
  const [spreads, assets, meta] = await Promise.all([getSpreads(storyId), listAssets(found.story.projectId), getProjectMeta(found.story.projectId)]);
  return (
    <SpreadEditor
      story={found.story}
      sections={found.sections}
      initialSpreads={spreads}
      assets={assets}
      places={meta.places.filter((p) => p.lat != null && p.lng != null)}
      initialSectionId={typeof sp.section === "string" ? sp.section : undefined}
    />
  );
}
