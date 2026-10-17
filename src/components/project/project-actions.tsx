"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Plus, Share2, UserPlus } from "lucide-react";
import { ShareModal } from "@/components/sharing/share-modal";

function Row({ icon, title, hint, onClick, href }: { icon: ReactNode; title: string; hint: string; onClick?: () => void; href?: string }) {
  const body = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent [&>svg]:size-5 [&>svg]:stroke-[1.6]">{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        <span className="block text-[11.5px] text-muted">{hint}</span>
      </span>
      <ChevronRight className="size-4 text-ink-2" />
    </>
  );
  const cls = "glass-strong flex w-full items-center gap-3.5 px-4 py-3.5 transition hover:bg-white";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** Share / invite / create album / make a book quick actions. */
export function ProjectActions({ base, albumId, albumName }: { base: string; albumId?: string; albumName?: string }) {
  const [share, setShare] = useState(false);
  return (
    <div className="glass space-y-2 p-3">
      <Row icon={<Share2 />} title={albumId ? "Share Album" : "Share Project"} hint="Let family you love" onClick={() => setShare(true)} />
      <Row icon={<UserPlus />} title="Invite Contributors" hint="Add family and friends" onClick={() => setShare(true)} />
      <Row icon={<Plus />} title="Create Album" hint="Organize a new collection" href={`${base}/albums?new=1`} />
      <Row icon={<BookOpen />} title="Make a Book" hint="Turn memories into a story" href={`${base}/stories`} />
      {share && <ShareModal albumId={albumId} albumName={albumName} onClose={() => setShare(false)} />}
    </div>
  );
}
