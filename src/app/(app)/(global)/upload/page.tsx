import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, FolderPlus } from "lucide-react";
import { listProjects } from "@/lib/data";
import { ButtonLink, PageSkeleton } from "@/components/ui";
import { plural } from "@/lib/utils";

export const metadata = { title: "Upload" };

/** Uploading starts by choosing a project — one decision, then the dropzone. */
export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="eyebrow mb-1.5">Upload</div>
      <h1 className="font-serif text-[32px] leading-tight font-medium">Where should these go?</h1>
      <p className="mt-2 text-[14px] text-muted">Pick a project. You can choose an album and add details on the next step — or skip that and sort later.</p>
      <Suspense fallback={<PageSkeleton />}>
        <Choices />
      </Suspense>
    </div>
  );
}

async function Choices() {
  const projects = (await listProjects()).filter((p) => p.role !== "viewer");
  return (
    <div className="mt-8 space-y-2">
      {projects.map((p) => (
        <Link key={p.id} href={`/projects/${p.id}/uploads`} className="card flex items-center gap-4 p-3 transition hover:shadow-[var(--shadow-lift)]">
          <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-sunken">{p.cover && <img src={p.cover.thumbUrl} alt="" className="size-full object-cover" />}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">{p.name}</div>
            <div className="text-[12.5px] text-muted">{plural(p.counts.assets, "memory", "memories")}</div>
          </div>
          <ChevronRight className="size-5 text-faint" />
        </Link>
      ))}
      <ButtonLink href="/projects/new" variant="ghost" className="mt-2 w-full">
        <FolderPlus className="size-4" /> Start a new project instead
      </ButtonLink>
    </div>
  );
}
