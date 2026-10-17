"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, ImagePlus, Loader2, X } from "lucide-react";
import { uploadAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { useMeta } from "@/components/meta-context";
import { DateInput, EventPicker, PeoplePicker, PlacePicker, QuickPicks } from "@/components/pickers";
import { kindOf, prepareFiles } from "@/lib/upload-client";
import type { DatePrecision } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

/** Big friendly dropzone. Reused on the uploads page, album pages, and the public upload link page. */
export function Dropzone({ onFiles, compact, label = "Drag & drop photos here" }: { onFiles: (f: File[]) => void; compact?: boolean; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setOver(true))}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed text-center transition",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        over ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:border-accent-line",
      )}
    >
      <div className={cn("grid place-items-center rounded-2xl bg-accent-soft text-accent", compact ? "size-10" : "size-14")}>
        <CloudUpload className={compact ? "size-5" : "size-6"} />
      </div>
      <div>
        <div className={cn("font-semibold", compact ? "text-[13.5px]" : "text-[15px]")}>{label}</div>
        <div className="text-[12.5px] text-muted">Photos, videos, scans, and documents — as many as you like</div>
      </div>
      <Button variant="primary" onClick={() => input.current?.click()}>
        <ImagePlus className="size-4" /> Choose files
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Preview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const src = useMemo(() => (kindOf(file) === "photo" ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg bg-sunken">
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <FileText className="m-auto mt-[30%] size-6 text-muted" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

/**
 * Lightweight intake drawer: pick an album, optionally add shared details,
 * or skip it all and land everything in the Needs Review queue.
 */
export function UploadDrawer({ initialFiles, albumId: defaultAlbum, onClose }: { initialFiles: File[]; albumId?: string; onClose: () => void }) {
  const meta = useMeta();
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [albumId, setAlbumId] = useState(defaultAlbum ?? meta.albums.find((a) => a.kind === "inbox")?.id);
  const [date, setDate] = useState<{ v: string | null; p: DatePrecision }>({ v: null, p: "unknown" });
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && !pending && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose, pending]);

  function submit(withDetails: boolean) {
    setError(undefined);
    start(async () => {
      try {
        const prepared = await prepareFiles(meta.projectId, files, setProgress);
        await uploadAction(
          prepared.map((f) => ({
            ...f,
            projectId: meta.projectId,
            albumId,
            ...(withDetails
              ? {
                  takenAt: date.v ?? undefined,
                  datePrecision: date.p,
                  placeId: placeId ?? undefined,
                  eventId: eventId ?? undefined,
                  personIds: people,
                  caption: caption || undefined,
                }
              : {}),
          })),
        );
        onClose();
        router.push(`/projects/${meta.projectId}/uploads`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Your files are still here — try again.");
      }
    });
  }

  const manual = meta.albums.filter((a) => a.kind !== "smart");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="animate-fade absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={() => !pending && onClose()} />
      <div role="dialog" aria-modal aria-label="Add to archive" className="animate-drawer relative flex h-full w-full max-w-[480px] flex-col bg-surface shadow-[var(--shadow-pop)]">
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-serif text-[22px] font-medium">Add to archive</h2>
            <p className="text-[12.5px] text-muted">{plural(files.length, "file")} ready. Details are optional — you can add them later.</p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken">
            <X className="size-4" />
          </button>
        </div>

        <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-5 gap-2">
            {files.slice(0, 14).map((f, i) => (
              <Preview key={`${f.name}-${i}`} file={f} onRemove={() => setFiles((fs) => fs.filter((_, j) => j !== i))} />
            ))}
            {files.length > 14 && <div className="grid aspect-square place-items-center rounded-lg bg-sunken text-[12px] font-semibold">+{files.length - 14}</div>}
          </div>
          <Dropzone compact label="Add more" onFiles={(more) => setFiles((fs) => [...fs, ...more])} />

          <Field label="Add to album">
            <select className="field" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
              {manual.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kind === "inbox" ? "Inbox (sort later)" : a.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="rounded-xl bg-sunken/60 p-4">
            <div className="mb-3 text-[12.5px] font-semibold">Same details for all {files.length}? <span className="font-normal text-muted">(optional)</span></div>
            <div className="space-y-4">
              <Field label="Date or year">
                <DateInput value={date.v ?? undefined} precision={date.p} onChange={(v, p) => setDate({ v, p })} />
              </Field>
              <Field label="Event">
                <EventPicker value={eventId ?? undefined} onChange={setEventId} />
              </Field>
              <Field label="Location">
                <PlacePicker value={placeId ?? undefined} onChange={setPlaceId} />
              </Field>
              {!placeId && !eventId && <QuickPicks onPlace={setPlaceId} onEvent={setEventId} />}
              <div>
                <div className="label mb-1.5">People</div>
                <PeoplePicker value={people} onAdd={(id) => setPeople((p) => [...p, id])} onRemove={(id) => setPeople((p) => p.filter((x) => x !== id))} />
              </div>
              <Field label="Description">
                <textarea rows={2} className="field resize-none" placeholder="What’s the story behind these?" value={caption} onChange={(e) => setCaption(e.target.value)} />
              </Field>
            </div>
          </div>
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">{error}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-line px-6 py-4">
          <Button variant="secondary" disabled={pending || !files.length} onClick={() => submit(false)}>
            Save &amp; review later
          </Button>
          <Button variant="primary" className="flex-1" disabled={pending || !files.length} onClick={() => submit(true)}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Uploading {progress}/{files.length}
              </>
            ) : (
              <>Upload {plural(files.length, "file")}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Dropzone that opens the intake drawer. */
export function UploadLauncher({ albumId, compact }: { albumId?: string; compact?: boolean }) {
  const [files, setFiles] = useState<File[] | null>(null);
  return (
    <>
      <Dropzone compact={compact} onFiles={setFiles} />
      {files && <UploadDrawer initialFiles={files} albumId={albumId} onClose={() => setFiles(null)} />}
    </>
  );
}

export function UploadButton({
  albumId,
  label = "Upload",
  variant = "primary",
  pill,
}: {
  albumId?: string;
  label?: string;
  variant?: "primary" | "secondary";
  /** the large rounded hero button from the archive home concept */
  pill?: boolean;
}) {
  const [files, setFiles] = useState<File[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant={variant} size={pill ? "lg" : "md"} className={pill ? "h-12 gap-3 rounded-full px-6 text-[14.5px]" : undefined} onClick={() => input.current?.click()}>
        <CloudUpload className={pill ? "size-5" : "size-4"} /> {label} {pill && <span aria-hidden>→</span>}
      </Button>
      <input ref={input} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => (e.target.files?.length && setFiles([...e.target.files]), (e.target.value = ""))} />
      {files && <UploadDrawer initialFiles={files} albumId={albumId} onClose={() => setFiles(null)} />}
    </>
  );
}
