import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { listTrash } from "@/lib/data";
import { PageBody } from "@/components/project-scope";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { TrashList } from "@/components/assets/trash-list";

export const metadata = { title: "Trash" };

export default function TrashPage({ params }: PageProps<"/projects/[projectId]/trash">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Trash params={params} />
    </Suspense>
  );
}

async function Trash({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const items = await listTrash(projectId);
  return (
    <PageBody>
      <PageHeader eyebrow="Trash" title="Recently deleted" description="Deleted memories wait here so nothing is lost by accident. Restore them anytime." />
      <div className="mt-6">
        {items.length ? <TrashList assets={items} /> : <EmptyState icon={<Trash2 />} title="The trash is empty" body="Anything you delete from this project will show up here first." />}
      </div>
    </PageBody>
  );
}
