import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Download, Printer, Share2 } from "lucide-react";
import { getStory } from "@/lib/data";
import { TopBar } from "@/components/shell/top-bar";
import { PageSkeleton } from "@/components/ui";

export const metadata = { title: "Print & publish" };

export default function PublishPage({ params }: PageProps<"/stories/[storyId]/publish">) {
  return (
    <>
      <TopBar />
      <Suspense fallback={<PageSkeleton />}>
        <Publish params={params} />
      </Suspense>
    </>
  );
}

async function Publish({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  const found = await getStory(storyId);
  if (!found) notFound();
  const { story, sections } = found;
  const pages = Math.max(24, sections.length * 8);
  return (
    <div className="mx-auto mt-6 max-w-3xl px-3">
      <div className="glass p-8">
        <Link href={`/stories/${story.id}/storyboard`} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to Storyboard
        </Link>
        <p className="eyebrow-wide mt-6">Print &amp; publish</p>
        <h1 className="mt-3 font-display text-[48px] leading-none text-ink">{story.title}</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          {story.details?.size ?? "11 x 8.5 in (Landscape)"} · {story.details?.style ?? "Modern Classic"} · about {pages} pages · {sections.length} chapters
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            [<Printer key="p" />, "Order a printed book", "Printing partners are being set up — we’ll let you know when ordering opens."],
            [<Download key="d" />, "Download a PDF", "Export becomes available once printing is connected."],
            [<Share2 key="s" />, "Share online", "Invite family to flip through the story in their browser."],
          ].map(([icon, title, body]) => (
            <div key={title as string} className="glass-strong p-5">
              <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent [&>svg]:size-5">{icon}</span>
              <div className="mt-3 text-[14px] font-medium text-ink">{title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <Link href={`/stories/${story.id}/editor`} className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[13.5px] text-white hover:bg-black">
          <BookOpen className="size-4" /> Keep designing
        </Link>
      </div>
    </div>
  );
}
