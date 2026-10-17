"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, MapPin, MapPinned, Plus, Search } from "lucide-react";
import { createPlaceAction, updatePlaceAction } from "@/app/actions";
import { Button, Chip, Field } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useMeta } from "@/components/meta-context";
import { PlacesMap } from "@/components/places/places-map";
import type { Place } from "@/lib/types";
import { cn, plural } from "@/lib/utils";

export function PlacesView({ counts, selectedId }: { counts: Record<string, number>; selectedId?: string }) {
  const meta = useMeta();
  const router = useRouter();
  const pathname = usePathname();
  const [pinning, setPinning] = useState<string | null>(null);
  const [, start] = useTransition();
  const select = (id?: string) => router.replace(id ? `${pathname}?place=${id}` : pathname, { scroll: false });

  const points = meta.places
    .filter((p): p is Place & { lat: number; lng: number } => p.lat != null && p.lng != null)
    .map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, count: counts[p.id] ?? 0 }));

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="card flex max-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="text-[13.5px] font-semibold">Saved places</div>
          <AddPlaceButton />
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          {meta.places.map((p) => (
            <div
              key={p.id}
              className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5", selectedId === p.id ? "bg-accent-soft" : "hover:bg-sunken")}
            >
              <button type="button" onClick={() => select(selectedId === p.id ? undefined : p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", selectedId === p.id ? "bg-accent text-white" : "bg-place-soft text-place")}>
                  <MapPin className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {p.address ?? "No address"} · {plural(counts[p.id] ?? 0, "photo")}
                  </span>
                </span>
              </button>
              {p.lat == null && (
                <button
                  type="button"
                  onClick={() => setPinning(p.id)}
                  className={cn("shrink-0 rounded-md px-2 py-1 text-[11px] font-medium", pinning === p.id ? "bg-accent text-white" : "text-accent hover:bg-accent-soft")}
                >
                  {pinning === p.id ? "Click the map" : "Set pin"}
                </button>
              )}
            </div>
          ))}
          {!meta.places.length && <p className="p-4 text-center text-[12.5px] text-muted">No places yet. Add one, or tag a location while reviewing photos.</p>}
        </div>
      </div>
      <div className="card relative overflow-hidden">
        <PlacesMap
          points={points}
          selectedId={selectedId}
          onSelect={select}
          onPick={
            pinning
              ? (lat, lng) =>
                  start(async () => {
                    await updatePlaceAction(pinning, { lat, lng, precision: "exact" });
                    setPinning(null);
                    router.refresh();
                  })
              : undefined
          }
          className="h-[520px] w-full"
        />
        {pinning && (
          <div className="absolute top-3 left-1/2 z-[500] -translate-x-1/2">
            <Chip kind="accent" icon={<MapPinned />}>
              Click the map to place “{meta.place(pinning)?.name}”
            </Chip>
          </div>
        )}
      </div>
    </div>
  );
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
}

/** Manual place search (OpenStreetMap Nominatim) with a plain-name fallback. */
export function AddPlaceButton({ label = "Add", className }: { label?: string; className?: string }) {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [picked, setPicked] = useState<GeoResult | null>(null);
  const [name, setName] = useState("");
  const [exact, setExact] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pending, start] = useTransition();

  async function search() {
    if (q.trim().length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`, {
        headers: { "Accept-Language": "en" },
      });
      setResults(await res.json());
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      {className ? (
        <button type="button" onClick={() => setOpen(true)} className={className}>
          <MapPin className="size-4" /> {label}
        </button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> {label}
        </Button>
      )}
      {open && (
        <Modal
          title="Save a place"
          description="Saved places can be tagged in one click — like “Martin Lake House”."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!name.trim() || pending}
                onClick={() =>
                  start(async () => {
                    const p = await createPlaceAction(
                      meta.projectId,
                      name,
                      picked?.display_name.split(",").slice(0, 3).join(",") ?? undefined,
                      picked ? { lat: Number(picked.lat), lng: Number(picked.lon), precision: exact ? "exact" : "approximate" } : undefined,
                    );
                    meta.add("places", p);
                    setOpen(false);
                  })
                }
              >
                Save place
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Find it on the map" hint="Optional">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void search();
                }}
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
                  <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="field pl-9" placeholder="Town, address, or landmark" />
                </div>
                <Button type="submit" disabled={searching}>
                  {searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
                </Button>
              </form>
            </Field>
            {results.length > 0 && (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={`${r.lat},${r.lon}`}
                    type="button"
                    onClick={() => (setPicked(r), !name && setName(r.name || r.display_name.split(",")[0]))}
                    className={cn("flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-[12.5px]", picked === r ? "bg-accent-soft" : "hover:bg-sunken")}
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-place" /> {r.display_name}
                  </button>
                ))}
              </div>
            )}
            <Field label="What do you call it?">
              <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="e.g. Martin Lake House" />
            </Field>
            {picked && (
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <input type="checkbox" className="accent-[var(--color-accent)]" checked={exact} onChange={(e) => setExact(e.target.checked)} />
                This is the exact spot (otherwise we’ll show it as approximate)
              </label>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
