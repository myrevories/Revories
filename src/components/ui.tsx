import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn, initials } from "@/lib/utils";

// ───────── Button ─────────

type Variant = "primary" | "ink" | "secondary" | "ghost" | "accent" | "forest" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Soft violet pill — "Add memories", "Add Photos", "Continue organizing".
  primary: "bg-gradient-to-r from-accent-2 to-accent text-white shadow-[0_6px_18px_rgb(124_92_240/0.3)] hover:brightness-105",
  // Ink black — "Create New Project", "Browse Files", "Continue to Design".
  ink: "bg-ink text-white hover:bg-black shadow-[0_4px_14px_rgb(0_0_0/0.18)]",
  secondary: "bg-white/80 text-ink border border-white/80 backdrop-blur hover:bg-white shadow-[0_2px_10px_rgb(70_55_40/0.06)]",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  accent: "bg-accent-soft text-accent border border-accent-line hover:bg-accent hover:text-white",
  forest: "bg-gradient-to-b from-accent-2 to-accent text-white shadow-[0_2px_6px_rgb(124_92_240/0.3)] hover:brightness-110",
  danger: "text-danger border border-line hover:bg-danger-soft",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[12.5px] gap-1.5 rounded-full",
  md: "h-10 px-4 text-[13px] gap-2 rounded-full",
  lg: "h-11 px-6 text-[14px] gap-2 rounded-full",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition select-none",
    "disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent-soft",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ───────── Chips ─────────

export type ChipKind = "person" | "place" | "event" | "tag" | "year" | "branch" | "neutral" | "accent";

const chipColors: Record<ChipKind, string> = {
  person: "bg-person-soft text-person",
  place: "bg-place-soft text-place",
  event: "bg-event-soft text-event",
  tag: "bg-tag-soft text-tag",
  year: "bg-year-soft text-year",
  branch: "bg-branch-soft text-branch",
  neutral: "bg-sunken text-ink-2",
  accent: "bg-accent-soft text-accent",
};

export function Chip({
  kind = "neutral",
  icon,
  children,
  onRemove,
  className,
  size = "md",
}: {
  kind?: ChipKind;
  icon?: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full font-medium",
        size === "sm" ? "h-[22px] px-2 text-[11px]" : "h-[26px] px-2.5 text-[12px]",
        chipColors[kind],
        className,
      )}
    >
      {icon && <span className="-ml-0.5 flex shrink-0 [&>svg]:size-3.5">{icon}</span>}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="-mr-1 ml-0.5 grid size-4 place-items-center rounded-full opacity-60 hover:bg-black/5 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}

/** Toggleable filter pill, e.g. "All (50)" / "Needs details (10)" */
export function FilterPill({
  active,
  children,
  href,
  dot,
}: {
  active?: boolean;
  children: ReactNode;
  href: string;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition",
        active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-line-strong",
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {children}
    </Link>
  );
}

// ───────── Avatar ─────────

const avatarTints = ["bg-person-soft text-person", "bg-place-soft text-place", "bg-event-soft text-event", "bg-tag-soft text-tag", "bg-branch-soft text-branch"];

export function Avatar({ name, src, size = 32, ring }: { name: string; src?: string; size?: number; ring?: boolean }) {
  const tint = avatarTints[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTints.length];
  return (
    <span
      title={name}
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold", tint, ring && "ring-2 ring-surface")}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  );
}

export function AvatarStack({ people, max = 5, size = 28 }: { people: { name: string; src?: string }[]; max?: number; size?: number }) {
  const extra = people.length - max;
  return (
    <span className="flex -space-x-2">
      {people.slice(0, max).map((p, i) => (
        <Avatar key={i} name={p.name} src={p.src} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="inline-grid place-items-center rounded-full bg-sunken text-[11px] font-semibold text-ink-2 ring-2 ring-surface"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

// ───────── Layout bits ─────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="font-serif text-[38px] leading-[1.05] font-medium tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14.5px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-serif text-[22px] leading-tight font-medium text-ink">{title}</h2>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Every empty page explains what it is and offers exactly one next action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent [&>svg]:size-5">{icon}</div>
      <h3 className="font-serif text-[24px] font-medium">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {icon && <div className="grid size-9 place-items-center rounded-xl bg-sunken text-ink-2 [&>svg]:size-4">{icon}</div>}
      <div>
        <div className="text-[18px] font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-[12px] text-muted">{label}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label mb-1.5 flex items-center justify-between">
        {label}
        {hint && <span className="font-normal text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Top progress steps, as in the Storyboard / Spread Editor concepts. */
export function Stepper({ steps, current }: { steps: { title: string; hint?: string }[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.title} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-6 bg-line-strong sm:w-10" />}
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full text-[11px] font-semibold",
                active ? "bg-accent text-white" : done ? "bg-accent-soft text-accent" : "bg-sunken text-muted",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className="hidden leading-tight md:block">
              <span className={cn("block text-[12px] font-semibold", active ? "text-ink" : "text-muted")}>{s.title}</span>
              {s.hint && <span className="block text-[10.5px] text-faint">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-sunken", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}
