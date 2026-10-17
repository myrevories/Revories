import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BookHeart, Plus } from "lucide-react";
import { listProjects, listStories } from "@/lib/data";
import { EmptyState, PageSkeleton } from "@/components/ui";
import { formatRelative, plural } from "@/lib/utils";

export const metadata = { title: "Books" };

const NOW = Date.parse("2026-10-16T12:00:00Z");

export default function BooksPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Books />
    </Suspense>
  );
}

async function Books() {
  const [stories, projects] = await Promise.all([listStories(), listProjects()]);
  return (
    <div className="mx-3 mt-4 lg:mx-6">
      <section className="flex flex-wrap items-end gap-6 px-4 pt-4">
        <div className="flex-1">
          <p className="eyebrow-wide">Keepsakes, made from your memories</p>
          <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink">Books &amp; Stories</h1>
          <p className="mt-3 max-w-xl text-[16px] text-ink-2">Turn any album, trip or season into a storyboard, then into beautiful spreads. Your archive is complete on its own — books are a bonus.</p>
        </div>
        <Link href={projects[0] ? `/projects/${projects[0].id}/stories` : "/projects"} className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[14px] text-white shadow-[0_4px_14px_rgb(0_0_0/0.18)] hover:bg-black">
          <Plus className="size-4" /> Start a Book
        </Link>
      </section>

      <section className="glass mt-6 p-6">
        {stories.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stories.map((s) => (
              <Link key={s.id} href={`/stories/${s.id}/storyboard`} className="group block">
                <div className="relative mx-auto aspect-[4/4.8] w-[82%] overflow-hidden rounded-r-md bg-[#f4efe7] shadow-[12px_16px_30px_rgb(0_0_0/0.22)] transition group-hover:-translate-y-1">
                  {s.cover && <img src={s.cover.thumbUrl} alt="" className="absolute inset-x-0 bottom-0 h-[62%] w-full object-cover" />}
                  <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[#f4efe7] via-[#f4efe7] to-transparent" />
                  <div className="relative px-5 pt-6 text-[#24324a]">
                    <div className="font-display text-[20px] leading-[1.05] tracking-[0.06em] uppercase">{s.title}</div>
                    {s.subtitle && <div className="mt-1.5 text-[8.5px] tracking-[0.3em] uppercase">{s.subtitle}</div>}
                  </div>
                  <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/20 to-transparent" />
                </div>
                <div className="mt-4 text-center">
                  <div className="font-display text-[20px] text-ink">{s.title}</div>
                  <div className="text-[12px] text-muted">
                    {projects.find((p) => p.id === s.projectId)?.name} · {plural(s.sectionCount, "section")} · edited {formatRelative(s.updatedAt, NOW)}
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-accent">
                    Open storyboard <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={<BookHeart />} title="No books yet" body="Open any album and choose “Create Book”. Your archive is complete on its own — books are a bonus." />
        )}
      </section>
    </div>
  );
}
