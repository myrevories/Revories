"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Moon, Sun } from "lucide-react";
import {
  addDays,
  condition,
  dateLong,
  dateShort,
  hourLabel,
  hourLong,
  loadWeather,
  toUnit,
  weekday,
  windText,
  type Sky,
  type WeatherData,
  type WeatherDay,
  type WeatherHour,
  type WeatherSettings,
} from "@/lib/weather";
import { cn } from "@/lib/utils";

// ───────── Icons (Apple-Weather-style colour, built from lucide shapes) ─────────

export function WxIcon({ code, isDay = true, className }: { code: number | null | undefined; isDay?: boolean; className?: string }) {
  const sky = condition(code).sky;
  const box = cn("relative inline-block shrink-0", className);
  const full = "absolute inset-0 size-full";
  switch (sky) {
    case "clear":
      return <span className={box}>{isDay ? <Sun className={cn(full, "fill-amber-300 text-amber-400")} /> : <Moon className={cn(full, "fill-slate-100 text-slate-200")} />}</span>;
    case "partly":
      return (
        <span className={box}>
          {isDay ? (
            <Sun className="absolute top-0 right-0 size-[62%] fill-amber-300 text-amber-400" />
          ) : (
            <Moon className="absolute top-0 right-0 size-[58%] fill-slate-100 text-slate-200" />
          )}
          <Cloud className="absolute bottom-0 left-0 size-[82%] fill-white text-slate-300" />
        </span>
      );
    case "cloudy":
      return <span className={box}><Cloud className={cn(full, "fill-slate-100 text-slate-400")} /></span>;
    case "fog":
      return <span className={box}><CloudFog className={cn(full, "text-slate-400")} /></span>;
    case "drizzle":
      return <span className={box}><CloudDrizzle className={cn(full, "text-sky-400")} /></span>;
    case "rain":
      return <span className={box}><CloudRain className={cn(full, "text-sky-500")} /></span>;
    case "snow":
      return <span className={box}><CloudSnow className={cn(full, "text-sky-300")} /></span>;
    case "storm":
      return <span className={box}><CloudLightning className={cn(full, "text-amber-500")} /></span>;
  }
}

/** Sky gradient for the "photo" card style, like Apple Weather's backgrounds. */
function skyClass(sky: Sky, isDay: boolean) {
  if (!isDay) return sky === "clear" || sky === "partly" ? "bg-gradient-to-b from-[#0e1730] to-[#2a3a62]" : "bg-gradient-to-b from-[#1c2230] to-[#3c4558]";
  return {
    clear: "bg-gradient-to-b from-[#2f86e6] to-[#86c5f8]",
    partly: "bg-gradient-to-b from-[#3f88d6] to-[#9ccaf0]",
    cloudy: "bg-gradient-to-b from-[#74859b] to-[#aebbc9]",
    fog: "bg-gradient-to-b from-[#8a96a4] to-[#c3ccd5]",
    drizzle: "bg-gradient-to-b from-[#5d6e84] to-[#91a1b5]",
    rain: "bg-gradient-to-b from-[#4e5d72] to-[#8090a5]",
    snow: "bg-gradient-to-b from-[#8597b0] to-[#c8d4e2]",
    storm: "bg-gradient-to-b from-[#363d4b] to-[#687084]",
  }[sky];
}

// ───────── Data ─────────

const pad = (n: number) => String(n).padStart(2, "0");

