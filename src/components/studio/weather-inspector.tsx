"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { PlaceSearch } from "@/components/studio/map-inspector";
import { WeatherWidget } from "@/components/studio/weather-widget";
import { styleClass, type WidgetStyle } from "@/components/studio/widgets";
import { dateShort, hourLong, layoutSize, type DayCount, type WeatherLayout, type WeatherSettings } from "@/lib/weather";
import type { Place, SpreadElement } from "@/lib/types";
import { cn } from "@/lib/utils";

const LAYOUTS: { layout: WeatherLayout; label: string }[] = [
  { layout: "moment", label: "One time" },
  { layout: "hourly", label: "Hourly" },
  { layout: "days", label: "Multi-day" },
];
const DAY_COUNTS: DayCount[] = [5, 7, 10, 14];
const INTERVALS = [1, 2, 3, 4, 6];

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("h-7 flex-1 rounded-md px-1.5 text-[11.5px]", value === o.value ? "bg-surface font-medium text-ink shadow-sm" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Inspector controls for the weather widget. */
export function WeatherInspector({
  settings: s,
  onPatch,
  places,
  tripDates,
}: {
  settings: WeatherSettings;
  /** Settings patch, plus an optional element patch (used to resize for a new layout). */
  onPatch: (p: Partial<WeatherSettings>, el?: Partial<SpreadElement>) => void;
  places: Place[];
  /** Distinct YYYY-MM-DD dates from this section's photos. */
  tripDates: string[];
}) {
  const layout = s.layout ?? "moment";
  const days = s.days ?? 7;
  const interval = s.interval ?? 4;
  const fromHour = s.fromHour ?? 0;
  const points = Math.ceil((24 - fromHour) / interval);
  const resizeFor = (l: WeatherLayout, d = days, p = points) => layoutSize(l, d, p);

  return (
    <>
      <div className="h-40 rounded-xl bg-gradient-to-br from-sky-100 to-amber-50 p-2.5">
        <WeatherWidget settings={s} className={cn("flex size-full flex-col rounded-xl shadow-sm", styleClass[(s.style as WidgetStyle) ?? "minimal"])} />
      </div>

      <PlaceSearch onPick={(r) => onPatch({ placeName: r.name, lat: r.lat, lng: r.lng })} />
      {places.length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {places.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPatch({ placeName: p.name, lat: p.lat, lng: p.lng })}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px]",
                s.lat === p.lat && s.lng === p.lng ? "border-accent bg-accent-soft/60 text-accent" : "border-line hover:border-line-strong",
              )}
            >
              <MapPin className="size-3 text-place" />
              {p.name}
            </button>
          ))}
        </div>
      )}

      <label className="block">
        <span className="label mb-1.5 block">Label</span>
        <input key={s.placeName} className="field" defaultValue={s.placeName ?? ""} placeholder="Santorini" onBlur={(e) => onPatch({ placeName: e.target.value })} />
      </label>

      <div>
        <span className="label mb-1.5 block">{layout === "days" ? "First day" : "Date"}</span>
        <input type="date" className="field" value={s.date ?? ""} min="1940-01-01" onChange={(e) => onPatch({ date: e.target.value || undefined })} />
        {tripDates.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tripDates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onPatch({ date: d })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px]",
                  s.date === d ? "border-accent bg-accent-soft/60 text-accent" : "border-line hover:border-line-strong",
                )}
              >
                <CalendarDays className="size-3 text-event" />
                {dateShort(d)}
              </button>
            ))}
          </div>
        )}
        <span className="mt-1 block text-[11px] text-muted">Past dates show recorded weather; upcoming dates use the forecast (up to ~16 days out).</span>
      </div>

      <div>
        <span className="label mb-1.5 block">Show</span>
        <Segmented
          value={layout}
          options={LAYOUTS.map((l) => ({ value: l.layout, label: l.label }))}
          onChange={(l) => onPatch({ layout: l }, resizeFor(l))}
        />
      </div>

      {layout === "moment" && (
        <label className="block">
          <span className="label mb-1.5 block">Time</span>
          <select className="field" value={s.hour ?? 12} onChange={(e) => onPatch({ hour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {hourLong(h)}
              </option>
            ))}
          </select>
        </label>
      )}

      {layout === "hourly" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label mb-1.5 block">Every</span>
            <select
              className="field"
              value={interval}
              onChange={(e) => {
                const iv = Number(e.target.value);
                onPatch({ interval: iv }, resizeFor("hourly", days, Math.ceil((24 - fromHour) / iv)));
              }}
            >
              {INTERVALS.map((n) => (
                <option key={n} value={n}>
                  {n} hour{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label mb-1.5 block">Starting</span>
            <select
              className="field"
              value={fromHour}
              onChange={(e) => {
                const fh = Number(e.target.value);
                onPatch({ fromHour: fh }, resizeFor("hourly", days, Math.ceil((24 - fh) / interval)));
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {hourLong(h)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {layout === "days" && (
        <div>
          <span className="label mb-1.5 block">Days</span>
          <Segmented value={days} options={DAY_COUNTS.map((d) => ({ value: d, label: `${d} days` }))} onChange={(d) => onPatch({ days: d }, resizeFor("days", d))} />
        </div>
      )}

      <div>
        <span className="label mb-1.5 block">Units</span>
        <Segmented
          value={s.unit ?? "f"}
          options={[
            { value: "f", label: "°F" },
            { value: "c", label: "°C" },
          ]}
          onChange={(u) => onPatch({ unit: u })}
        />
      </div>

      <div>
        <span className="label mb-1.5 block">Show elements</span>
        {(
          [
            ["showLocation", "Location name", true],
            ["showDescription", "Condition text", true],
            ["showDate", "Date", true],
            ["showDetails", "Feels like, humidity, wind", false],
          ] as const
        )
          .filter(([k]) => k !== "showDetails" || layout === "moment")
          .map(([k, label, def]) => (
            <label key={k} className="flex items-center justify-between py-1 text-[12.5px]">
              {label}
              <input type="checkbox" className="accent-[var(--color-accent)]" checked={s[k] ?? def} onChange={(e) => onPatch({ [k]: e.target.checked })} />
            </label>
          ))}
      </div>
    </>
  );
}
