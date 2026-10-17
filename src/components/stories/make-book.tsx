"use client";

import { useTransition } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { createStoryAction } from "@/app/actions";
import { Button } from "@/components/ui";
import { useMeta } from "@/components/meta-context";

/** Optional, secondary: turn a set of memories into a story/book. */
export function MakeBookButton({ title, assetIds, albumId, variant = "secondary" }: { title: string; assetIds: string[]; albumId?: string; variant?: "primary" | "secondary" }) {
  const meta = useMeta();
  const [pending, start] = useTransition();
  return (
    <Button variant={variant} disabled={pending} onClick={() => start(() => createStoryAction({ projectId: meta.projectId, albumId, title, assetIds }))}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />} Make a book from this
    </Button>
  );
}