function useWeather(s: WeatherSettings) {
  const ready = s.lat != null && s.lng != null && !!s.date;
  const span = s.layout === "days" ? (s.days ?? 7) : 1;
  const key = ready ? `${s.lat},${s.lng},${s.date},${span}` : "";
  const [state, setState] = useState<{ key: string; data: WeatherData | null; done: boolean }>({ key: "", data: null, done: false });
  useEffect(() => {
    if (!key) return;
    let live = true;
    loadWeather(s.lat!, s.lng!, s.date!, addDays(s.date!, span - 1)).then((data) => live && setState({ key, data, done: true }));
    return () => {
      live = false;
    };
    // key captures everything the request depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!ready) return { ready, loading: false, data: null };
  const fresh = state.key === key;
  return { ready, loading: !fresh || !state.done, data: fresh ? state.data : null };
}

// ───────── The widget ─────────

export function WeatherWidget({ settings: s, className }: { settings: WeatherSettings; className?: string }) {
  const unit = s.unit ?? "f";
  const layout = s.layout ?? "moment";
  const { ready, loading, data } = useWeather(s);
  const photo = (s.style ?? "minimal") === "photo";

  const date = s.date ?? "";
  const dayInfo = data?.days.find((d) => d.date === date);
  const hourAt = (h: number) => data?.hours.find((x) => x.time === `${date}T${pad(h)}:00`);
  const hour = s.hour ?? 12;
  const moment = hourAt(hour);

  // Sky for the photo style follows the main condition shown.
  const mainCode = layout === "moment" ? (moment?.code ?? dayInfo?.code) : dayInfo?.code;
  const mainDay = layout === "moment" ? (moment?.isDay ?? true) : true;
  const sky = condition(ready ? mainCode : 0).sky;

  const points = layout === "hourly" ? hourPoints(s) : [];
  const dayCount = s.days ?? 7;
  const twoRows = layout === "days" && dayCount > 7;
  const cols = layout === "hourly" ? points.length : layout === "days" ? (twoRows ? Math.ceil(dayCount / 2) : dayCount) : 1;

  // Size the type to fit the box: [width in em, height in em] of each layout's content.
  const [emW, emH] = layout === "moment" ? [9.8, s.showDetails ? 12 : 10.7] : layout === "hourly" ? [cols * 3.1 + 2, 9] : twoRows ? [cols * 3.3 + 2, 18.8] : [cols * 3.3 + 2, 11];
  const inner: CSSProperties = { fontSize: `clamp(6px, min(calc(100cqw / ${emW}), calc(100cqh / ${emH})), 28px)` };

  const name = s.showLocation !== false ? (s.placeName ?? "Santorini") : "";
  const showDate = s.showDate !== false && !!date;

  let body: React.ReactNode;
  if (!ready) {
    body = <Moment name={name} sub="" temp={s.temp ?? 24} code={0} isDay label={s.showDescription !== false ? (s.label ?? "Sunny skies") : ""} hi={null} lo={null} details={null} />;
  } else if (loading) {
    body = <div className="grid size-full place-items-center text-[0.85em] opacity-60">Loading weather…</div>;
  } else if (!data || data.note === "future" || (!dayInfo && layout !== "days")) {
    body = (
      <div className="flex size-full flex-col items-center justify-center gap-[0.3em] text-center">
        <WxIcon code={3} className="size-[2em] opacity-60" />
        <div className="text-[0.85em] font-medium">{data?.note === "future" ? "Forecast not out yet" : "Weather unavailable"}</div>
        <div className="text-[0.72em] opacity-60">{data?.note === "future" ? "Available ~16 days ahead" : name}</div>
      </div>
    );
  } else if (layout === "moment") {
    const sub = [showDate ? dateLong(date) : "", hourLong(hour)].filter(Boolean).join(" · ");
    body = (
      <Moment
        name={name}
        sub={sub}
        temp={toUnit(moment?.temp, unit)}
        code={moment?.code}
        isDay={moment?.isDay ?? true}
        label={s.showDescription !== false ? condition(moment?.code).label : ""}
        hi={toUnit(dayInfo?.hi, unit)}
        lo={toUnit(dayInfo?.lo, unit)}
        details={s.showDetails ? moment : null}
        unit={unit}
      />
    );
  } else if (layout === "hourly") {
    body = (
      <div className="flex size-full flex-col">
        <Header
          left={name}
          leftSub={showDate ? dateLong(date) : ""}
          right={s.showDescription !== false ? condition(dayInfo?.code).label : ""}
          rightSub={`H:${toUnit(dayInfo?.hi, unit)}° L:${toUnit(dayInfo?.lo, unit)}°`}
        />
        <div className="grid flex-1 items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {points.map((h) => {
            const x = hourAt(h);
            return (
              <div key={h} className="flex flex-col items-center gap-[0.35em]">
                <span className="text-[0.78em] font-medium opacity-75">{hourLabel(h)}</span>
                <WxIcon code={x?.code} isDay={x?.isDay} className="size-[2.2em]" />
                <span className="text-[1em] font-semibold">{x ? `${toUnit(x.temp, unit)}°` : "–"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    const days = Array.from({ length: dayCount }, (_, i) => addDays(date, i)).map((d) => data.days.find((x) => x.date === d) ?? ({ date: d } as WeatherDay));
    const last = addDays(date, dayCount - 1);
    body = (
      <div className="flex size-full flex-col">
        <Header left={name} leftSub={showDate ? `${dateShort(date)} – ${dateShort(last)}` : ""} right={`${dayCount}-day`} rightSub={data.source === "recorded" ? "Recorded" : "Forecast"} />
        <div className={cn("grid flex-1 content-around", twoRows && "gap-y-[0.5em]")} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-[0.25em]">
              <span className="text-[0.78em] leading-none font-semibold">{weekday(d.date)}</span>
              <span className="text-[0.62em] leading-none opacity-60">{dateShort(d.date)}</span>
              <WxIcon code={d.code} className="my-[0.1em] size-[2.2em]" />
              <span className="text-[0.95em] leading-none font-semibold">{d.hi != null ? `${toUnit(d.hi, unit)}°` : "–"}</span>
              <span className="text-[0.78em] leading-none opacity-60">{d.lo != null ? `${toUnit(d.lo, unit)}°` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(className, "relative overflow-hidden [container-type:size]")}>
      {/* Sky layer sits over the card's own background so it always wins. */}
      {photo && <div className={cn("absolute inset-0", skyClass(sky, mainDay))} />}
      <div className={cn("relative size-full p-[0.85em]", photo && "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]")} style={inner}>
        {body}
      </div>
    </div>
  );
}

function hourPoints(s: WeatherSettings) {
  const step = Math.max(1, s.interval ?? 4);
  const out: number[] = [];
  for (let h = s.fromHour ?? 0; h < 24; h += step) out.push(h);
  return out;
}

function Header({ left, leftSub, right, rightSub }: { left: string; leftSub: string; right: string; rightSub: string }) {
  return (
    <div className="mb-[0.45em] flex items-start justify-between gap-[0.6em] border-b border-current/15 pb-[0.4em] leading-tight">
      <div className="min-w-0">
        {left && <div className="truncate text-[0.95em] font-semibold">{left}</div>}
        {leftSub && <div className="truncate text-[0.7em] opacity-70">{leftSub}</div>}
      </div>
      <div className="shrink-0 text-right">
        {right && <div className="text-[0.8em] font-medium">{right}</div>}
        <div className="text-[0.7em] opacity-70">{rightSub}</div>
      </div>
    </div>
  );
}

function Moment({
  name,
  sub,
  temp,
  code,
  isDay,
  label,
  hi,
  lo,
  details,
  unit = "f",
}: {
  name: string;
  sub: string;
  temp: number | null;
  code: number | null | undefined;
  isDay: boolean;
  label: string;
  hi: number | null;
  lo: number | null;
  details: WeatherHour | null | undefined;
  unit?: "f" | "c";
}) {
  return (
    <div className="flex size-full flex-col justify-between leading-tight">
      <div className="min-w-0">
        {name && <div className="truncate text-[1.05em] font-semibold">{name}</div>}
        {sub && <div className="truncate text-[0.72em] opacity-75">{sub}</div>}
      </div>
      <div className="flex items-center justify-between gap-[0.4em]">
        <div className="text-[3.1em] leading-none font-light tracking-tight">{temp != null ? `${temp}°` : "–"}</div>
        <WxIcon code={code} isDay={isDay} className="-my-[0.3em] size-[3.6em]" />
      </div>
      <div className="min-w-0">
        {label && <div className="truncate text-[0.9em] font-medium">{label}</div>}
        {hi != null && lo != null && <div className="text-[0.75em] opacity-75">H:{hi}° L:{lo}°</div>}
        {details && (
          <div className="mt-[0.2em] truncate text-[0.68em] opacity-70">
            Feels {toUnit(details.feels, unit)}° · {details.humidity}% humidity · {windText(details.wind, unit)}
          </div>
        )}
      </div>
    </div>
  );
}
