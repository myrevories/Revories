import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getCurrentUser, listProjects, listUsers, recentActivity } from "@/lib/data";
import { Skeleton } from "@/components/ui";
import { APP_NAME, cn } from "@/lib/utils";
import { Bell, TopNav, UserMenu } from "./top-bar-client";

export const MAIN_NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/projects", label: "Library", also: ["/projects/"] },
  { href: "/people", label: "People" },
  { href: "/places", label: "Places" },
  { href: "/stories", label: "Books" },
];

/** The REVORIES top bar used on every signed-in page. */
export function TopBar({ framed = false }: { framed?: boolean }) {
  return (
    <header className={cn("relative z-40 mx-3 mt-3 lg:mx-6", framed && "glass !rounded-[28px]")}>
      <div className="flex h-[64px] items-center gap-4 px-3 lg:gap-8 lg:px-5">
        <Link href="/dashboard" className="font-display text-[20px] tracking-[0.32em] text-ink uppercase sm:text-[24px]">
          {APP_NAME}
        </Link>
        <Suspense fallback={<div className="flex-1" />}>
          <TopNav items={MAIN_NAV} />
        </Suspense>
        <div className="ml-auto flex items-center gap-2.5 lg:gap-3.5">
          <form action="/search" className="relative hidden xl:block">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-2" />
            <input
              name="q"
              placeholder="Search your memories…"
              className="h-11 w-[300px] rounded-full border border-white/80 bg-white/55 pr-4 pl-11 text-[13px] text-ink outline-none backdrop-blur-xl placeholder:text-muted focus:bg-white/80 2xl:w-[340px]"
            />
          </form>
          <Link href="/upload" className="pill-accent flex h-11 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium sm:px-5">
            <Plus className="size-4" /> <span className="hidden sm:inline">Add memories</span>
          </Link>
          <span className="hidden h-7 w-px bg-ink/10 sm:block" />
          <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
            <People />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function People() {
  const [user, recent, projects, users] = await Promise.all([getCurrentUser(), recentActivity(), listProjects(), listUsers()]);
  const items = recent
    .filter((a) => a.uploadedBy !== user.id)
    .slice(0, 6)
    .map((a) => {
      const u = users.find((x) => x.id === a.uploadedBy);
      return {
        id: a.id,
        who: u?.nickname ?? u?.name.split(" ")[0] ?? a.contributorName ?? "Someone",
        avatar: u?.avatarUrl,
        project: projects.find((p) => p.id === a.projectId)?.name ?? "",
        href: `/projects/${a.projectId}/uploads`,
        thumb: a.kind === "photo" ? a.thumbUrl : undefined,
        at: a.createdAt,
      };
    });
  return (
    <>
      <Bell items={items} />
      <UserMenu
        name={user.name}
        avatar={user.avatarUrl}
        links={[
          { href: "/dashboard", label: "Home" },
          { href: "/projects", label: "Library" },
          { href: "/people", label: "People" },
          { href: "/places", label: "Places" },
          { href: "/projects/new", label: "New project" },
          { href: "/stories", label: "Books & stories" },
          { href: "/upload", label: "Add memories" },
          { href: "/", label: "Public homepage" },
        ]}
      />
    </>
  );
}
