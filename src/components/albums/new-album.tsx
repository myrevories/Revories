"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Hand, Sparkles } from "lucide-react";
import { createAlbumAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import type { SmartRules } from "@/lib/types";
import { cn } from "@/lib/utils";

type RuleKey = keyof SmartRules;

export function NewAlbumButton() {
  const meta = useMeta();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"manual" | "smart">("manual");
  const [ruleKey, setRuleKey] = useState<RuleKey>("year");
  const [ruleValue, setRuleValue] = useState("");
  const [pending, start] = useTransition();

  const ruleOptions: Record<RuleKey, { label: string; values: { id: string; name: string }[] | null }> = {
    year: { label: "Taken in year", values: null },
    placeId: { label: "Taken at place", values: meta.places },
    eventId: { label: "Part of event", values: meta.events },
    personId: { label: "Includes person", values: meta.people },
    tagId: { label: "Has tag", values: meta.tags },
  };

  function submit(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const rules: SmartRules | undefined =
      kind === "smart" && ruleValue ? { [ruleKey]: ruleKey === "year" ? Number(ruleValue) : ruleValue } : undefined;
    start(async () => {
      const al = await createAlbumAction(meta.projectId, name, [], String(form.get("description") ?? "") || undefined, rules);
      setOpen(false);
      router.push(`/projects/${meta.projectId}/albums/${al.id}`);
    });
  }

  const opt = ruleOptions[ruleKey];

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <FolderPlus className="size-4" /> New album
      </Button>
      {open && (
        <Modal title="New album" description="A collection inside this project." onClose={() => setOpen(false)}>
          <form action={submit} id="new-album" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["manual", <Hand key="m" className="size-4" />, "Choose photos myself", "Add items by hand"],
                  ["smart", <Sparkles key="s" className="size-4" />, "Fill automatically", "Based on a simple rule"],
                ] as const
              ).map(([k, icon, title, hint]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn("rounded-xl border p-3 text-left transition", kind === k ? "border-accent bg-accent-soft/60 ring-2 ring-accent-soft" : "border-line hover:border-line-strong")}
                >
                  <span className={cn("mb-1.5 grid size-7 place-items-center rounded-lg", kind === k ? "bg-accent text-white" : "bg-sunken text-ink-2")}>{icon}</span>
                  <span className="block text-[13px] font-semibold">{title}</span>
                  <span className="block text-[11.5px] text-muted">{hint}</span>
                </button>
              ))}
            </div>
            <Field label="Album name">
              <input name="name" autoFocus required className="field" placeholder="e.g. Family Reunions — 1990s" />
            </Field>
            <Field label="Description" hint="Optional">
              <textarea name="description" rows={2} className="field resize-none" placeholder="What belongs here?" />
            </Field>
            {kind === "smart" && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-sunken/60 p-3">
                <Field label="Include everything…">
                  <select className="field" value={ruleKey} onChange={(e) => (setRuleKey(e.target.value as RuleKey), setRuleValue(""))}>
                    {Object.entries(ruleOptions).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Value">
                  {opt.values ? (
                    <select className="field" value={ruleValue} onChange={(e) => setRuleValue(e.target.value)}>
                      <option value="">Choose…</option>
                      {opt.values.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input className="field" inputMode="numeric" placeholder="1992" value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} />
                  )}
                </Field>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={pending || (kind === "smart" && !ruleValue)}>
                {pending ? "Creating…" : "Create album"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
