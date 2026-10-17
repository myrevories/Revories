"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell as BellIcon, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  also?: string[];
}

function isActive(pathname: string, item: NavItem) {
  if (pathname === item.href || pathname.startsWith(item.href + "/")) return true;
  return !!item.also?.some((p) => pathname.startsWith(p));
}

/** Center nav: active item in ink with a small dot beneath, as in the concepts. */
export function TopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex xl:gap-5">
      {items.map((item) => {
        const on = isActive(pathname, item);
        return (
          <Link key={item.href} href={item.href} className={cn("relative px-3 py-2 text-[14.5px] transition", on ? "font-medium text-ink" : "text-ink-2 hover:text-ink")}>
            {item.label}
            {on && <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ink" />}
          </Link>
        );
      })}
    </nav>
  );
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [last, setLast] = useState(pathname);
  if (last !== pathname) {
    setLast(pathname);
    if (open) close();
  }
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open, close]);
  return ref;
}

function Popover({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  if (!open) return null;
  return <div className={cn("glass-strong animate-rise absolute top-full right-0 mt-2 p-1.5 shadow-[var(--shadow-pop)]", className)}>{children}</div>;
}

export function Bell({ items }: { items: { id: string; who: string; avatar?: string; project: string; href: string; thumb?: string; at: string }[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => (setOpen((o) => !o), setSeen(true))}
        className="relative grid size-10 place-items-center rounded-full text-ink hover:bg-white/60"
      >
        <BellIcon className="size-5" strokeWidth={1.6} />
        {!seen && items.length > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full border-2 border-white bg-accent" />}
      </button>
      <Popover open={open} className="w-80">
        <div className="px-3 pt-2 pb-1 text-[12px] font-semibold text-ink">Recent activity</div>
        {items.map((n) => (
          <Link key={n.id} href={n.href} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white">
            <Avatar name={n.who} src={n.avatar} size={30} />
            <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink-2">
              <span className="font-medium text-ink">{n.who}</span> added a memory to {n.project}
              <span className="block text-[10.5px] text-muted">{formatRelative(n.at, Date.parse("2026-10-16T12:00:00Z"))}</span>
            </span>
            {n.thumb && <img src={n.thumb} alt="" className="size-9 rounded-md object-cover" />}
          </Link>
        ))}
        {!items.length && <p className="px-3 py-4 text-[12px] text-muted">You’re all caught up.</p>}
      </Popover>
    </div>
  );
}

export function UserMenu({ name, avatar, links }: { name: string; avatar?: string; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 rounded-full p-0.5 hover:bg-white/60">
        <Avatar name={name} src={avatar} size={44} ring />
        <ChevronDown className="hidden size-4 text-ink-2 2xl:block" />
      </button>
      <Popover open={open} className="w-56">
        <div className="px-3 pt-2 pb-2 text-[12.5px] font-semibold text-ink">{name}</div>
        {links.map((l) => (
          <Link key={l.href + l.label} href={l.href} className="block rounded-xl px-3 py-2 text-[13px] text-ink-2 hover:bg-white hover:text-ink">
            {l.label}
          </Link>
        ))}
      </Popover>
    </div>
  );
}
