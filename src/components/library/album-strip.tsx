"use client";

import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { AlbumSummary } from "@/lib/data";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlbumMini, CATEGORIES } from "./parts";

/** Category pills + a horizontally scrolling album strip with a next arrow. */
export function AlbumStrip({ albums, cats = ["family", "travel", "milestones", "sports", "holidays", "school"], wide }: { albums: AlbumSummary[]; cats?: Category[]; wide?: boolean }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const ref = useRef<HTMLDivElement>(null);
  const shown = albums.filter((a) => cat === "all" || a.category === cat);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(["all", ...cats] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn("h-8 rounded-full px-4 text-[12px] transition", cat === c ? "bg-accent-soft font-medium text-accent" : "text-ink-2 hover:text-ink")}
          >
            {c === "all" ? "All" : CATEGORIES.find((x) => x.id === c)?.label}
          </button>
        ))}
      </div>
      <div className="relative mt-3">
        <div ref={ref} className="flex gap-3 overflow-x-auto pr-12 [scrollbar-width:none]">
          {shown.map((a) => (
            <AlbumMini key={a.id} album={a} wide={wide} />
          ))}
          {!shown.length && <p className="py-8 text-[13px] text-muted">No albums in this category yet.</p>}
        </div>
        <button
          type="button"
          aria-label="Scroll albums"
          onClick={() => ref.current?.scrollBy({ left: 360, behavior: "smooth" })}
          className="absolute top-1/2 right-0 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_4px_14px_rgb(0_0_0/0.12)]"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
