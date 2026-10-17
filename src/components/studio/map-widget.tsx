"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Map as GlMapInstance, Marker } from "maplibre-gl";
import type { GeoPermissibleObjects } from "d3-geo";
import { geoOrthographic, geoPath } from "d3-geo";
import "maplibre-gl/dist/maplibre-gl.css";
import { REF_WIDTH, detailText, levelZoom, type GeoResult, type MapLook, type MapSettings } from "@/lib/map-widget";
import { styleFor } from "@/lib/map-style";
import { cn } from "@/lib/utils";

// Oia, Santorini — what a fresh widget shows before a place is chosen.
const FALLBACK = { lat: 36.4618, lng: 25.3753 };

// ───────── Geocoding helpers (memoised per session) ─────────

const geoCache = new Map<string, Promise<GeoResult[]>>();

export function searchPlaces(q: string): Promise<GeoResult[]> {
  const key = q.trim().toLowerCase();
  if (!geoCache.has(key)) {
    geoCache.set(
      key,
      fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d: { results: GeoResult[] }) => d.results)
        .catch(() => {
          geoCache.delete(key);
          return [];
        }),
    );
  }
  return geoCache.get(key)!;
}

export async function reversePlace(lat: number, lng: number): Promise<GeoResult | null> {
  const r = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`).catch(() => null);
  if (!r?.ok) return null;
  const d = (await r.json()) as { results: GeoResult[] };
  return d.results[0] ?? null;
}

/** Widgets saved before coordinates existed only have a name — look it up for display. */
function useCoords(s: MapSettings) {
  const has = s.lat != null && s.lng != null;
  const [found, setFound] = useState<{ q: string; lat: number; lng: number } | null>(null);
  const q = has ? "" : (s.placeName ?? "").trim();
  useEffect(() => {
    if (!q) return;
    let live = true;
    searchPlaces(q).then((rs) => live && rs[0] && setFound({ q, lat: rs[0].lat, lng: rs[0].lng }));
    return () => {
      live = false;
    };
  }, [q]);
  if (has) return { lat: s.lat!, lng: s.lng! };
  if (found && found.q === q) return found;
  return FALLBACK;
}

// ───────── Globe inset (orthographic SVG, Natural Earth land) ─────────

let landPromise: Promise<GeoPermissibleObjects> | null = null;
function loadLand() {
  landPromise ??= Promise.all([import("world-atlas/land-110m.json"), import("topojson-client")]).then(([world, topo]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (world as any).default ?? world;
    return topo.feature(w, w.objects.land) as unknown as GeoPermissibleObjects;
  });
  return landPromise;
}

/** Small "where on Earth" globe, drawn as SVG so it costs no WebGL context. */
export function Globe({ lat, lng, dark, className }: { lat: number; lng: number; dark?: boolean; className?: string }) {
  const [land, setLand] = useState<GeoPermissibleObjects | null>(null);
  useEffect(() => {
    let live = true;
    loadLand().then((l) => live && setLand(l));
    return () => {
      live = false;
    };
  }, []);
  const { path, pin } = useMemo(() => {
    const proj = geoOrthographic().scale(98).translate([100, 100]).rotate([-lng, -lat + 10]);
    return { path: geoPath(proj), pin: proj([lng, lat]) };
  }, [lat, lng]);
  const c = dark ? { ocean: "#1d3448", land: "#55585f" } : { ocean: "#8ec8f0", land: "#f6f2ea" };
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" className={cn("aspect-square", className)} aria-hidden>
      <defs>
        <radialGradient id={`${id}-shade`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity={dark ? 0.14 : 0.5} />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a1a2c" stopOpacity={dark ? 0.45 : 0.28} />
        </radialGradient>
      </defs>
      <path d={path({ type: "Sphere" }) ?? ""} fill={c.ocean} />
      {land && <path d={path(land) ?? ""} fill={c.land} />}
      <path d={path({ type: "Sphere" }) ?? ""} fill={`url(#${id}-shade)`} />
      {pin && (
        <g transform={`translate(${pin[0]} ${pin[1]})`}>
          <circle r={16} fill="#7c5cf0" opacity={0.22} />
          <circle r={7.5} fill="#7c5cf0" stroke="#fff" strokeWidth={3} />
        </g>
      )}
    </svg>
  );
}

// ───────── Vector map (MapLibre) ─────────

function pinElement() {
  const el = document.createElement("div");
  el.style.cssText = "filter:drop-shadow(0 3px 5px rgba(20,10,60,.35));pointer-events:none";
  el.innerHTML = `<svg width="30" height="38" viewBox="0 0 34 43"><defs><linearGradient id="rv-pin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a083fa"/><stop offset="1" stop-color="#6a49e6"/></linearGradient></defs><path d="M17 41.5 11.4 29.9A15 15 0 1 1 22.6 29.9Z" fill="url(#rv-pin)" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><circle cx="17" cy="16" r="5.5" fill="#fff"/></svg>`;
  return el;
}

/** Zoom that makes the whole globe fill ~80% of the smaller side. */
const globeZoom = (w: number, h: number) => Math.log2((0.8 * Math.min(w, h) * Math.PI) / 512);

