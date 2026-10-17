import Link from "next/link";
import { ArrowRight, FolderHeart, MapPin, ScanFace, Share2, Sparkles, Users } from "lucide-react";
import { APP_NAME } from "@/lib/utils";
import { HeroMobile, HeroStage } from "./hero";

// Below-the-fold sections reuse the hero's language: Playfair display type,
// Figtree UI type, warm stone palette, frosted cards, letter-spaced captions.
const STONE = "#efebe5";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-ui text-[10px] tracking-[0.45em] text-[#1f1d1a]/60 uppercase">{children}</p>;
}

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-white/80 bg-white/55 shadow-[0_10px_40px_rgba(60,50,40,0.08)] backdrop-blur-md ${className}`}>{children}</div>;
}

export default function HomePage() {
  return (
    <div className="font-ui text-[#1f1d1a]" style={{ background: STONE }}>
      <HeroStage />
      <HeroMobile />

      <section id="about" className="relative px-6 py-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid items-end gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <Eyebrow>Archive first</Eyebrow>
              <h2 className="font-display mt-5 text-[46px] leading-[1.02] tracking-[-0.02em] sm:text-[64px]">
                A home for memories, <em>not just</em> a folder of files.
              </h2>
            </div>
            <p className="max-w-md text-[16px] leading-relaxed text-[#1f1d1a]/70">
              Keep every photo, scan, ticket and story in one calm place. Organize by people, places and events — and only when you’re ready, turn them into a
              book worth keeping.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", icon: <FolderHeart />, title: "Projects & albums", body: "One umbrella for a family or a trip, with albums for every reunion, season and branch." },
              { n: "02", icon: <ScanFace />, title: "People, places, events", body: "Tag faces, pin the lake house, mark Memorial Day — once, then reuse it in a click." },
              { n: "03", icon: <Sparkles />, title: "Organize in batches", body: "Select fifty photos and give them a date and a place at once. Suggestions do the rest." },
            ].map((p) => (
              <Glass key={p.n} className="p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full border border-[#1f1d1a]/10 bg-white/70 [&>svg]:size-[18px]">{p.icon}</span>
                  <span className="text-[11px] tracking-[0.3em] text-[#1f1d1a]/45">{p.n}</span>
                </div>
                <h3 className="font-display mt-8 text-[26px] leading-tight">{p.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#1f1d1a]/65">{p.body}</p>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-28" style={{ background: "#e7e2da" }}>
        <div className="mx-auto grid max-w-[1180px] items-center gap-16 md:grid-cols-2">
          <div className="relative h-[420px]">
            <div className="absolute inset-y-0 left-0 w-[78%] overflow-hidden rounded-t-[200px] rounded-b-[22px] shadow-[0_30px_60px_rgba(60,50,40,0.18)]">
              <img src="/home/hero.jpg" alt="" className="size-full object-cover object-[68%_40%]" />
            </div>
            <Glass className="absolute right-0 bottom-8 w-[250px] p-5">
              <p className="text-[13px] text-[#1f1d1a]/80">Shared with</p>
              <div className="mt-3 flex -space-x-2">
                {["SM", "MR", "JS", "DM"].map((i, k) => (
                  <span key={i} className="grid size-9 place-items-center rounded-full border-2 border-white text-[11px] font-semibold" style={{ background: ["#e9f0fc", "#f2ebfb", "#fcf1df", "#e6f4ec"][k] }}>
                    {i}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#1f1d1a]/60">Can upload · Can organize · View only</p>
            </Glass>
          </div>
          <div>
            <Eyebrow>Bring everyone in</Eyebrow>
            <h2 className="font-display mt-5 text-[44px] leading-[1.05] tracking-[-0.02em] sm:text-[54px]">
              Sharing, in <em>plain English.</em>
            </h2>
            <ul className="mt-8 space-y-5 text-[15px] text-[#1f1d1a]/75">
              <li className="flex gap-4">
                <Users className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} /> Invite to a whole project, or just one album.
              </li>
              <li className="flex gap-4">
                <Share2 className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} /> “Can upload”, “Can organize”, “Can edit”, “View only” — no jargon.
              </li>
              <li className="flex gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} /> Upload links for relatives who just want to send photos. No account needed.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-32 text-center">
        <Eyebrow>Scroll to enter the memory</Eyebrow>
        <h2 className="font-display mx-auto mt-6 max-w-3xl text-[48px] leading-[1.02] tracking-[-0.02em] sm:text-[72px]">
          Real places <em>last longer.</em>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-[#1f1d1a]/65">
          Turn any album or trip into a storyboard, then into spreads with maps, quotes, and the little artifacts that make a story yours.
        </p>
        <Link href="/dashboard" className="mt-10 inline-flex h-12 items-center gap-4 rounded-full bg-[#1f1d1a] px-8 text-[15px] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] hover:bg-black">
          Start Your Book <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-[#1f1d1a]/10 px-6 py-10 text-[11px] tracking-[0.3em] text-[#1f1d1a]/55 uppercase">
        <span className="font-display text-[15px] tracking-[0.3em] text-[#1f1d1a]">{APP_NAME}</span>
        <span>More than travel · A richer you</span>
      </footer>
    </div>
  );
}
