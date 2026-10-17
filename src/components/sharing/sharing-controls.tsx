"use client";

import { useTransition } from "react";
import { Link2Off } from "lucide-react";
import { revokeUploadLinkAction, setRoleAction } from "@/app/actions";
import { Button } from "@/components/ui";
import { CopyField, uploadLinkUrl } from "@/components/sharing/share-modal";
import type { Role } from "@/lib/types";
import { ROLE_COPY } from "@/lib/utils";

export function RoleSelect({ projectId, userId, role }: { projectId: string; userId: string; role: Role }) {
  const [pending, start] = useTransition();
  if (role === "owner") return <span className="text-[12.5px] font-medium text-muted">Owner</span>;
  return (
    <select
      aria-label="Access"
      disabled={pending}
      defaultValue={role}
      onChange={(e) => start(() => setRoleAction(projectId, userId, e.target.value as Role))}
      className="field h-8 w-auto pr-7 text-[12.5px]"
    >
      {(["viewer", "contributor", "organizer", "editor"] as const).map((r) => (
        <option key={r} value={r}>
          {ROLE_COPY[r].label}
        </option>
      ))}
    </select>
  );
}

export function UploadLinkRow({ id, token, label, target }: { id: string; token: string; label: string; target: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold">{label}</div>
          <div className="text-[11.5px] text-muted">Uploads go to {target}</div>
        </div>
        <Button size="sm" variant="danger" disabled={pending} onClick={() => start(() => revokeUploadLinkAction(id))}>
          <Link2Off className="size-3.5" /> Turn off
        </Button>
      </div>
      <CopyField value={uploadLinkUrl(token)} />
    </div>
  );
}
