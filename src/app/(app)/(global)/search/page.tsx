import { Suspense } from "react";
import { Search } from "lucide-react";
import { listAssets, listProjects } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { EmptyState, PageSkeleton, SectionTitle } from "@/components/ui";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { plural } from "@/lib/utils";

export const metadata = { title: "Search" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <Suspense fallback={<PageSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const projects = await listProjects();
  const groups = q ? await Promise.all(projects.map(async (p) => ({ project: p, assets: await listAssets(p.id, { q }) }))) : [];
  const total = groups.reduce((n, g) => n + g.assets.length, 0);

  return (
    <>
      <form action="/search" className="relative max-w-2xl">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-faint" />
        <input name="q" defaultValue={q} autoFocus placeholder="Search people, places, events, years, captions…" className="field h-12 rounded-2xl pl-12 text-[15px]" />
      </form>
      {q && <p className="mt-4 text-[13px] text-muted">{plural(total, "result")} for “{q}”</p>}
      <div className="mt-8 space-y-10">
        {groups
          .filter((g) => g.assets.length)
          .map((g) => (
            <section key={g.project.id}>
              <SectionTitle title={g.project.name} hint={plural(g.assets.length, "match", "matches")} />
              <ProjectScope projectId={g.project.id}>{() => <AssetBrowser assets={g.assets} />}</ProjectScope>
            </section>
          ))}
        {q && !total && <EmptyState icon={<Search />} title="Nothing found" body="Try a person’s first name, a place, an event, or a year like 1992." />}
      </div>
    </>
  );
}
