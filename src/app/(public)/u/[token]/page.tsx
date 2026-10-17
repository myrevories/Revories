import { Suspense } from "react";
import { Link2Off } from "lucide-react";
import { getUploadLink } from "@/lib/data";
import Link from "next/link";
import { Backdrop } from "@/components/shell/backdrop";
import { APP_NAME } from "@/lib/utils";
import { EmptyState, PageSkeleton } from "@/components/ui";
import { ContributeForm } from "@/components/upload/contribute-form";

export const metadata = { title: "Share your photos" };

/** Public, account-free upload page for relatives with an upload link. */
export default function ContributePage({ params }: PageProps<"/u/[token]">) {
  return (
    <div className="relative min-h-screen pb-12">
      <Backdrop />
      <header className="flex h-20 items-center justify-center">
        <Link href="/" className="font-display text-[24px] tracking-[0.32em] text-ink uppercase">
          {APP_NAME}
        </Link>
      </header>
      <Suspense fallback={<PageSkeleton />}>
        <Contribute params={params} />
      </Suspense>
    </div>
  );
}

async function Contribute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getUploadLink(token);
  if (!found)
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState icon={<Link2Off />} title="This link isn’t active anymore" body="Ask the person who sent it for a fresh one — it only takes them a second." />
      </div>
    );
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="text-center">
        <div className="eyebrow">You’re invited to contribute</div>
        <h1 className="mt-2 font-serif text-[34px] leading-tight font-medium">{found.project.name}</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">
          Have photos, scans, or documents that belong here? Add them below — no account needed. The family will take care of sorting them.
        </p>
      </div>
      <ContributeForm token={token} projectId={found.project.id} />
    </div>
  );
}
