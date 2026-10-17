// Shared model for the weather widget: API shapes, settings, WMO condition codes, units.

export interface WeatherHour {
  /** Local time at the place, "YYYY-MM-DDTHH:00". */
  time: string;
  temp: number | null;
  feels: number | null;
  code: number | null;
  isDay: boolean;
  humidity: number | null;
  /** km/h */
  wind: number | null;
  /** mm */
  precip: number | null;
}

export interface WeatherDay {
  date: string;
  code: number | null;
  hi: number | null;
  lo: number | null;
  precip: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherData {
  timezone: string;
  days: WeatherDay[];
  hours: WeatherHour[];
  /** recorded = observed history; forecast = upcoming; mixed = both; none = nothing yet. */
  source: "recorded" | "forecast" | "mixed" | "none";
  /** future = too far ahead for a forecast; partial = only the first ~16 days are available. */
  note?: "future" | "partial";
}

export type WeatherLayout = "moment" | "hourly" | "days";
export type DayCount = 5 | 7 | 10 | 14;

export interface WeatherSettings {
  placeName?: string;
  lat?: number;
  lng?: number;
  /** YYYY-MM-DD, local to the place. */
  date?: string;
  layout?: WeatherLayout;
  /** Hour for the "moment" layout, 0–23. */
  hour?: number;
  /** Hourly layout: first hour shown and the step between points. */
  fromHour?: number;
  interval?: number;
  days?: DayCount;
  unit?: "f" | "c";
  showLocation?: boolean;
  showDescription?: boolean;
  showDate?: boolean;
  showDetails?: boolean;
  style?: string;
  // Legacy hand-typed values, shown when no place/date is set.
  temp?: number;
  label?: string;
}

/** Suggested widget size (% of the spread) per layout, so the content fits nicely. */
export function layoutSize(layout: WeatherLayout, days: DayCount = 7, points = 6): { w: number; h: number } {
  if (layout === "moment") return { w: 18, h: 20 };
  if (layout === "hourly") return { w: Math.min(46, 8 + points * 4.6), h: 20 };
  return days <= 7 ? { w: Math.min(46, 8 + days * 5), h: 22 } : { w: 44, h: 36 };
}

export type Sky = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** WMO weather interpretation codes → a condition label and icon family. */
export function condition(code: number | null | undefined): { label: string; sky: Sky } {
  switch (code) {
    case 0:
      return { label: "Clear", sky: "clear" };
    case 1:
      return { label: "Mostly clear", sky: "partly" };
    case 2:
      return { label: "Partly cloudy", sky: "partly" };
    case 3:
      return { label: "Cloudy", sky: "cloudy" };
    case 45:
    case 48:
      return { label: "Fog", sky: "fog" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: "Drizzle", sky: "drizzle" };
    case 61:
    case 80:
      return { label: "Light rain", sky: "rain" };
    case 63:
    case 81:
      return { label: "Rain", sky: "rain" };
    case 65:
    case 82:
      return { label: "Heavy rain", sky: "rain" };
    case 66:
    case 67:
      return { label: "Freezing rain", sky: "rain" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: "Snow", sky: "snow" };
    case 95:
    case 96:
    case 99:
      return { label: "Thunderstorms", sky: "storm" };
    default:
      return { label: "—", sky: "partly" };
  }
}

export const toUnit = (c: number | null | undefined, unit: "f" | "c") => (c == null ? null : Math.round(unit === "f" ? (c * 9) / 5 + 32 : c));
export const windText = (kmh: number | null, unit: "f" | "c") => (kmh == null ? "" : unit === "f" ? `${Math.round(kmh * 0.621)} mph` : `${Math.round(kmh)} km/h`);

export const hourLabel = (h: number) => (h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`);
export const hourLong = (h: number) => (h === 0 ? "12 AM" : h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`);

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...o });
export const dateLong = (iso: string) => fmt(iso, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
export const dateShort = (iso: string) => fmt(iso, { month: "short", day: "numeric" });
export const weekday = (iso: string) => fmt(iso, { weekday: "short" });

const cache = new Map<string, Promise<WeatherData | null>>();

/** Fetch (and memoise) weather for a place and date range. */
export function loadWeather(lat: number, lng: number, start: string, end: string): Promise<WeatherData | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${start},${end}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(`/api/weather?lat=${lat}&lng=${lng}&start=${start}&end=${end}`)
        .then((r) => (r.ok ? (r.json() as Promise<WeatherData>) : null))
        .catch(() => null)
        .then((d) => {
          if (!d) cache.delete(key);
          return d;
        }),
    );
  }
  return cache.get(key)!;
}
