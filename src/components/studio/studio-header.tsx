"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { updateStoryAction } from "@/app/actions";
import { Stepper } from "@/components/ui";

const STEPS = [
  { title: "Plan", hint: "Organize content" },
  { title: "Design", hint: "Create your book" },
  { title: "Review", hint: "Fine tune" },
  { title: "Publish", hint: "Share your story" },
];

/** Studio top bar. "Return to archive" is always one click away — books never trap you. */
export function StudioHeader({
  storyId,
  projectId,
  title: initialTitle,
  subtitle,
  step,
  actions,
}: {
  storyId: string;
  projectId: string;
  title: string;
  subtitle?: string;
  step: number;
  actions: ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  return (
    <header className="glass mx-3 mt-3 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 !rounded-[20px] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/projects/${projectId}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-muted hover:bg-sunken hover:text-ink">
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Return to archive</span>
        </Link>
        <span className="hidden h-6 w-px bg-line md:block" />
        <span className="hidden items-center gap-2 md:flex">
          <span className="font-display text-[18px] tracking-[0.3em] text-ink uppercase">Revories</span>
        </span>
      </div>
      <div className="flex flex-col items-center">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => (setEditing(false), title.trim() && updateStoryAction(storyId, { title: title.trim() }))}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="field h-7 w-56 text-center text-[13.5px] font-semibold"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="group flex items-center gap-1.5 text-[14px] font-semibold">
            {title} <Pencil className="size-3 text-faint group-hover:text-ink" />
          </button>
        )}
        {subtitle && <div className="text-[11px] text-muted">{subtitle}</div>}
        <div className="mt-1.5">
          <Stepper steps={STEPS} current={step} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">{actions}</div>
    </header>
  );
}
