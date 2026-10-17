"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Cloud, FolderPlus, Home, Loader2 } from "lucide-react";
import { updateAssetsAction } from "@/app/actions";
import { Avatar, Button, Chip, Field } from "@/components/ui";
import { useMeta } from "@/components/meta-context";
import { DateInput, EventPicker, PeoplePicker, PlacePicker, QuickPicks, TagPicker } from "@/components/pickers";
import type { Asset, AssetPatch } from "@/lib/types";
import { cn, formatTakenAt } from "@/lib/utils";

/** Apply a patch locally so the UI responds instantly; the server action is the source of truth. */
export function applyPatch(a: Asset, p: AssetPatch): Asset {
  const add = <T,>(xs: T[], more?: T[]) => [...xs, ...(more ?? []).filter((m) => !xs.includes(m))];
  const next: Asset = {
    ...a,
    takenAt: p.takenAt !== undefined ? (p.takenAt ?? undefined) : a.takenAt,
    datePrecision: p.datePrecision ?? a.datePrecision,
    placeId: p.placeId !== undefined ? (p.placeId ?? undefined) : a.placeId,
    eventId: p.eventId !== undefined ? (p.eventId ?? undefined) : a.eventId,
    caption: p.caption !== undefined ? (p.caption ?? undefined) : a.caption,
    tagIds: add(a.tagIds, p.addTagIds).filter((t) => !p.removeTagIds?.includes(t)),
    albumIds: add(a.albumIds, p.addAlbumIds).filter((t) => !p.removeAlbumIds?.includes(t)),
    people: [
      ...a.people.filter((x) => !p.removePersonIds?.includes(x.personId)),
      ...(p.addPersonIds ?? []).filter((id) => !a.people.some((x) => x.personId === id)).map((personId) => ({ personId, confirmed: true })),
    ],
  };
  if (p.favorite !== undefined) next.favorite = p.favorite;
  if (p.rotation !== undefined) next.rotation = p.rotation;
  if (p.status) next.status = p.status;
  else if (next.status === "needs_details" && (next.takenAt || next.placeId || next.eventId || next.people.length || next.tagIds.length))
    next.status = "tagged";
  return next;
}

export function useAssetSaver(onLocal: (ids: string[], patch: AssetPatch) => void, quiet = false) {
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  function save(ids: string[], patch: AssetPatch) {
    onLocal(ids, patch);
    start(async () => {
      await updateAssetsAction(ids, patch, quiet);
      setSavedAt(Date.now());
    });
  }
  return { save, pending, savedAt };
}

export function SaveIndicator({ pending, savedAt, idle = "Changes save automatically" }: { pending: boolean; savedAt: number | null; idle?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11.5px] text-muted">
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Saving…
        </>
      ) : savedAt ? (
        <>
          <CheckCircle2 className="size-3.5 text-accent" /> Auto-saved
        </>
      ) : (
        <>
          <Cloud className="size-3.5" /> {idle}
        </>
      )}
    </span>
  );
}

function common<T>(items: Asset[], get: (a: Asset) => T): { value?: T; mixed: boolean } {
  if (!items.length) return { mixed: false };
  const first = get(items[0]);
  const mixed = items.some((a) => get(a) !== first);
  return { value: mixed ? undefined : first, mixed };
}

/**
 * Details editor for one asset or many. With several selected, each field
 * shows the shared value (or "Mixed") and any change applies to all of them.
 */
