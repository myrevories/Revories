import { Suspense } from "react";
import Link from "next/link";
import { BookHeart, ChevronRight } from "lucide-react";
import { listAlbums, listAssets, listStories } from "@/lib/data";
import { PageBody, ProjectScope } from "@/components/project-scope";
import { EmptyState, PageHeader, PageSkeleton, SectionTitle } from "@/components/ui";
import { AssetThumb } from "@/components/assets/asset-browser";
import { MakeBookButton } from "@/components/stories/make-book";
import { formatRelative, plural } from "@/lib/utils";

export const metadata = { title: "Stories & books" };

const STEP_LABEL = { plan: "Planning", design: "Designing", review: "Reviewing", publish: "Ready to publish" } as const;

export default function ProjectStoriesPage({ params }: PageProps<"/projects/[projectId]/stories">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Stories params={params} />
    </Suspense>
  );
}

async function Stories({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [stories, albums, assets] = await Promise.all([listStories(projectId), listAlbums(projectId), listAssets(projectId)]);
  const starters = albums.filter((a) => a.kind === "manual" && a.count > 0).slice(0, 4);

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <PageBody>
          <PageHeader
            eyebrow="Optional"
            title="Stories & books"
            description="When you’re ready, turn an album or event into a printed story. Your archive is complete without one — this is just a bonus."
          />
          <div className="mt-8">
            {stories.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map((s) => (
                  <Link key={s.id} href={`/stories/${s.id}/storyboard`} className="card group overflow-hidden transition hover:shadow-[var(--shadow-lift)]">
                    <div className="aspect-[16/10] bg-sunken">{s.cover && <AssetThumb asset={s.cover} className="size-full" />}</div>
                    <div className="p-4">
                      <div className="font-serif text-[18px] font-medium">{s.title}</div>
                      <div className="mt-0.5 text-[12px] text-muted">
                        {STEP_LABEL[s.step]} · {plural(s.sectionCount, "section")} · edited {formatRelative(s.updatedAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookHeart />}
                title="No books yet — and that’s okay"
                body="Books are made from memories you’ve already organized. Pick an album below to start one whenever you like."
                action={assets.length ? <MakeBookButton variant="primary" title="Our story" assetIds={assets.slice(0, 40).map((a) => a.id)} /> : undefined}
              />
            )}
          </div>
          {starters.length > 0 && (
            <section className="mt-12">
              <SectionTitle title="Start from an album" hint="Each becomes a storyboard you can shape section by section." />
              <div className="card divide-y divide-line">
                {starters.map((al) => (
                  <div key={al.id} className="flex items-center gap-4 p-3">
                    {al.cover ? <AssetThumb asset={al.cover} className="size-12 rounded-lg" /> : <div className="size-12 rounded-lg bg-sunken" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold">{al.name}</div>
                      <div className="text-[12px] text-muted">{plural(al.count, "item")}</div>
                    </div>
                    <Link href={`/projects/${projectId}/albums/${al.id}`} className="hidden items-center gap-1 text-[12.5px] text-muted hover:text-ink sm:flex">
                      View <ChevronRight className="size-3.5" />
                    </Link>
                    <MakeBookButton title={al.name} albumId={al.id} assetIds={assets.filter((a) => a.albumIds.includes(al.id)).map((a) => a.id)} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </PageBody>
      )}
    </ProjectScope>
  );
}
