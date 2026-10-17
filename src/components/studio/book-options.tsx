"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { updateStoryDetailsAction } from "@/app/actions";
import { BookCover3D } from "@/components/studio/book-cover";
import { COVERS, SIZES, STYLES, coverOf, sizeOf, styleOf } from "@/lib/book-options";
import type { Story } from "@/lib/types";
import { cn } from "@/lib/utils";

const card = "relative rounded-2xl border p-4 text-left transition";
const on = "border-accent bg-white shadow-[0_0_0_3px_var(--color-accent-soft)]";
const off = "border-white/80 bg-white/55 hover:bg-white";

function Picked() {
  return (
    <span className="absolute top-3 right-3 grid size-6 place-items-center rounded-full bg-accent text-white">
      <Check className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

/** Explains each cover type, size and style side by side and lets the user pick. */
export function BookOptions({ story }: { story: Story & { coverUrl?: string } }) {
  const router = useRouter();
  const [cover, setCover] = useState(coverOf(story.details?.cover).id);
  const [size, setSize] = useState(sizeOf(story.details?.size).id);
  const [style, setStyle] = useState(styleOf(story.details?.style).id);
  const [pending, start] = useTransition();
  const back = `/stories/${story.id}/storyboard`;
  const date = story.details?.dateLabel?.replace(/^(\w+) \d+.*?(\d{4})$/, "$1 $2");
  const c = coverOf(cover);
  const sz = sizeOf(size);
  const dirty = cover !== coverOf(story.details?.cover).id || size !== sizeOf(story.details?.size).id || style !== styleOf(story.details?.style).id;

  const save = () =>
    start(async () => {
      await updateStoryDetailsAction(story.id, { details: { cover, size, style } });
      router.push(back);
    });

  return (
    <div className="mx-3 mt-4 grid gap-4 lg:mx-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <main className="glass min-w-0 p-6 lg:p-8">
        <Link href={back} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to Storyboard
        </Link>
        <p className="eyebrow-wide mt-6">Book options</p>
        <h1 className="mt-3 font-display text-[clamp(32px,3vw,48px)] leading-none text-ink">Choose your book</h1>
        <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-ink-2">
          Every Revories book is printed on archival paper. Pick the cover, size and style that suit your story — you can change any of these until you order.
        </p>

        {/* Cover type */}
        <section className="mt-8">
          <h2 className="font-display text-[24px] text-ink">1. Cover &amp; binding</h2>
          <p className="mt-1 text-[13px] text-ink-2">How the book is bound decides how it feels in your hands, how flat it opens and how long it lasts.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {COVERS.map((o) => (
              <button key={o.id} type="button" onClick={() => setCover(o.id)} className={cn(card, cover === o.id ? on : off)} aria-pressed={cover === o.id}>
                {cover === o.id && <Picked />}
                <BookCover3D title={story.title} photo={story.coverUrl} cover={o.id} style={style} size="8 x 8 in (Square)" maxSide={124} className="pointer-events-none -mt-1" />
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-medium text-ink">{o.name}</span>
                  <span className="text-[12px] tracking-wider text-ink-2">
                    {"$$$".slice(0, o.price)}
                    <span className="text-faint">{"$$$".slice(o.price)}</span>
                  </span>
                </div>
                <div className="text-[12px] text-accent">{o.tagline}</div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{o.description}</p>
                <ul className="mt-2 space-y-1 text-[11.5px] text-ink-2">
                  {o.details.map((d) => (
                    <li key={d} className="flex gap-1.5">
                      <Check className="mt-0.5 size-3 shrink-0 text-forest" /> {d}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11.5px] text-muted">
                  <span className="text-ink-2">Best for:</span> {o.bestFor}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl bg-white/55">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead className="text-ink-2">
                <tr className="border-b border-ink/5">
                  <th className="px-4 py-2.5 font-medium">Compare</th>
                  {COVERS.map((o) => (
                    <th key={o.id} className={cn("px-3 py-2.5 font-medium", cover === o.id && "text-accent")}>
                      {o.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 text-ink">
                {[
                  ["Cover", "Printed, flexible", "Printed, rigid", "Printed, rigid", "Linen cloth, rigid"],
                  ["Opens flat", "No", "Nearly", "Yes, 180°", "Nearly"],
                  ["Page count", ...COVERS.map((o) => o.pages)],
                  ["Durability", "Good", "Excellent", "Excellent", "Heirloom"],
                  ["Relative price", ...COVERS.map((o) => "$$$".slice(0, o.price))],
                ].map(([k, ...vals]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 text-ink-2">{k}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={cn("px-3 py-2", COVERS[i].id === cover && "bg-accent-soft/50")}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Size */}
        <section className="mt-10">
          <h2 className="font-display text-[24px] text-ink">2. Size</h2>
          <p className="mt-1 text-[13px] text-ink-2">Shown to scale against each other. Bigger books give photos more room; smaller ones cost less to share.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {SIZES.map((o) => (
              <button key={o.id} type="button" onClick={() => setSize(o.id)} className={cn(card, size === o.id ? on : off)} aria-pressed={size === o.id}>
                {size === o.id && <Picked />}
                <div className="flex h-[92px] items-end">
                  <span className={cn("block rounded-[3px] border-2", size === o.id ? "border-accent bg-accent-soft" : "border-ink/25 bg-white")} style={{ width: o.w * 7, height: o.h * 7 }} />
                </div>
                <div className="mt-3 text-[15px] font-medium text-ink">{o.label}</div>
                <div className="text-[12px] text-accent">{o.shape}</div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{o.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Style */}
        <section className="mt-10">
          <h2 className="font-display text-[24px] text-ink">3. Design style</h2>
          <p className="mt-1 text-[13px] text-ink-2">Sets the cover layout, fonts and page templates. On a Linen Heritage cover it also picks the cloth color.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {STYLES.map((o) => (
              <button key={o.id} type="button" onClick={() => setStyle(o.id)} className={cn(card, style === o.id ? on : off)} aria-pressed={style === o.id}>
                {style === o.id && <Picked />}
                <BookCover3D title={story.title} photo={story.coverUrl} cover={cover} style={o.id} size="8 x 8 in (Square)" maxSide={124} className="pointer-events-none -mt-1" />
                <div className="mt-1 text-[15px] font-medium text-ink">{o.id}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{o.description}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Live preview */}
      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="glass p-5">
          <p className="eyebrow-wide">Your book</p>
          <BookCover3D title={story.title} subtitle={story.subtitle} date={date} photo={story.coverUrl} cover={cover} style={style} size={size} maxSide={260} relative className="mt-4" />
          <dl className="mt-4 divide-y divide-ink/5 text-[13px]">
            {[
              ["Cover", c.name],
              ["Size", `${sz.label} (${sz.shape})`],
              ["Style", style],
              ["Pages", c.pages],
            ].map(([k, v]) => (
              <div key={k} className="flex py-2">
                <dt className="w-24 text-ink-2">{k}</dt>
                <dd className="flex-1 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={save} disabled={pending} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] text-white hover:bg-black disabled:opacity-60">
            <Check className="size-4" /> {pending ? "Saving…" : dirty ? "Save & return to storyboard" : "Done"}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted">Printing prices are confirmed at checkout.</p>
        </div>
      </aside>
    </div>
  );
}
