import { NextResponse, type NextRequest } from "next/server";
import type { GeoResult } from "@/lib/map-widget";

// Place search + reverse lookup for the map widget. Proxies Photon (OpenStreetMap
// data, no key) so the provider can be swapped later without touching the client.
//   GET /api/geocode?q=oia            → up to 6 matches
//   GET /api/geocode?lat=..&lng=..    → the nearest address

const PHOTON = "https://photon.komoot.io";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    type?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

function toResult(f: PhotonFeature): GeoResult {
  const p = f.properties;
  const street = p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : undefined;
  const kind = p.type ?? "other";
  return {
    name: p.name ?? street ?? p.city ?? p.state ?? p.country ?? "Unnamed place",
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    kind,
    street: kind === "street" ? p.name : street,
    neighborhood: p.locality ?? p.district,
    city: kind === "city" ? p.name : p.city,
    region: kind === "state" ? p.name : p.state ?? p.county,
    country: kind === "country" ? p.name : p.country,
    countryCode: p.countrycode,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));

  let url: string;
  if (q) {
    if (q.length > 200) return NextResponse.json({ error: "Query too long" }, { status: 400 });
    url = `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
  } else if (Number.isFinite(lat) && Number.isFinite(lng) && sp.has("lat") && sp.has("lng")) {
    url = `${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`;
  } else {
    return NextResponse.json({ error: "Pass q, or lat and lng" }, { status: 400 });
  }

  const res = await fetch(url, { headers: { "User-Agent": "Revories/0.1 (family photo books)" } }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: "Geocoder unavailable" }, { status: 502 });
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const results = (data.features ?? []).map(toResult);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
