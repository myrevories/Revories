import type { AssetFilter } from "@/lib/data";
import type { Asset, AssetStatus } from "@/lib/types";
import type { StatusCounts } from "@/components/assets/asset-filters";

type SP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** URL search params → repository filter. */
export function filterFromSearch(sp: SP): AssetFilter {
  return {
    status: one(sp.status) as AssetStatus | undefined,
    eventId: one(sp.event),
    placeId: one(sp.place),
    personId: one(sp.person),
    tagId: one(sp.tag),
    year: one(sp.year),
    q: one(sp.q),
  };
}

export function statusCounts(assets: Asset[]): StatusCounts {
  return {
    all: assets.length,
    reviewed: assets.filter((a) => a.status === "reviewed").length,
    tagged: assets.filter((a) => a.status === "tagged").length,
    needs_details: assets.filter((a) => a.status === "needs_details").length,
  };
}

export function yearsOf(assets: Asset[]) {
  return [...new Set(assets.map((a) => a.takenAt?.slice(0, 4)).filter((y): y is string => !!y))].sort();
}
