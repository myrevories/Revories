import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ChevronRight, Play } from "lucide-react";
import { APP_NAME } from "@/lib/utils";

// The hero is a fixed composition: the scene artwork (book, artifacts,
// terrace) is a single image, and every piece of text and UI is live HTML
// placed in the artwork's own pixel coordinates (1526 × 854). Positions are
// converted to % and font sizes to container-query units so the whole stage
// scales as one.
const W = 1526;
const H = 854;
const x = (px: number) => `${(px / W) * 100}%`;
const y = (px: number) => `${(px / H) * 100}%`;
const s = (px: number) => `${(px / W) * 100}cqw`;

function At({ l, t, r, style, className, children }: { l?: number; t: number; r?: number; style?: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`absolute ${className ?? ""}`} style={{ left: l !== undefined ? x(l) : undefined, right: r !== undefined ? x(W - r) : undefined, top: y(t), ...style }}>
      {children}
    </div>
  );
}

const NAV = [
  { label: "Home", href: "/", cx: 531 },
  { label: "Explore", href: "/projects", cx: 616 },
  { label: "Books", href: "/stories", cx: 702 },
  { label: "Create", href: "/projects/new", cx: 784 },
  { label: "Stories", href: "/stories", cx: 868 },
  { label: "About", href: "#about", cx: 955 },
];

