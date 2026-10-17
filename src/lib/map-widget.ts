// Shared model for the map / location widget: zoom levels, tile looks and caption lines.

export type MapLevel = "globe" | "continent" | "country" | "region" | "city" | "neighborhood" | "street";
export type MapLook = "soft" | "voyager" | "mono" | "dark" | "satellite";
export type MapDetail = "none" | "country" | "region" | "area" | "street" | "coords";

/** Address parts we keep from geocoding. Any of them may be missing — that's fine. */
export interface GeoParts {
  street?: string;
  neighborhood?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
}

export interface GeoResult extends GeoParts {
  name: string;
  lat: number;
  lng: number;
  kind: string;
}

/** Settings stored on a map widget element. Everything is optional so old widgets keep working. */
export interface MapSettings {
  placeName?: string;
  lat?: number;
  lng?: number;
  parts?: GeoParts;
  level?: MapLevel;
  /** Fine-tuned framing, normalised to a 320px-wide widget (see REF_WIDTH). */
  zoom?: number;
  center?: [number, number];
  look?: MapLook;
  detail?: MapDetail;
  showLocation?: boolean;
  showPin?: boolean;
  showInset?: boolean;
  style?: string;
}

/** MapLibre zooms (512px tiles), tuned for a 320px-wide widget and scaled by actual width so framing is size-independent. */
export const REF_WIDTH = 320;

export const MAP_LEVELS: { level: MapLevel; label: string; zoom: number }[] = [
  { level: "globe", label: "Globe", zoom: 0 },
  { level: "continent", label: "Continent", zoom: 1.6 },
  { level: "country", label: "Country", zoom: 3.8 },
  { level: "region", label: "Region", zoom: 6.3 },
  { level: "city", label: "City", zoom: 10.3 },
  { level: "neighborhood", label: "Neighborhood", zoom: 13 },
  { level: "street", label: "Street", zoom: 15.6 },
];

export const levelZoom = (l: MapLevel) => MAP_LEVELS.find((x) => x.level === l)?.zoom ?? 10.3;

export const MAP_LOOKS: { look: MapLook; label: string }[] = [
  { look: "soft", label: "Explore" },
  { look: "voyager", label: "Vivid" },
  { look: "mono", label: "Muted" },
  { look: "dark", label: "Dark" },
  { look: "satellite", label: "Satellite" },
];

/** Default view for a geocoded result, based on what kind of place it is. */
export function levelForKind(kind: string): MapLevel {
  switch (kind) {
    case "country":
      return "country";
    case "state":
    case "county":
      return "region";
    case "city":
      return "city";
    case "district":
    case "locality":
      return "neighborhood";
    case "street":
    case "house":
      return "street";
    default:
      return "neighborhood";
  }
}

const join = (...xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean))].join(", ");

function formatCoord(v: number, pos: string, neg: string) {
  return `${Math.abs(v).toFixed(3)}° ${v >= 0 ? pos : neg}`;
}

/** The second line under the place name. Returns "" when the data isn't there. */
export function detailText(detail: MapDetail, s: MapSettings): string {
  const p = s.parts ?? {};
  switch (detail) {
    case "none":
      return "";
    case "country":
      return p.country ?? "";
    case "region":
      return join(p.region, p.country);
    case "area":
      return join(p.neighborhood, p.city);
    case "street":
      return join(p.street, p.neighborhood ?? p.city);
    case "coords":
      return s.lat != null && s.lng != null ? `${formatCoord(s.lat, "N", "S")}  ${formatCoord(s.lng, "E", "W")}` : "";
  }
}

export const DETAIL_OPTIONS: { detail: MapDetail; label: string }[] = [
  { detail: "none", label: "None" },
  { detail: "country", label: "Country" },
  { detail: "region", label: "Region, country" },
  { detail: "area", label: "Neighborhood, city" },
  { detail: "street", label: "Street" },
  { detail: "coords", label: "Coordinates" },
];
