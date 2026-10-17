/** The sunlit terrace behind every signed-in page; panels float over it as glass. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-canvas">
      <img src="/backgrounds/terrace.webp" alt="" className="size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/30 to-white/50" />
      <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-white/65 to-transparent" />
    </div>
  );
}