export function HeroStage() {
  const ink = "#1f1d1a";
  return (
    <section className="relative hidden w-full overflow-hidden md:block" style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size", color: ink }}>
      <img src="/home/hero.jpg" alt="An open travel book titled Australia 2025, surrounded by a boarding pass, a polaroid, coral, and a postage stamp, floating on a sunlit terrace" className="absolute inset-0 size-full object-cover" />

      {/* Logo */}
      <At l={89} t={19}>
        <Link href="/" className="font-display block leading-none uppercase" style={{ fontSize: s(24.5), letterSpacing: "0.28em" }}>
          {APP_NAME}
        </Link>
      </At>

      {/* Nav */}
      {NAV.map((n, i) => (
        <At key={n.label} l={n.cx} t={23} style={{ transform: "translateX(-50%)" }}>
          <Link href={n.href} className="font-ui block leading-none whitespace-nowrap transition-opacity hover:opacity-100" style={{ fontSize: s(14), opacity: i === 0 ? 1 : 0.72 }}>
            {n.label}
          </Link>
          {i === 0 && <span className="mx-auto mt-[0.5cqw] block rounded-full bg-current" style={{ width: s(4), height: s(4) }} />}
        </At>
      ))}

      <At l={1250} t={12}>
        <Link
          href="/dashboard"
          className="font-ui flex items-center justify-center rounded-full bg-[#1f1d1a] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition hover:bg-black"
          style={{ width: s(188), height: s(41), fontSize: s(15.5), gap: s(14) }}
        >
          Start Your Book <ArrowRight style={{ width: s(16), height: s(16) }} />
        </Link>
      </At>

      {/* Headline block */}
      <At l={48} t={147}>
        <p className="font-ui uppercase" style={{ fontSize: s(9.5), letterSpacing: "0.5em", opacity: 0.75 }}>
          Places become part of you
        </p>
      </At>
      <At l={48} t={151}>
        <h1 className="font-display leading-none font-normal" style={{ fontSize: s(164), fontStretch: "62.5%", letterSpacing: "-0.055em" }}>
          {APP_NAME.toUpperCase()}
        </h1>
      </At>
      <At l={53} t={316}>
        <p className="leading-none" style={{ fontFamily: "var(--font-playfair), serif", fontSize: s(52), letterSpacing: "-0.015em" }}>
          Travel, lived <em className="italic">again</em>.
        </p>
      </At>
      <At l={55} t={394}>
        <p className="font-ui" style={{ fontSize: s(14.6), lineHeight: s(21), opacity: 0.78, width: s(360) }}>
          Transform your trips into collectible books
          <br />
          of photos, maps, artifacts, and memory telemetry.
          <br />
          Because the most beautiful places deserve
          <br />a longer tomorrow.
        </p>
      </At>
      <At l={58} t={499}>
        <Link
          href="/dashboard"
          className="font-ui flex items-center justify-center rounded-full bg-[#1f1d1a] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition hover:bg-black"
          style={{ width: s(182), height: s(43), fontSize: s(15), gap: s(16) }}
        >
          Start Your Book <ArrowRight style={{ width: s(16), height: s(16) }} />
        </Link>
      </At>
      <At l={267} t={501}>
        <Link href="/projects" className="font-ui group flex items-center" style={{ gap: s(12), fontSize: s(12) }}>
          <span className="grid place-items-center rounded-full border border-black/10 bg-white/30 backdrop-blur-sm transition group-hover:bg-white/60" style={{ width: s(38), height: s(38) }}>
            <Play className="fill-current" style={{ width: s(11), height: s(11) }} />
          </span>
          <span style={{ opacity: 0.65 }}>Watch the story</span>
        </Link>
      </At>

      {/* Current volume card (artwork provides the glass + thumbnail) */}
      <Link href="/stories" aria-label="Open current volume: Australia 2025" className="absolute" style={{ left: x(840), top: y(80), width: x(320), height: y(94) }}>
        <span className="font-ui absolute block uppercase" style={{ left: s(105), top: s(16), fontSize: s(8.5), letterSpacing: "0.3em", opacity: 0.6 }}>
          Current volume
        </span>
        <span className="font-display absolute block leading-none whitespace-nowrap" style={{ left: s(105), top: s(36), fontSize: s(20), fontFamily: "var(--font-playfair), serif", fontVariantNumeric: "lining-nums" }}>
          Australia 2025
        </span>
        <span className="font-ui absolute block whitespace-nowrap" style={{ left: s(105), top: s(65), fontSize: s(10), opacity: 0.6, wordSpacing: "0.1em" }}>
          127 photos &nbsp;·&nbsp; 5 locations &nbsp;·&nbsp; 12 artifacts
        </span>
      </Link>

      {/* Memory telemetry card */}
      <div className="font-ui absolute" style={{ left: x(419), top: y(610), width: x(197), height: y(160), fontSize: s(11.3) }}>
        <span className="absolute whitespace-nowrap" style={{ left: s(18), top: s(13), opacity: 0.85 }}>
          Memory telemetry
        </span>
        {["12,493 steps", "286 km explored", "A little more you"].map((t, i) => (
          <span key={t} className="absolute whitespace-nowrap" style={{ left: s(58), top: s(77 + i * 24), opacity: 0.8 }}>
            {t}
          </span>
        ))}
      </div>

      {/* Artifacts card */}
      <Link href="/stories" className="font-ui absolute" style={{ left: x(1230), top: y(640), width: x(240), height: y(120) }} aria-label="Artifacts included">
        <span className="absolute whitespace-nowrap" style={{ left: s(17), top: s(13), fontSize: s(11.5), opacity: 0.85 }}>
          Artifacts included
        </span>
        <span className="absolute whitespace-nowrap" style={{ left: s(18), top: s(91), fontSize: s(10.2), opacity: 0.7 }}>
          Photos, tickets, natural finds, and more.
        </span>
      </Link>

      {/* Pager */}
      <div className="font-ui absolute flex flex-col items-center" style={{ left: x(1478), top: y(256), fontSize: s(11), width: s(20) }}>
        <span>01</span>
        <span className="bg-current" style={{ width: s(14), height: s(1), marginTop: s(5) }} />
        <span className="bg-current opacity-40" style={{ width: s(1), height: s(30), marginTop: s(12) }} />
        {["02", "03", "04"].map((n, i) => (
          <span key={n} style={{ marginTop: s(i === 0 ? 21 : 35.5), opacity: 0.5 }}>
            {n}
          </span>
        ))}
      </div>

      {/* Scroll cue */}
      <a href="#about" className="font-ui absolute flex flex-col items-center" style={{ left: x(762), top: y(756), transform: "translateX(-50%)", fontSize: s(12.5) }}>
        <span className="relative rounded-full border border-current opacity-60" style={{ width: s(19), height: s(29), borderWidth: s(1.3) }}>
          <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-current" style={{ top: s(6), width: s(2), height: s(5) }} />
        </span>
        <span className="whitespace-nowrap" style={{ marginTop: s(13), opacity: 0.7 }}>
          Scroll to enter the memory
        </span>
        <span className="bg-current opacity-40" style={{ width: s(1), height: s(16), marginTop: s(8) }} />
      </a>

      {/* Corner captions */}
      <At l={44} t={800}>
        <div className="font-ui uppercase" style={{ fontSize: s(8.5), letterSpacing: "0.38em", lineHeight: s(13), opacity: 0.7 }}>
          <div>More</div>
          <div className="flex items-center" style={{ gap: s(14) }}>
            Than travel <span className="bg-current opacity-60" style={{ width: s(26), height: s(1) }} />
          </div>
          <div>A richer you</div>
        </div>
      </At>
      <At r={1486} t={812}>
        <div className="font-ui flex items-start text-right text-white uppercase" style={{ fontSize: s(8.5), letterSpacing: "0.38em", lineHeight: s(13), gap: s(18), opacity: 0.85 }}>
          <span className="bg-current opacity-70" style={{ width: s(26), height: s(1), marginTop: s(6) }} />
          <span>
            Real places
            <br />
            last longer
          </span>
        </div>
      </At>
    </section>
  );
}

