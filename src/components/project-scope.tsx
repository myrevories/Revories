import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getProject, getProjectMeta, type ProjectSummary } from "@/lib/data";
import { MetaProvider } from "@/components/meta-context";

/** Loads a project + its metadata and provides it to client pickers. */
export async function ProjectScope({ projectId, children }: { projectId: string; children: (project: ProjectSummary) => ReactNode }) {
  const [project, meta] = await Promise.all([getProject(projectId), getProjectMeta(projectId)]);
  if (!project) notFound();
  return <MetaProvider initial={{ projectId, ...meta }}>{children(project)}</MetaProvider>;
}

/** A project subpage's main glass panel. */
export function PageBody({ children }: { children: ReactNode; wide?: boolean }) {
  return <div className="glass min-w-0 p-5 lg:p-7">{children}</div>;
}
