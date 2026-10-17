"use client";

import { useRef, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/** A horizontal row of cards with a floating "next" button, as in Your Projects. */
export function ScrollRow({ children, step = 520 }: { children: ReactNode; step?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      <div ref={ref} className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-1 [scrollbar-width:none] xl:auto-cols-[calc((100%-36px)/4)]">
        {children}
      </div>
      <button
        type="button"
        aria-label="More"
        onClick={() => ref.current?.scrollBy({ left: step, behavior: "smooth" })}
        className="absolute top-[30%] -right-3 grid size-10 place-items-center rounded-full bg-white text-ink shadow-[0_4px_14px_rgb(0_0_0/0.14)]"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