/** Small screens: the same content stacked, with the artwork cropped to the book. */
export function HeroMobile() {
  return (
    <section className="md:hidden">
      <header className="flex h-16 items-center justify-between px-5">
        <Link href="/" className="font-display text-[19px] tracking-[0.3em] uppercase">
          {APP_NAME}
        </Link>
        <Link href="/dashboard" className="font-ui flex h-9 items-center gap-1.5 rounded-full bg-[#1f1d1a] px-4 text-[13px] text-white">
          Start <ArrowRight className="size-3.5" />
        </Link>
      </header>
      <div className="px-5 pt-6">
        <p className="font-ui text-[9.5px] tracking-[0.42em] uppercase opacity-75">Places become part of you</p>
        <h1 className="font-display mt-3 text-[24vw] leading-[0.9] tracking-[-0.01em]" style={{ fontStretch: "70%" }}>{APP_NAME.toUpperCase()}</h1>
        <p className="font-display mt-3 text-[34px] leading-none">
          Travel, lived <em>again</em>.
        </p>
        <p className="font-ui mt-5 text-[15px] leading-relaxed opacity-80">
          Transform your trips into collectible books of photos, maps, artifacts, and memory telemetry. Because the most beautiful places deserve a longer tomorrow.
        </p>
        <div className="mt-6 flex items-center gap-5">
          <Link href="/dashboard" className="font-ui flex h-11 items-center gap-3 rounded-full bg-[#1f1d1a] px-6 text-[14px] text-white">
            Start Your Book <ArrowRight className="size-4" />
          </Link>
          <Link href="/projects" className="font-ui flex items-center gap-2 text-[13px] opacity-70">
            <span className="grid size-9 place-items-center rounded-full border border-black/10">
              <Play className="size-3 fill-current" />
            </span>
            Watch the story
          </Link>
        </div>
      </div>
      <div className="mt-8 aspect-[4/3] overflow-hidden">
        <img src="/home/hero.jpg" alt="" className="size-full object-cover object-[72%_50%]" />
      </div>
      <Link href="/stories" className="font-ui mx-5 -mt-10 flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur">
        <img src="/home/hero.jpg" alt="" className="size-14 rounded-xl object-cover object-[58%_32%]" />
        <span className="flex-1">
          <span className="block text-[9px] tracking-[0.3em] uppercase opacity-60">Current volume</span>
          <span className="font-display block text-[20px]">Australia 2025</span>
          <span className="block text-[11px] opacity-60">127 photos · 5 locations · 12 artifacts</span>
        </span>
        <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}
