import { Suspense } from "react";
import Link from "next/link";
import { listMyPeopleAndPlaces } from "@/lib/data";
import { Avatar, PageSkeleton } from "@/components/ui";
import { plural } from "@/lib/utils";

export const metadata = { title: "People" };

export default function PeoplePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <People />
    </Suspense>
  );
}

async function People() {
  const { people, projects } = await listMyPeopleAndPlaces();
  return (
    <div className="mx-3 mt-4 lg:mx-6">
      <section className="px-4 pt-4">
        <p className="eyebrow-wide">The faces in your stories</p>
        <h1 className="mt-3 font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-ink">People</h1>
        <p className="mt-3 max-w-xl text-[16px] text-ink-2">Everyone you’ve tagged, across all your projects. Tap someone to see every memory they’re in.</p>
      </section>
      {projects
        .filter((p) => people.some((x) => x.projectId === p.id))
        .map((p) => (
          <section key={p.id} className="glass mt-5 p-6">
            <h2 className="font-display text-[28px] text-ink">{p.name}</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 xl:grid-cols-9">
              {people
                .filter((x) => x.projectId === p.id)
                .map((x) => (
                  <Link key={x.id} href={`/projects/${p.id}/people?person=${x.id}`} className="glass-strong flex flex-col items-center p-4 text-center hover:bg-white">
                    <Avatar name={x.name} src={x.avatarUrl} size={72} />
                    <span className="mt-2 text-[14px] text-ink">{x.name}</span>
                    <span className="text-[11.5px] text-muted">{plural(x.count, "memory", "memories")}</span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
    </div>
  );
}
