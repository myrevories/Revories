"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useMeta } from "@/components/meta-context";
import { cn } from "@/lib/utils";

export interface StatusCounts {
  all: number;
  reviewed: number;
  tagged: number;
  needs_details: number;
}

/** Status pills + compact filter selects. State lives in the URL so views are shareable. */
export function AssetFilters({ counts, years }: { counts: StatusCounts; years: string[] }) {
  const meta = useMeta();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function set(key: string, value?: string) {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const status = sp.get("status") ?? "";
  const pills: [string, string, number, string?][] = [
    ["", "All", counts.all],
    ["reviewed", "Reviewed", counts.reviewed, "bg-accent"],
    ["tagged", "Tagged", counts.tagged, "bg-person"],
    ["needs_details", "Needs details", counts.needs_details, "bg-warn"],
  ];
  const selects: { key: string; label: string; options: { id: string; name: string }[] }[] = [
    { key: "event", label: "All events", options: meta.events },
    { key: "year", label: "All years", options: years.map((y) => ({ id: y, name: y })) },
    { key: "place", label: "All places", options: meta.places },
    { key: "person", label: "Everyone", options: meta.people },
  ];
  const active = selects.filter((s) => sp.get(s.key));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {pills.map(([value, label, n, dot]) => (
          <button
            key={label}
            type="button"
            onClick={() => set("status", value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition",
              status === value ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong",
            )}
          >
            {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
            {label} <span className={status === value ? "text-white/70" : "text-faint"}>({n})</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {selects.map((s) => (
          <select
            key={s.key}
            aria-label={s.label}
            value={sp.get(s.key) ?? ""}
            onChange={(e) => set(s.key, e.target.value || undefined)}
            className={cn("field h-8 w-auto max-w-[180px] pr-7 text-[12.5px]", sp.get(s.key) && "border-accent-line bg-accent-soft/50")}
          >
            <option value="">{s.label}</option>
            {s.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ))}
        {active.length > 0 && (
          <button
            type="button"
            onClick={() => router.replace(status ? `${pathname}?status=${status}` : pathname, { scroll: false })}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-muted hover:text-ink"
          >
            <X className="size-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
