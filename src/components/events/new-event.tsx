"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createEventAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";

export function NewEventButton() {
  const meta = useMeta();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add New Event
      </Button>
      {open && (
        <Modal title="Add an event" onClose={() => setOpen(false)}>
          <form
            className="space-y-4"
            action={(fd) =>
              start(async () => {
                const name = String(fd.get("name") ?? "").trim();
                if (!name) return;
                const e = await createEventAction(meta.projectId, name, fd.get("recurring") === "on");
                meta.add("events", e);
                setOpen(false);
                router.push(`/projects/${meta.projectId}/events/${e.id}`);
              })
            }
          >
            <Field label="Event name">
              <input name="name" required autoFocus className="field" placeholder="e.g. Thanksgiving at the farm" />
            </Field>
            <label className="flex items-start gap-2 text-[13px]">
              <input name="recurring" type="checkbox" className="mt-0.5 accent-[var(--color-accent)]" />
              <span>
                <span className="font-medium">It happens every year</span>
                <span className="block text-[12px] text-muted">Recurring events collect photos from every year in one place.</span>
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                Add event
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
