"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, MoreHorizontal, Plus, Share2, SlidersHorizontal } from "lucide-react";
import { createStoryAction, updateAlbumAction } from "@/app/actions";
import { ShareModal } from "@/components/sharing/share-modal";
import { UploadDrawer } from "@/components/upload/upload-drawer";
import { useMeta } from "@/components/meta-context";

const chip = "flex h-12 items-center justify-center gap-2.5 rounded-full text-[14px] transition [&>svg]:size-[18px] [&>svg]:stroke-[1.6]";

/** Share Album / + Add Photos / Create Book / Organize / ⋯ */
export function AlbumActions({ albumId, albumName, assetIds }: { albumId: string; albumName: string; assetIds: string[] }) {
  const meta = useMeta();
  const [share, setShare] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="glass grid grid-cols-[1fr_1fr] gap-2.5 p-3">
      <button type="button" onClick={() => setShare(true)} className={`${chip} bg-white/75 text-ink hover:bg-white`}>
        <Share2 className="text-accent" /> Share Album
      </button>
      <button type="button" onClick={() => input.current?.click()} className={`${chip} pill-accent`}>
        <Plus /> Add Photos
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => createStoryAction({ projectId: meta.projectId, albumId, title: albumName, assetIds }))}
        className={`${chip} bg-white/75 text-ink hover:bg-white`}
      >
        <BookOpen className="text-accent" /> {pending ? "Creating…" : "Create Book"}
      </button>
      <div className="flex gap-2">
        <Link href={`/projects/${meta.projectId}/uploads?album=${albumId}`} className={`${chip} flex-1 bg-white/75 text-ink hover:bg-white`}>
          <SlidersHorizontal className="text-accent" /> Organize
        </Link>
        <div className="relative">
          <button type="button" aria-label="More" onClick={() => setMenu((m) => !m)} className="grid size-12 place-items-center rounded-full bg-white/75 text-ink hover:bg-white">
            <MoreHorizontal className="size-5" />
          </button>
          {menu && (
            <div className="glass-strong animate-rise absolute top-full right-0 z-30 mt-2 w-44 p-1.5">
              <button type="button" onClick={() => (setRenaming(true), setMenu(false))} className="block w-full rounded-xl px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-white">
                Rename album
              </button>
            </div>
          )}
        </div>
      </div>
      {renaming && (
        <form
          className="col-span-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
            if (name) start(() => updateAlbumAction(albumId, { name }));
            setRenaming(false);
          }}
        >
          <input name="name" autoFocus defaultValue={albumName} className="field h-10 flex-1 rounded-full" />
          <button type="submit" className="h-10 rounded-full bg-ink px-4 text-[12.5px] text-white">
            Save
          </button>
        </form>
      )}
      <input ref={input} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => (e.target.files?.length && setFiles([...e.target.files]), (e.target.value = ""))} />
      {files && <UploadDrawer initialFiles={files} albumId={albumId} onClose={() => setFiles(null)} />}
      {share && <ShareModal albumId={albumId} albumName={albumName} onClose={() => setShare(false)} />}
    </div>
  );
}

export function AboutAlbum({ albumId, description }: { albumId: string; description?: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(description ?? "");
  const [, start] = useTransition();
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[23px] text-ink">About This Album</h3>
        <button
          type="button"
          onClick={() => {
            if (editing) start(() => updateAlbumAction(albumId, { description: text.trim() }));
            setEditing((e) => !e);
          }}
          className="flex items-center gap-1 text-[12.5px] text-ink hover:text-accent"
        >
          {editing ? "Save" : "Edit"} <ChevronRight className="size-3.5" />
        </button>
      </div>
      {editing ? (
        <textarea autoFocus rows={4} value={text} onChange={(e) => setText(e.target.value)} className="field mt-2 resize-none" />
      ) : (
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{text || "Add a few words about what this album holds."}</p>
      )}
    </section>
  );
}