export function AssetDetailsForm({
  assets,
  save,
  showAlbums = true,
}: {
  assets: Asset[];
  save: (ids: string[], patch: AssetPatch) => void;
  showAlbums?: boolean;
}) {
  const meta = useMeta();
  const ids = assets.map((a) => a.id);
  const many = assets.length > 1;
  const date = common(assets, (a) => `${a.takenAt ?? ""}|${a.datePrecision}`);
  const place = common(assets, (a) => a.placeId);
  const event = common(assets, (a) => a.eventId);
  const caption = common(assets, (a) => a.caption ?? "");
  // For multi-select, chips show what *all* selected items share.
  const sharedPeople = meta.people.map((p) => p.id).filter((id) => assets.every((a) => a.people.some((x) => x.personId === id)));
  const sharedTags = meta.tags.map((t) => t.id).filter((id) => assets.every((a) => a.tagIds.includes(id)));
  const albums = meta.albums.filter((al) => al.kind !== "smart" && assets.every((a) => a.albumIds.includes(al.id)));
  const [takenAt, precision] = (date.value ?? "|unknown").split("|");

  return (
    <div className="space-y-5">
      <Field label="Date or Year" hint={many && date.mixed ? "Mixed" : undefined}>
        <DateInput
          value={takenAt || undefined}
          precision={precision as Asset["datePrecision"]}
          mixed={date.mixed}
          onChange={(d, p) => save(ids, { takenAt: d, datePrecision: p })}
        />
      </Field>

      <Field label="Event Type" hint={event.mixed ? "Mixed" : undefined}>
        <EventPicker value={event.value} mixed={event.mixed} onChange={(id) => save(ids, { eventId: id })} />
      </Field>

      <Field label="Location" hint={place.mixed ? "Mixed" : undefined}>
        <PlacePicker value={place.value} mixed={place.mixed} onChange={(id) => save(ids, { placeId: id })} />
      </Field>

      <Field label="House or Venue">
        <div className="field flex items-center gap-2 text-ink">
          <Home className="size-4 text-muted" />
          <span className={cn("truncate", !meta.place(place.value) && "text-faint")}>{meta.place(place.value)?.name ?? "Set by the location"}</span>
        </div>
      </Field>

      {!place.value && !event.value && (
        <QuickPicks onPlace={(id) => save(ids, { placeId: id })} onEvent={(id) => save(ids, { eventId: id })} />
      )}

      <div>
        <div className="label mb-1.5">People in Photo {many && <span className="font-normal text-faint">· in all selected</span>}</div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 -space-x-1.5">
            {sharedPeople.slice(0, 5).map((id) => (
              <button key={id} type="button" title={`Remove ${meta.person(id)?.name}`} onClick={() => save(ids, { removePersonIds: [id] })}>
                <Avatar name={meta.person(id)?.name ?? "?"} size={34} ring />
              </button>
            ))}
            {sharedPeople.length > 5 && <span className="grid size-[34px] place-items-center rounded-full bg-sunken text-[11px] font-semibold text-ink-2 ring-2 ring-surface">+{sharedPeople.length - 5}</span>}
            {!sharedPeople.length && <span className="text-[12px] text-faint">No one tagged yet</span>}
          </div>
          <PeoplePicker compact value={sharedPeople} onAdd={(id) => save(ids, { addPersonIds: [id] })} onRemove={(id) => save(ids, { removePersonIds: [id] })} />
        </div>
      </div>

      <Field label={many ? "Caption (applies to all)" : "Caption / Story"} hint={caption.mixed ? "Mixed" : `${(caption.value ?? "").length}/500`}>
        <textarea
          key={ids.join(",")}
          rows={3}
          maxLength={500}
          className="field resize-none"
          placeholder={caption.mixed ? "Different captions — type to replace all" : "What was happening? Who took it?"}
          defaultValue={caption.value}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (caption.value ?? "") && !(caption.mixed && !v)) save(ids, { caption: v || null });
          }}
        />
      </Field>

      <div>
        <div className="label mb-1.5">Tags</div>
        <TagPicker value={sharedTags} onAdd={(id) => save(ids, { addTagIds: [id] })} onRemove={(id) => save(ids, { removeTagIds: [id] })} />
      </div>

      {showAlbums && (
        <div>
          <div className="label mb-1.5">Albums</div>
          <div className="flex flex-wrap gap-1.5">
            {albums.map((al) => (
              <Chip key={al.id} kind="accent" onRemove={al.kind === "inbox" ? undefined : () => save(ids, { removeAlbumIds: [al.id] })}>
                {al.name}
              </Chip>
            ))}
            <AlbumAdder onPick={(id) => save(ids, { addAlbumIds: [id] })} exclude={albums.map((a) => a.id)} />
          </div>
        </div>
      )}
    </div>
  );
}

function AlbumAdder({ onPick, exclude }: { onPick: (id: string) => void; exclude: string[] }) {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const options = meta.albums.filter((a) => a.kind === "manual" && !exclude.includes(a.id));
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-[26px] items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-[12px] font-medium text-ink-2 hover:border-accent hover:text-accent"
      >
        <FolderPlus className="size-3.5" /> Add to album
      </button>
      {open && (
        <div className="animate-rise absolute z-40 mt-1.5 w-56 rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {options.length ? (
            options.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => (onPick(a.id), setOpen(false))}
                className="block w-full truncate rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-sunken"
              >
                {a.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-[12px] text-muted">No other albums yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Read-only summary row used in lists and the review panel. */
export function AssetSummary({ asset }: { asset: Asset }) {
  const meta = useMeta();
  return (
    <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-[12.5px]">
      <dt className="text-muted">Date</dt>
      <dd>{formatTakenAt(asset.takenAt, asset.datePrecision)}</dd>
      <dt className="text-muted">Event</dt>
      <dd className={cn(!asset.eventId && "text-faint")}>{meta.event(asset.eventId)?.name ?? "—"}</dd>
      <dt className="text-muted">Location</dt>
      <dd className={cn(!asset.placeId && "text-faint")}>{meta.place(asset.placeId)?.name ?? "—"}</dd>
      <dt className="text-muted">File</dt>
      <dd className="truncate">{asset.filename}</dd>
    </dl>
  );
}

export function MarkReviewed({ assets, save }: { assets: Asset[]; save: (ids: string[], patch: AssetPatch) => void }) {
  const allReviewed = assets.every((a) => a.status === "reviewed");
  return (
    <Button
      variant={allReviewed ? "secondary" : "forest"}
      className="w-full"
      onClick={() => save(assets.map((a) => a.id), { status: allReviewed ? "tagged" : "reviewed" })}
    >
      <CheckCircle2 className="size-4" />
      {allReviewed ? "Reviewed — undo" : assets.length > 1 ? `Mark ${assets.length} as reviewed` : "Mark as reviewed"}
    </Button>
  );
}
