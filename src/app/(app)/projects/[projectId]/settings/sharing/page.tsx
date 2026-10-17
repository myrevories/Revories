import { Suspense } from "react";
import { Link2, Mail } from "lucide-react";
import { getProjectMeta, listInvites, listMembers, listUploadLinks } from "@/lib/data";
import { PageBody, ProjectScope } from "@/components/project-scope";
import { Avatar, PageHeader, PageSkeleton, SectionTitle } from "@/components/ui";
import { ShareButton } from "@/components/sharing/share-modal";
import { RoleSelect, UploadLinkRow } from "@/components/sharing/sharing-controls";
import { ROLE_COPY, formatRelative } from "@/lib/utils";

export const metadata = { title: "Sharing" };

export default function SharingPage({ params }: PageProps<"/projects/[projectId]/settings/sharing">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Sharing params={params} />
    </Suspense>
  );
}

async function Sharing({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [members, invites, links, meta] = await Promise.all([listMembers(projectId), listInvites(projectId), listUploadLinks(projectId), getProjectMeta(projectId)]);
  const albumName = (id?: string) => {
    const al = meta.albums.find((a) => a.id === id);
    return !al || al.kind === "inbox" ? "the Inbox" : `“${al.name}”`;
  };

  return (
    <ProjectScope projectId={projectId}>
      {() => (
        <PageBody>
          <PageHeader eyebrow="Settings" title="Sharing & permissions" description="Who can see this archive, and what they can do." actions={<ShareButton label="Invite people" />} />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              <section>
                <SectionTitle title="People with access" />
                <div className="card divide-y divide-line">
                  {members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-3 p-4">
                      <Avatar name={m.user.name} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">{m.user.name}</div>
                        <div className="truncate text-[12px] text-muted">{m.user.email}</div>
                      </div>
                      <RoleSelect projectId={projectId} userId={m.userId} role={m.role} />
                    </div>
                  ))}
                  {invites.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 p-4">
                      <span className="grid size-9 place-items-center rounded-full bg-sunken text-muted">
                        <Mail className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium">{i.email}</div>
                        <div className="text-[12px] text-muted">
                          Invited {formatRelative(i.createdAt)} · {i.albumId ? `to ${albumName(i.albumId)} only` : "whole project"}
                        </div>
                      </div>
                      <span className="rounded-full bg-warn-soft px-2.5 py-1 text-[11.5px] font-medium text-warn">Pending · {ROLE_COPY[i.role].label}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionTitle title="Upload links" hint="Anyone with one of these links can send photos — nothing else." action={<ShareButton label="New link" />} />
                <div className="card divide-y divide-line">
                  {links.map((l) => (
                    <UploadLinkRow key={l.id} id={l.id} token={l.token} label={l.label} target={albumName(l.albumId)} />
                  ))}
                  {!links.length && (
                    <div className="flex items-center gap-3 p-5 text-[12.5px] text-muted">
                      <Link2 className="size-4" /> No active upload links.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="card h-fit p-5">
              <div className="text-[13.5px] font-semibold">What each level means</div>
              <dl className="mt-3 space-y-3">
                {(["viewer", "contributor", "organizer", "editor"] as const).map((r) => (
                  <div key={r}>
                    <dt className="text-[13px] font-medium">{ROLE_COPY[r].label}</dt>
                    <dd className="text-[12px] text-muted">{ROLE_COPY[r].can}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-line pt-4 text-[12px] text-muted">
                You can also share a single album — open it and choose <span className="font-medium text-ink-2">Share</span>.
              </p>
            </aside>
          </div>
        </PageBody>
      )}
    </ProjectScope>
  );
}
