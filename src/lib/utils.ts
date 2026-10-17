import { clsx, type ClassValue } from "clsx";
import type { Asset, DatePrecision, Role } from "@/lib/types";

export const APP_NAME = "Revories";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "May 22, 1992" / "May 1992" / "1992" / "1990s" / "Date unknown" */
export function formatTakenAt(date?: string, precision: DatePrecision = "exact") {
  if (!date || precision === "unknown") return "Date unknown";
  const [y, m, d] = date.split("-").map(Number);
  if (precision === "decade") return `${Math.floor(y / 10) * 10}s`;
  if (precision === "year" || !m) return String(y);
  if (precision === "month" || !d) return `${MONTHS[m - 1]} ${y}`;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatRelative(iso: string, now = Date.now()) {
  const diff = (now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Plain-English role names — no jargon. */
export const ROLE_COPY: Record<Role, { label: string; can: string }> = {
  viewer: { label: "View only", can: "Can look at photos and stories" },
  contributor: { label: "Can upload", can: "Can add photos, but not change others'" },
  organizer: { label: "Can organize", can: "Can upload, tag, date, and sort into albums" },
  editor: { label: "Can edit", can: "Full access, including books and sharing" },
  owner: { label: "Owner", can: "Created this project" },
};

export const STATUS_COPY: Record<Asset["status"], { label: string; dot: string }> = {
  reviewed: { label: "Reviewed", dot: "bg-forest" },
  tagged: { label: "Tagged", dot: "bg-person" },
  needs_details: { label: "Needs details", dot: "bg-warn" },
};

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Parse "May 1992", "1992", "5/22/1992", "May 22, 1992" into a date + precision. */
export function parseLooseDate(input: string): { date: string | null; precision: DatePrecision } {
  const v = input.trim();
  if (!v) return { date: null, precision: "unknown" };
  const year = v.match(/\b(1[89]\d\d|20\d\d)\b/)?.[1];
  if (!year) return { date: null, precision: "unknown" };
  const mIdx = MONTH_NAMES.findIndex((m) => v.toLowerCase().includes(m.slice(0, 3).toLowerCase()));
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\//);
  const month = slash ? Number(slash[1]) : mIdx + 1;
  const day = slash ? Number(slash[2]) : Number(v.match(/\b(\d{1,2}),/)?.[1] ?? 0);
  if (!month) return { date: `${year}-01-01`, precision: "year" };
  const mm = String(month).padStart(2, "0");
  if (!day) return { date: `${year}-${mm}-01`, precision: "month" };
  return { date: `${year}-${mm}-${String(day).padStart(2, "0")}`, precision: "exact" };
}


/** "May 22 – May 25, 1992" */
export function fmtRange(start?: string, end?: string) {
  const f = (d: string, year = true) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
  if (!start) return undefined;
  return end ? `${f(start, false)} – ${f(end)}` : f(start);
}
