"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MiniPin {
  id: string;
  lat: number;
  lng: number;
  thumb?: string;
}

/** Small, non-interactive map with photo pins, as in the "Places" side cards. */
export function MiniMap({ pins, className }: { pins: MiniPin[]; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  // Re-draw only when the pins actually change, not on every parent render.
  const key = JSON.stringify(pins);
  useEffect(() => {
    const pins = JSON.parse(key) as MiniPin[];
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || !pins.length) return;
      map = L.map(el.current, { zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false });
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        className: "soft-tiles",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      pins.forEach((p, i) => {
        const html = p.thumb && i % 2 === 0
          ? `<div style="transform:translate(-50%,-100%)"><div style="width:34px;height:30px;border:2px solid white;border-radius:5px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.25)"><img src="${p.thumb}" style="width:100%;height:100%;object-fit:cover"/></div><div style="width:2px;height:6px;background:white;margin:0 auto"></div></div>`
          : `<div style="transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#7c5cf0;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`;
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: "", html, iconSize: [0, 0] }) }).addTo(map!);
      });
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [26, 26], maxZoom: 9 });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [key]);
  return <div ref={el} className={className} style={{ background: "#e9eef2" }} />;
}
