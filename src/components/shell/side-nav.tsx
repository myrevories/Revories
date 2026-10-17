"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FolderOpen, Images, LayoutGrid, ListOrdered, MapPin, Share2, Trash2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function SideNav({ base, horizontal }: { base: string; horizontal?: boolean }) {
  const pathname = usePathname();
  const items: { href: string; label: string; icon: React.ReactNode; exact?: boolean }[] = [
    { href: base, label: "Overview", icon: <LayoutGrid />, exact: true },
    { href: `${base}/uploads`, label: "Photos & Videos", icon: <Images /> },
    { href: `${base}/albums`, label: "Albums", icon: <FolderOpen /> },
    { href: `${base}/people`, label: "People", icon: <User /> },
    { href: `${base}/places`, label: "Places", icon: <MapPin /> },
    { href: `${base}/events`, label: "Timeline", icon: <ListOrdered /> },
    { href: `${base}/stories`, label: "Stories & Books", icon: <BookOpen /> },
    { href: `${base}/contributors`, label: "Contributors", icon: <Users /> },
    { href: `${base}/settings/sharing`, label: "Sharing", icon: <Share2 /> },
    { href: `${base}/trash`, label: "Trash", icon: <Trash2 /> },
  ];
  if (horizontal)
    return (
      <nav className="glass flex gap-1 overflow-x-auto p-1.5 [scrollbar-width:none]">
        {items.map((it) => {
          const on = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className={cn("shrink-0 rounded-full px-3.5 py-2 text-[12.5px]", on ? "bg-accent-soft font-medium text-accent" : "text-ink-2")}>
              {it.label}
            </Link>
          );
        })}
      </nav>
    );
  return (
    <nav className="space-y-0.5">
      {items.map((it) => {
        const on = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex h-10 items-center gap-3.5 rounded-xl px-3 text-[14px] transition [&_svg]:size-[19px] [&_svg]:stroke-[1.6]",
              on ? "bg-accent-soft/90 font-medium text-accent" : "text-ink-2 hover:bg-white/50 hover:text-ink",
            )}
          >
            {it.icon}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
