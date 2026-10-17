"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { CalendarDays, Check, ChevronDown, Home, MapPin, Pencil, Plus, Search, Sparkles, Tag as TagIcon, User } from "lucide-react";
import { createEventAction, createPersonAction, createPlaceAction, createTagAction } from "@/app/actions";
import { Avatar, Chip } from "@/components/ui";
import { useMeta } from "@/components/meta-context";
import type { DatePrecision } from "@/lib/types";
import { cn, formatTakenAt, parseLooseDate } from "@/lib/utils";

// ───────── Generic searchable popover ─────────

interface Option {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

function useOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [ref, onOutside, active]);
}

export function Combobox({
  options,
  selected,
  onSelect,
  onCreate,
  placeholder,
  createLabel = (q) => `Add “${q}”`,
  trigger,
  multi,
  align = "left",
  defaultOpen = false,
  onClose,
}: {
  options: Option[];
  selected: string[];
  onSelect: (id: string) => void;
  onCreate?: (query: string) => Promise<void> | void;
  placeholder: string;
  createLabel?: (q: string) => string;
  trigger: (open: () => void, isOpen: boolean) => ReactNode;
  multi?: boolean;
  align?: "left" | "right";
  defaultOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpenState] = useState(defaultOpen);
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenState((o) => {
      const next = typeof v === "function" ? v(o) : v;
      if (!next && o) queueMicrotask(() => onClose?.());
      return next;
    });
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  useOutside(ref, () => setOpen(false), open);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())).slice(0, 50);
  const canCreate = !!onCreate && q.trim().length > 1 && !options.some((o) => o.label.toLowerCase() === q.trim().toLowerCase());
  const rows = filtered.length + (canCreate ? 1 : 0);

  function choose(i: number) {
    if (i < filtered.length) {
      onSelect(filtered[i].id);
      if (!multi) setOpen(false);
      setQ("");
    } else if (canCreate) {
      start(async () => {
        await onCreate!(q.trim());
        setQ("");
        if (!multi) setOpen(false);
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((o) => !o), open)}
      {open && (
        <div
          className={cn(
            "animate-rise absolute z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="relative border-b border-line">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              autoFocus
              value={q}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, rows - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  choose(active);
                }
              }}
              placeholder={placeholder}
              className="h-10 w-full bg-transparent pr-3 pl-9 text-[13px] outline-none placeholder:text-faint"
            />
          </div>
          <ul id={listId} role="listbox" className="scroll-thin max-h-64 overflow-y-auto p-1">
            {filtered.map((o, i) => {
              const isSel = selected.includes(o.id);
              return (
                <li key={o.id} role="option" aria-selected={isSel}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                    className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px]", active === i && "bg-sunken")}
                  >
                    {o.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.label}</span>
                      {o.hint && <span className="block truncate text-[11.5px] text-muted">{o.hint}</span>}
                    </span>
                    {isSel && <Check className="size-4 text-accent" />}
                  </button>
                </li>
              );
            })}
            {canCreate && (
              <li>
                <button
                  type="button"
                  disabled={pending}
                  onMouseEnter={() => setActive(filtered.length)}
                  onClick={() => choose(filtered.length)}
                  className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-accent", active === filtered.length && "bg-accent-soft")}
                >
                  <Plus className="size-4" /> {pending ? "Adding…" : createLabel(q.trim())}
                </button>
              </li>
            )}
            {!filtered.length && !canCreate && <li className="px-3 py-6 text-center text-[12.5px] text-muted">Nothing yet — type to add one.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function SelectTrigger({ icon, value, placeholder, onClick }: { icon: ReactNode; value?: string; placeholder: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="field flex items-center gap-2 text-left">
      <span className="text-muted [&>svg]:size-4">{icon}</span>
      <span className={cn("flex-1 truncate", !value && "text-faint")}>{value ?? placeholder}</span>
      <ChevronDown className="size-4 text-faint" />
    </button>
  );
}

// ───────── Entity pickers ─────────

export function PlacePicker({ value, onChange, mixed }: { value?: string; onChange: (id: string | null) => void; mixed?: boolean }) {
  const meta = useMeta();
  const place = meta.place(value);
  return (
    <Combobox
      placeholder="Search saved places…"
      createLabel={(q) => `Save new place “${q}”`}
      options={meta.places.map((p) => ({ id: p.id, label: p.name, hint: p.address, icon: <MapPin className="size-4 text-place" /> }))}
      selected={value ? [value] : []}
      onSelect={(id) => onChange(id === value ? null : id)}
      onCreate={async (q) => {
        const p = await createPlaceAction(meta.projectId, q);
        meta.add("places", p);
        onChange(p.id);
      }}
      trigger={(open) => (
        <SelectTrigger icon={<MapPin />} onClick={open} placeholder={mixed ? "Mixed — leave as is" : "Add a place"} value={place ? `${place.name}${place.address ? ` · ${place.address}` : ""}` : undefined} />
      )}
    />
  );
}

export function EventPicker({ value, onChange, mixed }: { value?: string; onChange: (id: string | null) => void; mixed?: boolean }) {
  const meta = useMeta();
  const ev = meta.event(value);
  return (
    <Combobox
      placeholder="Search events…"
      createLabel={(q) => `Create event “${q}”`}
      options={meta.events.map((e) => ({
        id: e.id,
        label: e.name,
        hint: e.recurring ? "Recurring event" : e.startDate?.slice(0, 4),
        icon: <CalendarDays className="size-4 text-event" />,
      }))}
      selected={value ? [value] : []}
      onSelect={(id) => onChange(id === value ? null : id)}
      onCreate={async (q) => {
        const e = await createEventAction(meta.projectId, q);
        meta.add("events", e);
        onChange(e.id);
      }}
      trigger={(open) => <SelectTrigger icon={<CalendarDays />} onClick={open} placeholder={mixed ? "Mixed — leave as is" : "Choose an event"} value={ev?.name} />}
    />
  );
}

export function PeoplePicker({
  value,
  onAdd,
  onRemove,
  compact,
}: {
  value: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  const meta = useMeta();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!compact &&
        value.map((id) => {
          const p = meta.person(id);
          return p ? (
            <Chip key={id} kind="person" icon={<User />} onRemove={() => onRemove(id)}>
              {p.name}
            </Chip>
          ) : null;
        })}
      <Combobox
        multi
        placeholder="Search family members…"
        createLabel={(q) => `Add “${q}” as a new person`}
        options={meta.people.map((p) => ({ id: p.id, label: p.name, hint: p.branch, icon: <Avatar name={p.name} size={24} /> }))}
        selected={value}
        onSelect={(id) => (value.includes(id) ? onRemove(id) : onAdd(id))}
        onCreate={async (q) => {
          const p = await createPersonAction(meta.projectId, q);
          meta.add("people", p);
          onAdd(p.id);
        }}
        align={compact ? "right" : "left"}
        trigger={(open) =>
          compact ? (
            <button type="button" onClick={open} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12px] font-medium text-ink-2 shadow-[var(--shadow-soft)] hover:text-ink">
              <Pencil className="size-3.5" /> Edit
            </button>
          ) : (
            <button type="button" onClick={open} className="inline-flex h-[26px] items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-[12px] font-medium text-ink-2 hover:border-accent hover:text-accent">
              <Plus className="size-3.5" /> Add person
            </button>
          )
        }
      />
    </div>
  );
}

export function TagPicker({ value, onAdd, onRemove }: { value: string[]; onAdd: (id: string) => void; onRemove: (id: string) => void }) {
  const meta = useMeta();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((id) => {
        const t = meta.tag(id);
        // Rotate pastel families like the concept's tag row.
        const kind = (["person", "tag", "place", "event", "branch"] as const)[Math.max(0, meta.tags.findIndex((x) => x.id === id)) % 5];
        return t ? (
          <Chip key={id} kind={kind} onRemove={() => onRemove(id)}>
            {t.name}
          </Chip>
        ) : null;
      })}
      <Combobox
        multi
        placeholder="Search or create tags…"
        createLabel={(q) => `Create tag “${q}”`}
        options={meta.tags.map((t) => ({ id: t.id, label: t.name, icon: <TagIcon className="size-4 text-tag" /> }))}
        selected={value}
        onSelect={(id) => (value.includes(id) ? onRemove(id) : onAdd(id))}
        onCreate={async (q) => {
          const t = await createTagAction(meta.projectId, q);
          meta.add("tags", t);
          onAdd(t.id);
        }}
        trigger={(open) => (
          <button type="button" onClick={open} className="inline-flex h-[26px] items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 text-[12px] font-medium text-ink-2 hover:border-accent hover:text-accent">
            <Plus className="size-3.5" /> Add tag
          </button>
        )}
      />
    </div>
  );
}

