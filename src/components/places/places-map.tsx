"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  approximate?: boolean;
}

/**
 * Leaflet + OpenStreetMap tiles. Markers are plain styled divs so they match
 * the app's chip language. `onPick` enables "drop a pin" mode.
 */
export function PlacesMap({
  points,
  selectedId,
  onSelect,
  onPick,
  className,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      const m = mod.map(el.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
      mod.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      m.setView([32, -94], 5);
      m.on("click", (e) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
      map.current = m;
      layer.current = mod.layerGroup().addTo(m);
      draw();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const mod = L.current;
    if (!mod || !map.current || !layer.current) return;
    layer.current.clearLayers();
    for (const p of points) {
      const selected = p.id === selectedId;
      const icon = mod.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div style="transform:translate(-50%,-100%)" class="flex flex-col items-center">
          <div class="whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold shadow-md ${selected ? "bg-[#6b57f5] text-white" : "bg-white text-[#1d1c1a]"}">
            ${p.name.replace(/</g, "&lt;")} <span class="${selected ? "text-white/70" : "text-[#75716a]"}">${p.count}</span>
          </div>
          <div class="h-2 w-0.5 ${selected ? "bg-[#6b57f5]" : "bg-white"}"></div>
        </div>`,
      });
      const marker = mod.marker([p.lat, p.lng], { icon }).addTo(layer.current);
      marker.on("click", () => onSelect?.(p.id));
    }
    if (points.length) {
      const sel = points.find((p) => p.id === selectedId);
      if (sel) map.current.setView([sel.lat, sel.lng], Math.max(map.current.getZoom(), 9));
      else map.current.fitBounds(mod.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 10 });
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(draw, [points, selectedId]);

  return <div ref={el} className={className} style={{ cursor: onPick ? "crosshair" : undefined }} />;
}
