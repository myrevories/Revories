import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAssetsById, getStory } from "@/lib/data";
import { TopBar } from "@/components/shell/top-bar";
import { PageSkeleton } from "@/components/ui";
import { BookOptions } from "@/components/studio/book-options";

export const metadata = { title: "Book options" };

export default function BookOptionsPage({ params }: PageProps<"/stories/[storyId]/book">) {
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
  const [cover] = await getAssetsById([sections[0]?.assetIds[1] ?? sections[0]?.assetIds[0] ?? ""]);
  return <BookOptions story={{ ...story, coverUrl: cover?.url }} />;
}
