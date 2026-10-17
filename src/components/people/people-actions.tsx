"use client";

import { useState, useTransition } from "react";
import { GitMerge, UserPlus } from "lucide-react";
import { createPersonAction, mergePeopleAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";

export function AddPersonButton() {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const branches = [...new Set(meta.people.map((p) => p.branch).filter(Boolean))] as string[];
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Add person
      </Button>
      {open && (
        <Modal title="Add a person" description="You can tag them in photos right after." onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            action={(fd) =>
              start(async () => {
                const name = String(fd.get("name") ?? "").trim();
                if (!name) return;
                const p = await createPersonAction(meta.projectId, name, String(fd.get("branch") ?? ""));
                meta.add("people", p);
                setOpen(false);
              })
            }
          >
            <Field label="Name">
              <input name="name" required autoFocus className="field" placeholder="e.g. Grandma Ruth" />
            </Field>
            <Field label="Family branch" hint="Optional">
              <input name="branch" list="branches" className="field" placeholder="e.g. LaDon Martin Branch" />
              <datalist id="branches">
                {branches.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                Add person
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/** "Same person as…" — fold a duplicate into the person to keep. */
export function MergePeopleButton() {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const [keep, setKeep] = useState("");
  const [merge, setMerge] = useState("");
  const [pending, start] = useTransition();
  if (meta.people.length < 2) return null;
  const keepName = meta.person(keep)?.name;
  const mergeName = meta.person(merge)?.name;
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <GitMerge className="size-4" /> Merge duplicates
      </Button>
      {open && (
        <Modal
          title="Same person?"
          description="If someone was added twice, merge them. Every photo tag moves to the person you keep."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!keep || !merge || keep === merge || pending}
                onClick={() =>
                  start(async () => {
                    await mergePeopleAction(meta.projectId, keep, merge);
                    setOpen(false);
                  })
                }
              >
                Merge
              </Button>
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="This person…">
              <select className="field" value={merge} onChange={(e) => setMerge(e.target.value)}>
                <option value="">Choose</option>
                {meta.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="…is the same as">
              <select className="field" value={keep} onChange={(e) => setKeep(e.target.value)}>
                <option value="">Choose</option>
                {meta.people
                  .filter((p) => p.id !== merge)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          {keepName && mergeName && (
            <p className="mt-4 rounded-lg bg-sunken px-3 py-2 text-[12.5px] text-ink-2">
              “{mergeName}” will be removed and all their photo tags will point to “{keepName}”.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
