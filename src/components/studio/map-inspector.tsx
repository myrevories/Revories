"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { MapWidget, reversePlace, searchPlaces } from "@/components/studio/map-widget";
import { styleClass, type WidgetStyle } from "@/components/studio/widgets";
import { DETAIL_OPTIONS, MAP_LEVELS, MAP_LOOKS, detailText, levelForKind, type GeoResult, type MapSettings } from "@/lib/map-widget";
import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";

const join = (...xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean))].join(", ");

/** Inspector controls for the map / location widget. */
export function MapInspector({
  settings: s,
  onPatch,
  places,
}: {
  settings: MapSettings;
  onPatch: (p: Partial<MapSettings>) => void;
  /** Places from this project that have coordinates — section photos' places first. */
  places: Place[];
}) {
  const level = s.level ?? "city";
  const tuned = s.zoom != null || s.center != null;
  const [busy, setBusy] = useState<string | null>(null);

  const pick = (r: GeoResult, label?: string) =>
    onPatch({
      placeName: label ?? r.name,
      lat: r.lat,
      lng: r.lng,
      parts: { street: r.street, neighborhood: r.neighborhood, city: r.city, region: r.region, country: r.country, countryCode: r.countryCode },
      level: levelForKind(r.kind),
      zoom: undefined,
      center: undefined,
    });

  const pickPlace = async (p: Place) => {
    setBusy(p.id);
    const r = await reversePlace(p.lat!, p.lng!);
    setBusy(null);
    const fallbackCountry = p.address?.split(",").at(-1)?.trim();
    // The nearest address is often a landmark; frame by how precise the place itself is.
    const kind = p.precision === "exact" ? "locality" : "city";
    pick(r ? { ...r, lat: p.lat!, lng: p.lng!, kind } : { name: p.name, lat: p.lat!, lng: p.lng!, kind, country: fallbackCountry }, p.name);
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="h-44 rounded-xl bg-gradient-to-br from-sky-100 to-amber-50 p-2.5">
          <MapWidget settings={s} interactive className={cn("flex size-full flex-col rounded-xl shadow-sm", styleClass[(s.style as WidgetStyle) ?? "minimal"])} onFrame={(center, zoom) => onPatch({ center, zoom })} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{level === "globe" ? "Globe view" : "Drag to frame · scroll to zoom"}</span>
          {tuned && level !== "globe" && (
            <button type="button" className="inline-flex items-center gap-1 font-medium text-accent hover:underline" onClick={() => onPatch({ zoom: undefined, center: undefined })}>
              <Crosshair className="size-3" /> Reset framing
            </button>
          )}
        </div>
      </div>

      <PlaceSearch onPick={(r) => pick(r)} />

      {places.length > 0 && (
        <div>
          <span className="label mb-1.5 block">From this trip</span>
          <div className="flex flex-wrap gap-1.5">
            {places.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPlace(p)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px]",
                  s.lat === p.lat && s.lng === p.lng ? "border-accent bg-accent-soft/60 text-accent" : "border-line hover:border-line-strong",
                )}
              >
                {busy === p.id ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3 text-place" />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block">
        <span className="label mb-1.5 block">Label</span>
        <input key={s.placeName} className="field" defaultValue={s.placeName ?? ""} placeholder="Santorini" onBlur={(e) => onPatch({ placeName: e.target.value })} />
      </label>

      <div>
        <span className="label mb-1.5 block">View</span>
        <div className="flex flex-wrap gap-1.5">
          {MAP_LEVELS.map((l) => (
            <button
              key={l.level}
              type="button"
              onClick={() => onPatch({ level: l.level, zoom: undefined, center: undefined })}
              className={cn(
                "h-8 rounded-lg border px-2.5 text-[11.5px]",
                level === l.level ? "border-accent bg-accent-soft/50 font-medium text-accent" : "border-line hover:border-line-strong",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="label mb-1.5 block">Map look</span>
        <div className="grid grid-cols-5 gap-1">
          {MAP_LOOKS.map((l) => {
            const active = (s.look ?? (s.style === "bold" ? "dark" : "soft")) === l.look;
            return (
              <button
                key={l.look}
                type="button"
                onClick={() => onPatch({ look: l.look })}
                className={cn("rounded-lg border p-1 text-[10px]", active ? "border-accent ring-2 ring-accent-soft" : "border-line")}
              >
                <LookSwatch look={l.look} />
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="label mb-1.5 block">Detail line</span>
        <select className="field" value={s.detail ?? "none"} onChange={(e) => onPatch({ detail: e.target.value as MapSettings["detail"] })}>
          {DETAIL_OPTIONS.map((o) => {
            const preview = detailText(o.detail, s);
            return (
              <option key={o.detail} value={o.detail} disabled={o.detail !== "none" && !preview}>
                {o.label}
                {preview ? ` — ${preview}` : o.detail !== "none" ? " (not available)" : ""}
              </option>
            );
          })}
        </select>
        <span className="mt-1 block text-[11px] text-muted">Street detail is optional — leave it off to keep just the place.</span>
      </label>

      <div>
        <span className="label mb-1.5 block">Show elements</span>
        {(
          [
            ["showLocation", "Location name", true],
            ["showPin", "Pin", true],
            ["showInset", "Globe inset", false],
          ] as const
        )
          .filter(([k]) => !(k === "showInset" && level === "globe"))
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

function LookSwatch({ look }: { look: MapSettings["look"] }) {
  const c = {
    soft: ["#f4f1ea", "#fbcd5e", "#7fc4f3"],
    voyager: ["#f6f2e9", "#ffb938", "#5fb3f0"],
    mono: ["#f3f2ef", "#f1e2bb", "#b4d5ec"],
    dark: ["#232427", "#9a7a3a", "#16314a"],
    satellite: ["#3d5a3a", "#c9b98f", "#123150"],
  }[look ?? "soft"];
  return (
    <div className="mb-1 h-7 overflow-hidden rounded-md" style={{ background: c[0] }}>
      <svg viewBox="0 0 40 20" className="size-full" preserveAspectRatio="none">
        <path d="M0 14 C10 10 18 18 40 9 L40 20 L0 20Z" fill={c[2]} />
        <path d="M0 6 L40 12 M14 0 L18 20" stroke={c[1]} strokeWidth="2.2" fill="none" />
      </svg>
    </div>
  );
}

export function PlaceSearch({ onPick }: { onPick: (r: GeoResult) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      searchPlaces(term).then((rs) => {
        if (!live) return;
        setResults(rs);
        setLoading(false);
      });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (r: GeoResult) => {
    onPick(r);
    setQ("");
    setResults([]);
    setOpen(false);
  };
  const shown = q.trim().length >= 2 ? results : [];

  return (
    <div ref={box} className="relative">
      <span className="label mb-1.5 block">Location</span>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input
          className="field pl-9"
          value={q}
          placeholder="Search a city, neighborhood or street"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown[0]) choose(shown[0]);
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" />}
      </div>
      {open && shown.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl bg-surface py-1 shadow-lg ring-1 ring-line">
          {shown.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button type="button" onClick={() => choose(r)} className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-sunken">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-place" />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium">{r.name}</span>
                  <span className="block truncate text-[11px] text-muted">{join(r.kind !== "street" ? r.street : undefined, r.neighborhood, r.city !== r.name ? r.city : undefined, r.region, r.country)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
