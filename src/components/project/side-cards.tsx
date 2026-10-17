import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight, Home, MapPin, Navigation } from "lucide-react";
import { MiniMap } from "@/components/places/mini-map";
import type { Asset, Person, Place, Story } from "@/lib/types";
import { plural } from "@/lib/utils";

export function SideCard({ title, href, linkLabel = "View All", children, className = "" }: { title: string; href?: string; linkLabel?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`glass p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[21px] leading-tight whitespace-nowrap text-ink 2xl:text-[23px]">{title}</h3>
        {href && (
          <Link href={href} className="flex shrink-0 items-center gap-1 text-[12px] text-ink hover:text-accent">
            {linkLabel} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function PeopleRow({ people, href, max = 5 }: { people: Person[]; href: string; max?: number }) {
  return (
    <div className="flex items-start gap-2">
      {people.slice(0, max).map((p) => (
        <Link key={p.id} href={`${href}?person=${p.id}`} className="flex w-[46px] flex-col items-center text-center 2xl:w-[50px]">
          <span className="size-[44px] overflow-hidden rounded-full bg-sunken ring-2 ring-white 2xl:size-[48px]">{p.avatarUrl && <img src={p.avatarUrl} alt="" className="size-full object-cover" />}</span>
          <span className="mt-1.5 w-full truncate text-[11px] text-ink">{p.name}</span>
        </Link>
      ))}
      {people.length > max && <span className="mt-3 grid size-9 place-items-center rounded-full bg-white/80 text-[11px] text-ink-2">+{people.length - max}</span>}
    </div>
  );
}

export function PlacesCardBody({ places, counts, thumbs, href, unit = "photos" }: { places: Place[]; counts: Record<string, number>; thumbs: Record<string, string | undefined>; href: string; unit?: string }) {
  const pins = places.filter((p) => p.lat != null && p.lng != null).map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, thumb: thumbs[p.id] }));
  const icon = (i: number) => [<Home key="h" />, <Home key="h2" />, <Navigation key="n" />, <MapPin key="m" />][i % 4];
  return (
    <div className="grid grid-cols-[1.2fr_1fr] gap-3">
      <div className="overflow-hidden rounded-xl">
        <MiniMap pins={pins} className="h-[170px] w-full" />
      </div>
      <ul className="space-y-2.5">
        {places.slice(0, 4).map((p, i) => (
          <li key={p.id}>
            <Link href={`${href}?place=${p.id}`} className="flex items-start gap-2.5 hover:text-accent">
              <span className="mt-0.5 text-accent [&>svg]:size-4 [&>svg]:fill-accent-soft">{icon(i)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] text-ink">{p.name}</span>
                <span className="block text-[10.5px] text-muted">{plural(counts[p.id] ?? 0, unit.replace(/s$/, ""), unit)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BookCard({ story, cover, href }: { story: Story; cover?: Asset; href: string }) {
  return (
    <Link href={href} className="glass-strong flex items-center gap-4 p-3 hover:bg-white">
      <span className="relative h-[86px] w-[72px] shrink-0 overflow-hidden rounded-[3px] shadow-[3px_3px_10px_rgb(0_0_0/0.2)]">
        {cover && <img src={cover.thumbUrl} alt="" className="size-full object-cover" />}
        <span className="absolute inset-y-0 left-0 w-1.5 bg-black/15" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[19px] leading-tight text-ink">{story.title}</span>
        {story.subtitle && <span className="mt-1 block text-[12px] text-ink-2">{story.subtitle}</span>}
        <span className="mt-1.5 block text-[11px] text-muted">Created {new Date(story.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}</span>
      </span>
      <ChevronRight className="size-4 text-ink-2" />
    </Link>
  );
}