/** Quick one-click chips for saved places/events — "tag in one click". */
export function QuickPicks({
  onPlace,
  onEvent,
}: {
  onPlace: (id: string) => void;
  onEvent: (id: string) => void;
}) {
  const meta = useMeta();
  const events = meta.events.filter((e) => e.recurring).slice(0, 4);
  const places = meta.places.slice(0, 3);
  if (!events.length && !places.length) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1 text-[11.5px] text-muted">
        <Sparkles className="size-3.5" /> Or choose a quick tag
      </div>
      <div className="flex flex-wrap gap-1.5">
        {events.map((e) => (
          <button key={e.id} type="button" onClick={() => onEvent(e.id)}>
            <Chip kind="event" icon={<CalendarDays />} size="sm" className="hover:brightness-95">
              {e.name}
            </Chip>
          </button>
        ))}
        {places.map((p) => (
          <button key={p.id} type="button" onClick={() => onPlace(p.id)}>
            <Chip kind="place" icon={<Home />} size="sm" className="hover:brightness-95">
              {p.name}
            </Chip>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── Date ─────────

/**
 * One friendly text field — "May 1992", "1992", "May 22, 1992" — plus an
 * "Exact date unknown" box, as in the concept forms. Old photos rarely have
 * exact dates, so a year alone is a complete answer.
 */
export function DateInput({
  value,
  precision,
  onChange,
  mixed,
}: {
  value?: string;
  precision: DatePrecision;
  onChange: (date: string | null, precision: DatePrecision) => void;
  mixed?: boolean;
}) {
  const shown = value && precision !== "unknown" ? formatTakenAt(value, precision) : "";
  const [unknown, setUnknown] = useState(false);
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-1">
        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          key={`${value}-${precision}`}
          defaultValue={shown}
          disabled={unknown}
          placeholder={mixed ? "Mixed — type to replace" : "May 1992"}
          className="field pl-9"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v === shown) return;
            const parsed = parseLooseDate(v);
            if (v && !parsed.date) return;
            onChange(parsed.date, parsed.precision);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>
      <label className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-ink-2">
        <input
          type="checkbox"
          className="size-3.5 accent-[var(--color-accent)]"
          checked={unknown}
          onChange={(e) => {
            setUnknown(e.target.checked);
            if (e.target.checked) onChange(null, "unknown");
          }}
        />
        Exact date unknown
      </label>
    </div>
  );
}