function VectorMap({
  lat,
  lng,
  zoom,
  center,
  look,
  showPin,
  globe,
  interactive,
  onFrame,
}: {
  lat: number;
  lng: number;
  zoom: number;
  center?: [number, number];
  look: MapLook;
  showPin: boolean;
  globe: boolean;
  interactive?: boolean;
  onFrame?: (center: [number, number], zoom: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<GlMapInstance | null>(null);
  const marker = useRef<Marker | null>(null);
  const mod = useRef<typeof import("maplibre-gl") | null>(null);
  const [ready, setReady] = useState(false);
  const want = useRef({ lat, lng, zoom, center, globe });
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    want.current = { lat, lng, zoom, center, globe };
    onFrameRef.current = onFrame;
  });

  const size = () => ({ w: el.current?.clientWidth || REF_WIDTH, h: el.current?.clientHeight || REF_WIDTH / 2 });
  const targetZoom = () => {
    const { w, h } = size();
    return want.current.globe ? globeZoom(w, h) : want.current.zoom + Math.log2(w / REF_WIDTH);
  };
  const applyView = () => {
    const w = want.current;
    const c = w.center ?? [w.lat, w.lng];
    map.current?.jumpTo({ center: [c[1], c[0]], zoom: targetZoom() });
  };

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    Promise.all([import("maplibre-gl"), styleFor(look, globe)]).then(([gl, style]) => {
      if (cancelled || !el.current) return;
      mod.current = gl;
      // Served from /public — see scripts/copy-maplibre-worker.mjs.
      gl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
      const w = want.current;
      const c = w.center ?? [w.lat, w.lng];
      const m = new gl.Map({
        container: el.current,
        style,
        center: [c[1], c[0]],
        zoom: targetZoom(),
        minZoom: -2,
        interactive: !!interactive,
        attributionControl: false,
        renderWorldCopies: false,
        fadeDuration: 0,
        dragRotate: false,
        pitchWithRotate: false,
      });
      if (interactive) m.touchZoomRotate.disableRotation();
      map.current = m;
      // Only user gestures count as framing (they carry the DOM event).
      m.on("moveend", (e) => {
        if (!("originalEvent" in e) || !e.originalEvent || !onFrameRef.current) return;
        const cc = m.getCenter();
        const { w: width } = size();
        onFrameRef.current([+cc.lat.toFixed(5), +cc.lng.toFixed(5)], +(m.getZoom() - Math.log2(width / REF_WIDTH)).toFixed(2));
      });
      ro = new ResizeObserver(() => {
        m.resize();
        applyView();
      });
      ro.observe(el.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      marker.current?.remove();
      marker.current = null;
      map.current?.remove();
      map.current = null;
      setReady(false);
    };
    // Look changes swap the style below; only interactivity needs a fresh map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    styleFor(look, globe).then((s) => live && map.current?.setStyle(s));
    return () => {
      live = false;
    };
  }, [ready, look, globe]);

  useEffect(() => {
    if (!ready || !map.current || !mod.current) return;
    marker.current?.remove();
    marker.current = showPin ? new mod.current.Marker({ element: pinElement(), anchor: "bottom" }).setLngLat([lng, lat]).addTo(map.current) : null;
  }, [ready, lat, lng, showPin]);

  const cKey = center?.join(",");
  useEffect(() => {
    if (ready) applyView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lat, lng, zoom, cKey, globe]);

  return <div ref={el} className={cn("size-full", !interactive && "pointer-events-none")} />;
}

// ───────── The widget ─────────

export function MapWidget({
  settings: s,
  className,
  interactive,
  onFrame,
}: {
  settings: MapSettings;
  className?: string;
  interactive?: boolean;
  onFrame?: (center: [number, number], zoom: number) => void;
}) {
  const { lat, lng } = useCoords(s);
  const level = s.level ?? "city";
  const look = s.look ?? (s.style === "bold" ? "dark" : "soft");
  const showPin = s.showPin !== false;
  const name = s.showLocation !== false ? (s.placeName ?? "Santorini") : "";
  const detail = detailText(s.detail ?? "none", { ...s, lat, lng });
  const dark = look === "dark" || look === "satellite";
  const globe = level === "globe";
  const credit = look === "satellite" ? "© Esri · © OpenStreetMap" : "© OpenMapTiles · © OpenStreetMap";

  return (
    <div className={cn(className, "relative overflow-hidden", globe && (dark ? "!bg-[#101318]" : "!bg-[#eef4f8]"))}>
      <VectorMap
        lat={lat}
        lng={lng}
        zoom={s.zoom ?? levelZoom(level)}
        center={s.center}
        look={look}
        showPin={showPin}
        globe={globe}
        interactive={interactive}
        onFrame={onFrame}
      />
      {s.showInset && !globe && (
        <div className="pointer-events-none absolute top-[7%] right-[5%] aspect-square h-[28%] max-h-14 min-h-7 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)] ring-[1.5px] ring-white">
          <Globe lat={lat} lng={lng} dark={dark} className="size-full" />
        </div>
      )}
      {(name || detail) && (
        <div
          className={cn(
            "pointer-events-none absolute bottom-[7%] left-[5%] max-w-[78%] rounded-[7px] px-2 py-[3px] leading-tight shadow-[0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md",
            dark || s.style === "bold" ? "bg-black/55 text-white" : "bg-white/80 text-ink",
          )}
        >
          {name && <div className="truncate text-[11px] font-semibold tracking-[-0.01em]">{name}</div>}
          {detail && <div className="truncate text-[9px] opacity-75">{detail}</div>}
        </div>
      )}
      <div className={cn("pointer-events-none absolute right-[3%] bottom-[2%] text-[6px] opacity-60", dark ? "text-white" : "text-ink")}>{credit}</div>
    </div>
  );
}
