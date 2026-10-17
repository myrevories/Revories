/** Family-tree emblem from the archive concepts: a round canopy over a trunk with roots. */
export function TreeEmblem({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <g fill="currentColor">
        <circle cx="20" cy="13" r="8.5" />
        <circle cx="11.5" cy="17" r="6.5" />
        <circle cx="28.5" cy="17" r="6.5" />
        <circle cx="15" cy="9.5" r="5.5" />
        <circle cx="25" cy="9.5" r="5.5" />
        <circle cx="20" cy="20" r="6" />
      </g>
      <path d="M20 19v13M20 25l-5-4M20 23l5-4M20 32c-2 1.5-5 2-8 2M20 32c2 1.5 5 2 8 2M20 32v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <g stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".75">
        <path d="M20 20v-8M20 15l-4-3M20 13l4-3M15 19l-3-2M25 19l3-2" />
      </g>
    </svg>
  );
}
