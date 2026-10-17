import { Camera, Landmark, Quote, Sun } from "lucide-react";
import { MapWidget } from "@/components/studio/map-widget";
import { WeatherWidget } from "@/components/studio/weather-widget";
import type { WeatherSettings } from "@/lib/weather";
import type { MapSettings } from "@/lib/map-widget";
import type { WidgetType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const WIDGET_TYPES: { type: WidgetType; label: string }[] = [
  { type: "weather", label: "Weather" },
  { type: "map", label: "Map / location" },
  { type: "quote", label: "Quote" },
  { type: "stats", label: "Trip stats" },
  { type: "artifact", label: "Artifact / memory" },
];

export type WidgetStyle = "minimal" | "glass" | "bold" | "photo";

export const styleClass: Record<WidgetStyle, string> = {
  minimal: "bg-surface text-ink ring-1 ring-line",
  glass: "bg-white/70 text-ink ring-1 ring-white/80 backdrop-blur",
  bold: "bg-ink text-white",
  photo: "bg-gradient-to-br from-sky-200 to-sky-50 text-ink",
};

/** Small, self-contained page widgets. Used in the storyboard preview, the inspector and on spreads. */
export function WidgetView({
  type,
  settings = {},
  className,
}: {
  type: WidgetType;
  settings?: Record<string, unknown>;
  className?: string;
}) {
  const style = (settings.style as WidgetStyle) ?? "minimal";
  // Maps run edge to edge; their label floats over the map.
  const base = cn("flex size-full flex-col justify-center rounded-xl shadow-sm", type === "map" || type === "weather" ? "p-0" : "p-3", styleClass[style], className);

  switch (type) {
    case "weather":
      return <WeatherWidget settings={settings as WeatherSettings} className={base} />;
    case "map":
      return <MapWidget settings={settings as MapSettings} className={base} />;
    case "quote":
      return (
        <div className={cn(base, "items-center text-center")}>
          <Quote className="mb-1 size-4 opacity-50" />
          <div className="font-serif text-[12px] leading-snug italic">“{String(settings.text ?? "Travel farther. Feel more.")}”</div>
        </div>
      );
    case "stats":
      return (
        <div className={cn(base, "flex-row items-center justify-around")}>
          {[
            [settings.days ?? 6, "Days"],
            [settings.photos ?? 42, "Photos"],
            [settings.places ?? 18, "Places"],
          ].map(([n, l]) => (
            <div key={String(l)} className="text-center">
              <div className="text-[16px] font-semibold">{String(n)}</div>
              <div className="text-[9.5px] opacity-70">{String(l)}</div>
            </div>
          ))}
        </div>
      );
    case "artifact":
      return (
        <div className={cn(base, "flex-row items-center gap-2")}>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <Landmark className="size-4" />
          </span>
          <div>
            <div className="text-[11px] font-semibold">{String(settings.title ?? "Ticket stub")}</div>
            <div className="flex items-center gap-1 text-[10px] opacity-70">
              <Camera className="size-3" /> Scanned item
            </div>
          </div>
        </div>
      );
  }
}

/** Tiny swatch for the style picker. */
export function StyleSwatch({ style }: { style: WidgetStyle }) {
  return (
    <div className={cn("flex size-full items-center justify-center gap-1 rounded-md", styleClass[style])}>
      <Sun className="size-3.5 text-amber-400" />
      <span className="h-1.5 w-5 rounded-full bg-current opacity-40" />
    </div>
  );
}
