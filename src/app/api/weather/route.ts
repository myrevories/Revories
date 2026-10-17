import { NextResponse, type NextRequest } from "next/server";
import type { WeatherData, WeatherDay, WeatherHour } from "@/lib/weather";

// Weather for a place over a date range, from Open-Meteo (no key).
//   GET /api/weather?lat=..&lng=..&start=YYYY-MM-DD&end=YYYY-MM-DD
// Past dates come from the ERA5 archive (recorded weather, ~5 days behind);
// recent and upcoming dates (−90 … +15 days) from the forecast API. Values are
// metric; the widget converts to °F / mph.

const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const HOURLY = "temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m,precipitation";
const DAILY = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return day(d);
};

interface OpenMeteo {
  timezone: string;
  hourly?: Record<string, (number | string | null)[]>;
  daily?: Record<string, (number | string | null)[]>;
}

async function fetchRange(base: string, lat: number, lng: number, start: string, end: string): Promise<OpenMeteo> {
  const url = `${base}?latitude=${lat}&longitude=${lng}&start_date=${start}&end_date=${end}&hourly=${HOURLY}&daily=${DAILY}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

const num = (v: number | string | null | undefined) => (typeof v === "number" ? v : null);

function normalise(r: OpenMeteo): { days: WeatherDay[]; hours: WeatherHour[] } {
  const h = r.hourly ?? {};
  const d = r.daily ?? {};
  const hours: WeatherHour[] = (h.time ?? []).map((t, i) => ({
    time: String(t),
    temp: num(h.temperature_2m?.[i]),
    feels: num(h.apparent_temperature?.[i]),
    code: num(h.weather_code?.[i]),
    isDay: h.is_day?.[i] !== 0,
    humidity: num(h.relative_humidity_2m?.[i]),
    wind: num(h.wind_speed_10m?.[i]),
    precip: num(h.precipitation?.[i]),
  }));
  const days: WeatherDay[] = (d.time ?? []).map((t, i) => ({
    date: String(t),
    code: num(d.weather_code?.[i]),
    hi: num(d.temperature_2m_max?.[i]),
    lo: num(d.temperature_2m_min?.[i]),
    precip: num(d.precipitation_sum?.[i]),
    sunrise: d.sunrise?.[i] ? String(d.sunrise[i]) : null,
    sunset: d.sunset?.[i] ? String(d.sunset[i]) : null,
  }));
  // The archive returns null for days it hasn't processed yet — drop those.
  return { days: days.filter((x) => x.hi != null), hours: hours.filter((x) => x.temp != null) };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const start = sp.get("start") ?? "";
  let end = sp.get("end") ?? start;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !ISO.test(start) || !ISO.test(end) || end < start)
    return NextResponse.json({ error: "Pass lat, lng, start and end (YYYY-MM-DD)" }, { status: 400 });

  const today = day(new Date());
  const archiveEdge = addDays(today, -6); // last day the archive reliably has
  const forecastFirst = addDays(today, -90);
  const forecastLast = addDays(today, 15);

  if (start < "1940-01-01") return NextResponse.json({ error: "Weather records start in 1940" }, { status: 400 });
  if (start > forecastLast) {
    const out: WeatherData = { timezone: "", days: [], hours: [], source: "none", note: "future" };
    return NextResponse.json(out);
  }
  const partial = end > forecastLast;
  if (partial) end = forecastLast;

  try {
    let parts: OpenMeteo[];
    let source: WeatherData["source"];
    if (start >= forecastFirst) {
      parts = [await fetchRange(FORECAST, lat, lng, start, end)];
      source = end < today ? "recorded" : start >= today ? "forecast" : "mixed";
    } else if (end <= archiveEdge) {
      parts = [await fetchRange(ARCHIVE, lat, lng, start, end)];
      source = "recorded";
    } else {
      parts = await Promise.all([fetchRange(ARCHIVE, lat, lng, start, archiveEdge), fetchRange(FORECAST, lat, lng, addDays(archiveEdge, 1), end)]);
      source = end < today ? "recorded" : "mixed";
    }
    const merged = parts.map(normalise);
    const out: WeatherData = {
      timezone: parts[0].timezone,
      days: merged.flatMap((m) => m.days),
      hours: merged.flatMap((m) => m.hours),
      source,
      note: partial ? "partial" : undefined,
    };
    // Recorded weather never changes; forecasts do.
    const maxAge = source === "recorded" ? 60 * 60 * 24 * 30 : 60 * 60;
    return NextResponse.json(out, { headers: { "Cache-Control": `public, max-age=${maxAge}` } });
  } catch {
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }
}
