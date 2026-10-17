import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { getAssetsById, getProjectMeta, listAssets } from "@/lib/data";
import { PageBody, ProjectScope } from "@/components/project-scope";
import { Avatar, Chip, EmptyState, PageHeader, PageSkeleton, SectionTitle } from "@/components/ui";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { AddPersonButton, MergePeopleButton } from "@/components/people/people-actions";
import { plural } from "@/lib/utils";

export const metadata = { title: "People" };

export default function PeoplePage(props: PageProps<"/projects/[projectId]/people">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <People {...props} />
    </Suspense>
  );
}

async function People({ params, searchParams }: PageProps<"/projects/[projectId]/people">) {
  const [{ projectId }, sp] = await Promise.all([params, searchParams]);
  const personId = typeof sp.person === "string" ? sp.person : undefined;
  const [meta, assets] = await Promise.all([getProjectMeta(projectId), listAssets(projectId)]);
  const avatars = await getAssetsById(meta.people.map((p) => p.avatarAssetId).filter((x): x is string => !!x));
  const avatarOf = (id?: string) => avatars.find((a) => a.id === id)?.thumbUrl;
  const countOf = (id: string) => assets.filter((a) => a.people.some((p) => p.personId === id)).length;
  const person = meta.people.find((p) => p.id === personId);

  if (person) {
    const theirs = assets.filter((a) => a.people.some((p) => p.personId === person.id));
    return (
      <ProjectScope projectId={projectId}>
        {() => (
          <PageBody wide>
            <Link href={`/projects/${projectId}/people`} className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted hover:text-ink">
              <ChevronLeft className="size-4" /> Everyone
            </Link>
            <div className="flex flex-wrap items-center gap-5">
              <Avatar name={person.name} src={person.avatarUrl ?? avatarOf(person.avatarAssetId)} size={84} />
              <div>
                <h1 className="font-serif text-[30px] font-medium">{person.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {person.branch && <Chip kind="branch">{person.branch}</Chip>}
                  {person.birthYear && <Chip kind="year">Born {person.birthYear}</Chip>}
                  <span className="text-[12.5px] text-muted">{plural(theirs.length, "photo")}</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <AssetBrowser
                assets={theirs}
                empty={<EmptyState icon={<Users />} title={`No photos of ${person.name.split(" ")[0]} yet`} body="Tag them in Review & Organize, or add them to photos from any album." />}
              />
            </div>
          </PageBody>
        )}
      </ProjectScope>
    );
  }

  const branches = [...new Set(meta.people.map((p) => p.branch ?? "Other family"))];

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <PageBody>
          <PageHeader
            eyebrow="People"
            title="Everyone in the archive"
            description="Tag people once and every photo of them is a click away. Group them by family branch."
            actions={
              <>
                <MergePeopleButton />
                <AddPersonButton />
              </>
            }
          />
          {meta.people.length ? (
            <div className="mt-8 space-y-10">
              {branches.map((b) => {
                const members = meta.people.filter((p) => (p.branch ?? "Other family") === b);
                return (
                  <section key={b}>
                    <SectionTitle title={b} hint={plural(members.length, "person", "people")} />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {members.map((p) => (
                        <Link
                          key={p.id}
                          href={`/projects/${projectId}/people?person=${p.id}`}
                          className="card flex flex-col items-center p-4 text-center transition hover:shadow-[var(--shadow-lift)]"
                        >
                          <Avatar name={p.name} src={p.avatarUrl ?? avatarOf(p.avatarAssetId)} size={64} />
                          <div className="mt-2.5 text-[13.5px] font-semibold">{p.name}</div>
                          <div className="text-[11.5px] text-muted">
                            {plural(countOf(p.id), "photo")}
                            {p.birthYear ? ` · b. ${p.birthYear}` : ""}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              icon={<Users />}
              title="No one tagged yet"
              body="Add family members here, or tag faces while reviewing uploads. Each person gets a page with all their photos."
              action={<AddPersonButton />}
            />
          )}
        </PageBody>
      )}
    </ProjectScope>
  );
}
