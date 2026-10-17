import { CloudUpload } from "lucide-react";
import type { StatusCounts } from "@/components/assets/asset-filters";
import { plural } from "@/lib/utils";

/** "50 photos · 18 reviewed · 22 tagged · 10 need details" with a segmented bar. */
export function ReviewProgress({ counts }: { counts: StatusCounts }) {
  const pct = (n: number) => (counts.all ? (n / counts.all) * 100 : 0);
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-sunken text-ink-2">
          <CloudUpload className="size-4" />
        </span>
        <div className="text-[14px] font-semibold">{plural(counts.all, "memory", "memories")} in the archive</div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-sunken">
        <span className="bg-forest" style={{ width: `${pct(counts.reviewed)}%` }} />
        <span className="bg-person" style={{ width: `${pct(counts.tagged)}%` }} />
        <span className="bg-warn" style={{ width: `${pct(counts.needs_details)}%` }} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-forest" /> {counts.reviewed} reviewed</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-person" /> {counts.tagged} tagged</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warn" /> {counts.needs_details} need details</span>
      </div>
    </div>
  );
}
