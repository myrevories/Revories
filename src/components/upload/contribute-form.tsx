"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { contributeAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { Dropzone } from "@/components/upload/upload-drawer";
import { prepareFiles } from "@/lib/upload-client";
import { plural } from "@/lib/utils";

export function ContributeForm({ token, projectId }: { token: string; projectId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  if (done)
    return (
      <div className="card mt-8 p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Heart className="size-5" />
        </div>
        <h2 className="mt-4 font-serif text-[22px]">Thank you{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
        <p className="mt-1 text-[13.5px] text-muted">{plural(done, "file")} added to the archive. Got more? You can send another batch anytime.</p>
        <Button className="mt-5" onClick={() => (setDone(0), setFiles([]), setNote(""))}>
          Send more
        </Button>
      </div>
    );

  return (
    <form
      className="card mt-8 space-y-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!files.length) return;
        setError(undefined);
        start(async () => {
          try {
            const prepared = await prepareFiles(projectId, files, setProgress, token);
            await contributeAction(token, name.trim(), prepared, note.trim() || undefined);
            setDone(files.length);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          }
        });
      }}
    >
      <Field label="Your name">
        <input value={name} onChange={(e) => setName(e.target.value)} className="field h-11" placeholder="So the family knows who to thank" />
      </Field>
      <Dropzone onFiles={(f) => setFiles((x) => [...x, ...f])} />
      {files.length > 0 && <p className="text-center text-[13px] font-medium">{plural(files.length, "file")} ready to send</p>}
      <Field label="Anything we should know?" hint="Optional">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field resize-none" placeholder="e.g. These are from Grandpa’s 1970s slides" />
      </Field>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[12.5px] text-danger">{error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!files.length || pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending {progress}/{files.length}…
          </>
        ) : (
          "Send to the archive"
        )}
      </Button>
    </form>
  );
}
