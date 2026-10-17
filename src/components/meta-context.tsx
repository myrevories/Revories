"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Album, Event, Person, Place, Tag } from "@/lib/types";

export interface Meta {
  projectId: string;
  people: Person[];
  places: Place[];
  events: Event[];
  tags: Tag[];
  albums: Album[];
}

interface MetaCtx extends Meta {
  add: <K extends "people" | "places" | "events" | "tags" | "albums">(key: K, item: Meta[K][number]) => void;
  person: (id: string) => Person | undefined;
  place: (id?: string) => Place | undefined;
  event: (id?: string) => Event | undefined;
  tag: (id: string) => Tag | undefined;
  album: (id: string) => Album | undefined;
}

const Ctx = createContext<MetaCtx | null>(null);

/** Client-side copy of a project's people/places/events/tags so pickers can
 *  resolve names and show newly created entities without a round-trip. */
export function MetaProvider({ initial, children }: { initial: Meta; children: ReactNode }) {
  const [meta, setMeta] = useState(initial);
  const value = useMemo<MetaCtx>(
    () => ({
      ...meta,
      add: (key, item) => setMeta((m) => ({ ...m, [key]: [...m[key], item] })),
      person: (id) => meta.people.find((p) => p.id === id),
      place: (id) => meta.places.find((p) => p.id === id),
      event: (id) => meta.events.find((e) => e.id === id),
      tag: (id) => meta.tags.find((t) => t.id === id),
      album: (id) => meta.albums.find((a) => a.id === id),
    }),
    [meta],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMeta() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMeta must be used inside <MetaProvider>");
  return v;
}
