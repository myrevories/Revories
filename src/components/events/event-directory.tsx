"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Image as ImageIcon, MapPin, MoreHorizontal, Users, Video } from "lucide-react";
import { useMeta } from "@/components/meta-context";
import { Avatar } from "@/components/ui";
import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EventCardData {
  id: string;
  name: string;
  recurring: boolean;
  cover?: string;
  years: string;
  location: string;
  photos: number;
  videos: number;
  contributors: string[];
  venue: string;
  firstYear?: number;
  placeId?: string;
  branches: string[];
}

function FilterSelect({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; all: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-medium text-ink">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-[12px] text-ink-2 outline-none">
        <option value="">{all}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Filter row, event pills, and the card grid from the events concept. */
export function EventDirectory({ cards, branches, places }: { cards: EventCardData[]; branches: string[]; places: Place[] }) {
  const meta = useMeta();
  const [tab, setTab] = useState("all");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [place, setPlace] = useState("");
  const [contributor, setContributor] = useState("");
  const [branch, setBranch] = useState("");
  const decades = [...new Set(cards.map((c) => (c.firstYear ? `${Math.floor(c.firstYear / 10) * 10}` : "")).filter(Boolean))].sort();
  const everyone = [...new Set(cards.flatMap((c) => c.contributors))];

  const shown = cards.filter(
    (c) =>
      (tab === "all" || c.id === tab) &&
      (!year || (c.firstYear && Math.floor(c.firstYear / 10) * 10 === Number(year))) &&
      (!type || (type === "recurring" ? c.recurring : !c.recurring)) &&
      (!place || c.placeId === place) &&
      (!contributor || c.contributors.includes(contributor)) &&
      (!branch || c.branches.includes(branch)),
  );

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-line bg-field/60 p-3 md:grid-cols-5">
        <FilterSelect label="Year" value={year} onChange={setYear} all="All years" options={decades.map((d) => [d, `${d}s`])} />
        <FilterSelect label="Event Type" value={type} onChange={setType} all="All events" options={[["recurring", "Recurring"], ["special", "Special"]]} />
        <FilterSelect label="Location" value={place} onChange={setPlace} all="All locations" options={places.map((p) => [p.id, p.name])} />
        <FilterSelect label="Contributors" value={contributor} onChange={setContributor} all="All family members" options={everyone.map((n) => [n, n])} />
        <FilterSelect label="Branch" value={branch} onChange={setBranch} all="All branches" options={branches.map((b) => [b, b])} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[["all", `All Events (${cards.length})`] as const, ...cards.slice(0, 6).map((c) => [c.id, `${c.name.replace(/ \(.+\)$/, "").replace(/ Gatherings$/, "")} (${c.photos + c.videos})`] as const)].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn("h-9 rounded-full px-5 text-[12.5px] transition", tab === id ? "bg-gradient-to-b from-accent-2 to-accent text-white shadow-[0_2px_6px_rgb(124_92_240/0.3)]" : "bg-sunken text-ink-2 hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((c) => (
          <Link key={c.id} href={`/projects/${meta.projectId}/events/${c.id}`} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[16/8.5] overflow-hidden bg-sunken">
              {c.cover && <img src={c.cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />}
              <span className="absolute top-2.5 left-2.5 size-[18px] rounded-[4px] border-[1.5px] border-white bg-white/60" />
              <span className={cn("absolute top-2.5 right-2.5 rounded-full px-3 py-1 text-[11px]", c.recurring ? "bg-white/95 text-accent" : "bg-place-soft text-place")}>{c.recurring ? "Recurring Event" : "Special Event"}</span>
            </div>
            <div className="p-4">
              <div className="font-serif text-[20px] leading-tight font-medium text-ink">{c.name}</div>
              <div className="mt-0.5 text-[13px] text-ink-2">{c.years}</div>
              <div className="mt-3 space-y-1.5 text-[12px] text-ink-2 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-iconblue">
                <div className="flex items-center gap-2">
                  <MapPin /> {c.location}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <ImageIcon /> {c.photos.toLocaleString()} photos
                  </span>
                  <span className="flex items-center gap-2">
                    <Video /> {c.videos} videos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users /> {c.contributors.length} contributors
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex -space-x-2">
                  {c.contributors.slice(0, 3).map((n) => (
                    <Avatar key={n} name={n} size={30} ring />
                  ))}
                </span>
                {c.contributors.length > 3 && <span className="grid h-7 place-items-center rounded-full bg-sunken px-2 text-[11px] text-ink-2">+{c.contributors.length - 3}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-ink-2">
                <span className="flex items-center gap-2">
                  <Home className="size-3.5 text-iconblue" /> {c.venue}
                </span>
                <span className="grid size-8 place-items-center rounded-lg border border-line text-ink-2">
                  <MoreHorizontal className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
        {!shown.length && <p className="col-span-full py-10 text-center text-[13px] text-muted">No events match these filters.</p>}
      </div>
    </>
  );
}
