import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data";
import { TopBar } from "@/components/shell/top-bar";
import { ProjectSidebar } from "@/components/shell/project-sidebar";
import { SideNav } from "@/components/shell/side-nav";
import { Skeleton } from "@/components/ui";

async function Sidebar({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();
  return <ProjectSidebar project={project} />;
}

async function MobileNavInner({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <div className="mb-3 lg:hidden">
      <SideNav base={`/projects/${projectId}`} horizontal />
    </div>
  );
}

function MobileNav({ params }: { params: Promise<{ projectId: string }> }) {
  return (
    <Suspense fallback={null}>
      <MobileNavInner params={params} />
    </Suspense>
  );
}

/** Project pages: top bar, then a glass sidebar beside the page content. */
export default function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  return (
    <>
      <TopBar />
      <div className="mx-3 mt-4 grid flex-1 items-start gap-4 lg:mx-6 lg:grid-cols-[262px_minmax(0,1fr)]">
        <div className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:[scrollbar-width:none]">
          <Suspense fallback={<Skeleton className="h-[700px] rounded-[22px]" />}>
            <Sidebar params={params} />
          </Suspense>
        </div>
        <main className="min-w-0">
          <MobileNav params={params} />
          {children}
        </main>
      </div>
    </>
  );
}
