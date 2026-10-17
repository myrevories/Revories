import type { CSSProperties } from "react";
import { coverOf, sizeOf, styleOf } from "@/lib/book-options";
import { cn } from "@/lib/utils";

const LINEN =
  "repeating-linear-gradient(0deg, rgb(255 255 255/0.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgb(0 0 0/0.07) 0 1px, transparent 1px 3px)";
const PAGES = "repeating-linear-gradient(90deg, #f6f2ea 0 1px, #e4ddd1 1px 2px)";

/**
 * A 3D book seen slightly from the spine side. Thickness and finish follow the
 * cover type (softcover, hardcover, layflat, linen); the front design follows
 * the style; proportions follow the trim size.
 */
export function BookCover3D({
  title,
  subtitle,
  date,
  photo,
  cover,
  style,
  size,
  maxSide = 250,
  relative = false,
  className,
}: {
  title: string;
  subtitle?: string;
  date?: string;
  photo?: string;
  cover?: string;
  style?: string;
  size?: string;
  /** Pixel length of the longest side. */
  maxSide?: number;
  /** Scale by real inches (12 in = maxSide) so sizes compare against each other. */
  relative?: boolean;
  className?: string;
}) {
  const c = coverOf(cover);
  const st = styleOf(style);
  const sz = sizeOf(size);
  const px = maxSide / (relative ? 12 : Math.max(sz.w, sz.h));
  const W = Math.round(sz.w * px);
  const H = Math.round(sz.h * px);
  const T = Math.max(4, Math.round(c.thickness * (relative ? Math.max(sz.w, sz.h) / 12 : 1) * (maxSide / 250)));
  const hard = c.id !== "softcover";
  const face: CSSProperties = { position: "absolute", left: 0, top: 0, backfaceVisibility: "hidden" };

  return (
    <div className={cn("group relative mx-auto grid place-items-center", className)} style={{ width: W + T * 2 + 40, height: H + 50, perspective: 1600 }}>
      <div className="absolute bottom-3 left-1/2 h-6 -translate-x-1/2 rounded-[50%] bg-black/35 blur-xl" style={{ width: W * 0.95 }} />
      <div
        className="relative transition-transform duration-500 ease-out [transform:rotateY(32deg)_rotateX(4deg)] group-hover:[transform:rotateY(18deg)_rotateX(2deg)]"
        style={{ width: W, height: H, transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div style={{ ...face, width: W, height: H, fontSize: W * 0.064, transform: `translateZ(${T / 2}px)` }} className={cn("overflow-hidden", hard ? "rounded-r-[3px]" : "rounded-r-[1px]")}>
          <FrontDesign cover={c.id} style={st} title={title} subtitle={subtitle} date={date} photo={photo} />
          {c.id !== "linen" && <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(115deg, rgb(255 255 255/${hard ? 0.22 : 0.32}) 0%, transparent 32%, transparent 72%, rgb(255 255 255/0.08) 100%)` }} />}
          {hard && <div className="pointer-events-none absolute inset-y-0 left-[6%] w-[3px] bg-gradient-to-r from-black/25 via-white/15 to-black/10" />}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[8%] bg-gradient-to-r from-black/30 to-transparent" />
        </div>
        {/* Back */}
        <div style={{ ...face, width: W, height: H, background: c.id === "linen" ? st.cloth : st.paper, transform: `rotateY(180deg) translateZ(${T / 2}px)` }} />
        {/* Spine */}
        <div
          style={{
            ...face,
            width: T,
            height: H,
            left: (W - T) / 2,
            transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
            backgroundColor: c.id === "softcover" && st.id === "Minimal" ? "#e8e2d8" : st.cloth,
            backgroundImage: `linear-gradient(90deg, rgb(0 0 0/0.35), rgb(255 255 255/0.14) 45%, rgb(0 0 0/0.3))${c.id === "linen" ? `, ${LINEN}` : ""}`,
          }}
          className="grid place-items-center overflow-hidden"
        >
          {T >= 12 && (
            <span
              className={cn("truncate font-display tracking-[0.18em] uppercase", c.id === "linen" ? "text-[#d9bd78]" : st.id === "Minimal" ? "text-ink/70" : "text-white/85")}
              style={{ writingMode: "vertical-rl", fontSize: Math.min(10, T * 0.5), maxHeight: H * 0.8 }}
            >
              {title}
            </span>
          )}
        </div>
        {/* Page edges */}
        <div style={{ ...face, width: T - 2, height: H - (hard ? 6 : 0), top: hard ? 3 : 0, left: (W - T) / 2 + 1, background: PAGES, transform: `rotateY(90deg) translateZ(${W / 2 - (hard ? 3 : 0)}px)` }} />
        <div style={{ ...face, width: W - (hard ? 6 : 0), height: T - 2, left: 0, top: (H - T) / 2 + 1, background: PAGES, transform: `rotateX(90deg) translateZ(${H / 2 - (hard ? 2 : 0)}px)` }} />
      </div>
    </div>
  );
}

function FrontDesign({
  cover,
  style,
  title,
  subtitle,
  date,
  photo,
}: {
  cover: string;
  style: ReturnType<typeof styleOf>;
  title: string;
  subtitle?: string;
  date?: string;
  photo?: string;
}) {
  const img = (cls: string) => (photo ? <img src={photo} alt="" className={cn("object-cover", cls)} /> : <div className={cn("bg-gradient-to-br from-[#9fb4c7] to-[#5d7a8f]", cls)} />);
  const meta = [subtitle, date].filter(Boolean).join(" · ");

  if (cover === "linen") {
    const foil = style.id === "Minimal" ? "#8a6a2c" : "#d9bd78";
    return (
      <div className="absolute inset-0 flex flex-col items-center px-[10%] pt-[11%] text-center" style={{ backgroundColor: style.cloth, backgroundImage: LINEN }}>
        <div className="font-display text-[1.6em] leading-[1.05] tracking-[0.14em] uppercase" style={{ color: foil, textShadow: "0 1px 0 rgb(0 0 0/0.25)" }}>
          {title}
        </div>
        {meta && (
          <div className="mt-1.5 text-[0.5em] tracking-[0.3em] uppercase" style={{ color: foil }}>
            {meta}
          </div>
        )}
        <div className="mt-auto mb-[12%] aspect-[4/3] w-[62%] rounded-[2px] p-[3px] shadow-[inset_0_2px_5px_rgb(0_0_0/0.55)]" style={{ background: "rgb(0 0 0/0.18)" }}>
          {img("size-full rounded-[1px]")}
        </div>
      </div>
    );
  }

  switch (style.id) {
    case "Heritage":
      return (
        <div className="absolute inset-0" style={{ background: style.paper }}>
          {img("absolute inset-x-0 bottom-0 h-[62%] w-full")}
          <div className="absolute inset-x-0 top-0 h-[48%]" style={{ background: `linear-gradient(to bottom, ${style.paper} 70%, transparent)` }} />
          <div className="relative px-[11%] pt-[10%]" style={{ color: style.ink }}>
            <div className="text-[0.5em] tracking-[0.32em] uppercase">Our</div>
            <div className="font-display text-[1.7em] leading-[1.02] tracking-[0.08em] uppercase">{title}</div>
            {meta && <div className="mt-1.5 text-[0.47em] tracking-[0.3em] uppercase">{meta}</div>}
          </div>
        </div>
      );
    case "Minimal":
      return (
        <div className="absolute inset-0 flex flex-col items-center pt-[13%]" style={{ background: style.paper }}>
          {img("aspect-[4/3] w-[58%] shadow-[0_2px_8px_rgb(0_0_0/0.12)]")}
          <div className="mt-[9%] text-[0.72em] font-medium tracking-[0.28em] uppercase" style={{ color: style.ink }}>
            {title}
          </div>
          {meta && <div className="mt-1 text-[0.47em] tracking-[0.22em] text-ink-2 uppercase">{meta}</div>}
        </div>
      );
    case "Travel Journal":
      return (
        <div className="absolute inset-0">
          {img("absolute inset-0 size-full")}
          <div className="absolute bottom-[12%] left-1/2 w-[70%] -translate-x-1/2 -rotate-[3deg] bg-[#dcc7a2] px-3 py-2 text-center shadow-[0_3px_8px_rgb(0_0_0/0.3)]" style={{ color: style.ink }}>
            <span className="absolute -top-2 left-3 h-3.5 w-9 rotate-[-8deg] bg-white/60" />
            <span className="absolute -top-2 right-3 h-3.5 w-9 rotate-[10deg] bg-white/60" />
            <div className="font-script text-[1.9em] leading-none">{title}</div>
            {meta && <div className="mt-1 text-[0.47em] tracking-[0.24em] uppercase">{meta}</div>}
          </div>
        </div>
      );
    default:
      return (
        <div className="absolute inset-0">
          {img("absolute inset-0 size-full")}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
          <div className="absolute inset-x-[9%] bottom-[9%] text-white">
            <div className="font-display text-[1.9em] leading-[1.02]">{title}</div>
            {meta && <div className="mt-1 text-[0.5em] tracking-[0.26em] uppercase opacity-90">{meta}</div>}
          </div>
        </div>
      );
  }
}
