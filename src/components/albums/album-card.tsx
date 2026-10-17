import Link from "next/link";
import { Inbox, Sparkles } from "lucide-react";
import type { AlbumSummary } from "@/lib/data";
import { plural } from "@/lib/utils";

export function AlbumCard({ album }: { album: AlbumSummary }) {
  const previews = album.previews.filter((a) => a.id !== album.cover?.id).slice(0, 2);
  return (
    <Link href={`/projects/${album.projectId}/albums/${album.id}`} className="group block">
      <div className="grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-1 overflow-hidden rounded-xl bg-sunken ring-1 ring-line transition group-hover:shadow-[var(--shadow-lift)]">
        <div className="row-span-2 overflow-hidden bg-sunken">
          {album.cover ? (
            <img src={album.cover.thumbUrl} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid size-full place-items-center text-faint">{album.kind === "inbox" ? <Inbox className="size-6" /> : null}</div>
          )}
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="overflow-hidden bg-sunken">
            {previews[i] && <img src={previews[i].thumbUrl} alt="" loading="lazy" className="size-full object-cover" />}
          </div>
        ))}
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold">
          {album.name}
          {album.kind === "smart" && <Sparkles className="size-3.5 shrink-0 text-accent" aria-label="Smart album" />}
        </div>
        <div className="text-[12px] text-muted">
          {plural(album.count, "item")}
          {album.kind === "smart" && " · updates automatically"}
        </div>
      </div>
    </Link>
  );
}
