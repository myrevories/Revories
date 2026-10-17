// Domain types. These mirror supabase/migrations/*_init.sql (camelCased).

export type Role = "viewer" | "contributor" | "organizer" | "editor" | "owner";
export type AssetKind = "photo" | "video" | "document" | "artifact" | "audio";
export type AssetStatus = "needs_details" | "tagged" | "reviewed";
export type DatePrecision = "exact" | "month" | "year" | "decade" | "unknown";
export type AlbumKind = "manual" | "smart" | "inbox";
export type StoryStep = "plan" | "design" | "review" | "publish";

export interface User {
  id: string;
  name: string;
  /** what family calls them: "Mom", "Uncle Tom" */
  nickname?: string;
  email: string;
  avatarUrl?: string;
}

export type Category = "family" | "travel" | "milestones" | "sports" | "school" | "holidays" | "everyday" | "life_events";

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  category: Category;
  tagline?: string;
  description?: string;
  coverAssetId?: string;
  /** Messages contributors leave for each other on the project */
  notes?: { id: string; userId: string; text: string; createdAt: string }[];
  /** Optional hero copy for the project home page */
  hero?: { eyebrow?: string; title?: string; quote?: string; motto?: string; signature?: string };
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  projectId: string;
  userId: string;
  role: Role;
  /** album-scoped access, when the member was invited to one album only */
  albumId?: string;
}

export interface Album {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  kind: AlbumKind;
  category?: Category;
  rules?: SmartRules;
  coverAssetId?: string;
  createdAt: string;
}

export interface SmartRules {
  year?: number;
  tagId?: string;
  placeId?: string;
  eventId?: string;
  personId?: string;
}

export interface Place {
  id: string;
  projectId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  precision: "exact" | "approximate";
}

export interface Event {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  recurring: boolean;
  parentEventId?: string;
  startDate?: string;
  endDate?: string;
  placeId?: string;
  /** e.g. "Sunny, 82°F" */
  weather?: string;
}

export interface Person {
  id: string;
  projectId: string;
  name: string;
  branch?: string;
  birthYear?: number;
  avatarAssetId?: string;
  avatarUrl?: string;
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
}

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AssetPerson {
  personId: string;
  box?: FaceBox;
  confirmed: boolean;
}

export interface Asset {
  id: string;
  projectId: string;
  uploadedBy?: string;
  contributorName?: string;
  kind: AssetKind;
  url: string;
  thumbUrl: string;
  filename: string;
  width?: number;
  height?: number;
  byteSize?: number;
  /** video/audio length */
  durationSec?: number;
  favorite?: boolean;
  /** quarter turns applied on display */
  rotation?: 0 | 90 | 180 | 270;
  /** soft delete — shown in Trash */
  deletedAt?: string;
  takenAt?: string;
  datePrecision: DatePrecision;
  placeId?: string;
  eventId?: string;
  caption?: string;
  status: AssetStatus;
  people: AssetPerson[];
  tagIds: string[];
  albumIds: string[];
  createdAt: string;
}

export interface UploadLink {
  id: string;
  projectId: string;
  albumId?: string;
  label: string;
  token: string;
  createdAt: string;
  revoked: boolean;
}

export interface Invite {
  id: string;
  projectId: string;
  albumId?: string;
  email: string;
  role: Exclude<Role, "owner">;
  createdAt: string;
}

export interface Story {
  id: string;
  projectId: string;
  albumId?: string;
  title: string;
  subtitle?: string;
  /** Book format & narrative, shown in Book Details */
  details?: { dateLabel?: string; style?: string; size?: string; cover?: string; notes?: string };
  step: StoryStep;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType = "weather" | "map" | "quote" | "stats" | "artifact";

export interface StorySection {
  id: string;
  storyId: string;
  position: number;
  title: string;
  subtitle?: string;
  summary?: string;
  layout: "full_width" | "two_column" | "grid" | "collage";
  widget?: { type: WidgetType; settings: Record<string, unknown> };
  assetIds: string[];
}

/** A batch metadata edit, applied to every selected asset. Undefined = leave as is. */
export interface AssetPatch {
  takenAt?: string | null;
  datePrecision?: DatePrecision;
  placeId?: string | null;
  eventId?: string | null;
  caption?: string | null;
  status?: AssetStatus;
  favorite?: boolean;
  rotation?: 0 | 90 | 180 | 270;
  addPersonIds?: string[];
  removePersonIds?: string[];
  addTagIds?: string[];
  removeTagIds?: string[];
  addAlbumIds?: string[];
  removeAlbumIds?: string[];
}

// ───────── Spread editor ─────────

export type ElementType = "photo" | "heading" | "text" | "quote" | "widget";

/** Positioned element on a two-page spread. Coordinates are % of the spread (0–100). */
export interface SpreadElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  assetId?: string;
  text?: string;
  widget?: { type: WidgetType; settings: Record<string, unknown> };
  style?: { corner?: "default" | "rounded" | "square"; align?: "left" | "center" };
}

export interface Spread {
  id: string;
  sectionId?: string;
  elements: SpreadElement[];
  notes?: string;
}
