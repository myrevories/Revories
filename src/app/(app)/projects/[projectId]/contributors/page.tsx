import { Suspense } from "react";
import { getProject, getProjectMeta, listAlbums, listAssets, listMembers, listStories, listUsers, projectActivity } from "@/lib/data";
import { ProjectScope } from "@/components/project-scope";
import { PageSkeleton } from "@/components/ui";
import { SharedProject } from "@/components/sharing/shared-project";

export const metadata = { title: "Contributors" };

export default function ContributorsPage({ params }: PageProps<"/projects/[projectId]/contributors">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Contributors params={params} />
    </Suspense>
  );
}

async function Contributors({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, members, assets, activity, users, meta, stories, albums] = await Promise.all([
    getProject(projectId),
    listMembers(projectId),
    listAssets(projectId),
    projectActivity(projectId),
    listUsers(),
    getProjectMeta(projectId),
    listStories(projectId),
    listAlbums(projectId),
  ]);
  if (!project) return null;
  const contributors = members
    .map((m) => ({ user: m.user, role: m.role, added: assets.filter((a) => a.uploadedBy === m.userId).length }))
    .sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || b.added - a.added);
  const recent = [...assets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const focus = albums.find((a) => a.kind === "manual" && a.count) ?? albums[0];
  const decade = focus?.years ? `${focus.years.slice(0, 3)}0s` : project.years;

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <SharedProject
          project={{ id: project.id, name: project.name, description: project.description, firstStoryId: stories[0]?.id }}
          cover={project.cover?.url}
          subtitle={[focus?.name, decade].filter(Boolean).join(" · ")}
          contributors={contributors}
          recent={recent}
          activity={activity}
          notes={(project.notes ?? []).map((n) => ({ ...n, user: users.find((u) => u.id === n.userId) }))}
          events={meta.events}
          users={users}
        />
      )}
    </ProjectScope>
  );
}
