"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { createUploadLinkAction, inviteAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import type { Invite, UploadLink } from "@/lib/types";
import { cn, ROLE_COPY } from "@/lib/utils";

const ROLES: Invite["role"][] = ["viewer", "contributor", "organizer", "editor"];

export function RolePicker({ value, onChange }: { value: Invite["role"]; onChange: (r: Invite["role"]) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex items-start gap-2.5 rounded-xl border p-3 text-left transition",
            value === r ? "border-accent bg-accent-soft/50 ring-2 ring-accent-soft" : "border-line hover:border-line-strong",
          )}
        >
          <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2", value === r ? "border-accent" : "border-line-strong")}>
            {value === r && <span className="size-1.5 rounded-full bg-accent" />}
          </span>
          <span>
            <span className="block text-[13px] font-semibold">{ROLE_COPY[r].label}</span>
            <span className="block text-[11.5px] text-muted">{ROLE_COPY[r].can}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

const noop = () => () => {};

/** Copyable text field. Paths starting with "/" get the site origin prepended on the client. */
export function CopyField({ value: raw }: { value: string }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const value = raw.startsWith("/") ? origin + raw : raw;
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={value} className="field flex-1 bg-sunken/50 font-mono text-[12px]" onFocus={(e) => e.target.select()} />
      <Button
        variant={copied ? "forest" : "secondary"}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function uploadLinkUrl(token: string) {
  return `/u/${token}`;
}

/**
 * Invite to a whole project, or one album, or hand out an upload-only link —
 * written in plain English, no role jargon.
 */
export function ShareModal({ albumId, albumName, onClose }: { albumId?: string; albumName?: string; onClose: () => void }) {
  const meta = useMeta();
  const [tab, setTab] = useState<"invite" | "link">("invite");
  const [scope, setScope] = useState<"project" | "album">(albumId ? "album" : "project");
  const [role, setRole] = useState<Invite["role"]>("contributor");
  const [emails, setEmails] = useState("");
  const [sent, setSent] = useState<string[] | null>(null);
  const [link, setLink] = useState<UploadLink | null>(null);
  const [linkAlbum, setLinkAlbum] = useState(albumId ?? meta.albums.find((a) => a.kind === "inbox")?.id);
  const [pending, start] = useTransition();

  const parsed = emails.split(/[\s,;]+/).filter((e) => /.+@.+\..+/.test(e));

  return (
    <Modal title="Share" description={albumName ? `Bring people into “${albumName}” or the whole archive.` : "Bring family and friends into this archive."} onClose={onClose} width="max-w-xl">
      <div className="mb-5 flex rounded-xl bg-sunken p-1">
        {(
          [
            ["invite", <Mail key="i" className="size-4" />, "Invite people"],
            ["link", <Link2 key="l" className="size-4" />, "Upload link"],
          ] as const
        ).map(([k, icon, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn("flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-medium", tab === k ? "bg-surface shadow-[var(--shadow-soft)]" : "text-muted")}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === "invite" ? (
        sent ? (
          <div className="rounded-xl bg-accent-soft p-5 text-center">
            <Check className="mx-auto size-6 text-accent" />
            <p className="mt-2 text-[14px] font-semibold">Invites on their way</p>
            <p className="text-[12.5px] text-muted">{sent.join(", ")} will get an email with a link to join.</p>
            <Button className="mt-4" onClick={() => (setSent(null), setEmails(""))}>
              Invite more
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!parsed.length) return;
              start(async () => {
                await inviteAction({ projectId: meta.projectId, albumId: scope === "album" ? albumId : undefined, emails: parsed, role });
                setSent(parsed);
              });
            }}
          >
            <Field label="Email addresses" hint="Separate with commas">
              <textarea rows={2} value={emails} onChange={(e) => setEmails(e.target.value)} className="field resize-none" placeholder="grandma@example.com, uncle.joe@example.com" />
            </Field>
            {albumId && (
              <Field label="What can they see?">
                <div className="flex gap-2">
                  {(["album", "project"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      className={cn("h-9 flex-1 rounded-lg border text-[12.5px] font-medium", scope === s ? "border-accent bg-accent-soft/60 text-accent" : "border-line text-ink-2")}
                    >
                      {s === "album" ? `Just this album` : "The whole project"}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <div>
              <div className="label mb-1.5">What can they do?</div>
              <RolePicker value={role} onChange={setRole} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={!parsed.length || pending}>
                <Share2 className="size-4" /> {pending ? "Sending…" : parsed.length ? `Send ${parsed.length} invite${parsed.length > 1 ? "s" : ""}` : "Send invites"}
              </Button>
            </div>
          </form>
        )
      ) : (
        <div className="space-y-5">
          <p className="text-[13px] text-ink-2">
            Perfect for relatives who just want to send photos. Anyone with the link can upload — they don’t need an account, and they can’t see or change anything else.
          </p>
          <Field label="Uploads go to">
            <select className="field" value={linkAlbum} onChange={(e) => (setLinkAlbum(e.target.value), setLink(null))}>
              {meta.albums
                .filter((a) => a.kind !== "smart")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kind === "inbox" ? "Inbox (to be sorted)" : a.name}
                  </option>
                ))}
            </select>
          </Field>
          {link ? (
            <div className="space-y-2">
              <CopyField value={uploadLinkUrl(link.token)} />
              <p className="text-[11.5px] text-muted">You can turn this link off anytime from Settings → Sharing.</p>
            </div>
          ) : (
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const al = meta.album(linkAlbum ?? "");
                  setLink(await createUploadLinkAction(meta.projectId, linkAlbum, al && al.kind !== "inbox" ? `Uploads for ${al.name}` : "Family upload link"));
                })
              }
            >
              <Link2 className="size-4" /> {pending ? "Creating…" : "Create upload link"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}

export function ShareButton({ albumId, albumName, label = "Share" }: { albumId?: string; albumName?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Share2 className="size-4" /> {label}
      </Button>
      {open && <ShareModal albumId={albumId} albumName={albumName} onClose={() => setOpen(false)} />}
    </>
  );
}
