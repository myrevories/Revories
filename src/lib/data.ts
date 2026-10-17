import "server-only";
import { connection } from "next/server";
import { createSeed, DEMO_USER_ID, type Store } from "@/lib/demo/seed";
import type {
  Album,
  Asset,
  AssetPatch,
  AssetStatus,
  Invite,
  Member,
  Person,
  Place,
  Project,
  Role,
  Spread,
  SpreadElement,
  Story,
  StorySection,
  Tag,
  UploadLink,
  User,
  Event,
} from "@/lib/types";

// Data access for the app. Today this is backed by an in-memory demo store so
// every screen works without credentials; once Supabase is configured these
// functions get a Supabase-backed implementation with the same signatures.

const g = globalThis as unknown as { __revories?: Store };
function db(): Store {
  return (g.__revories ??= createSeed());
}

/** Everything not in the trash. */
function live() {
  return db().assets.filter((a) => !a.deletedAt);
}

function yearSpan(items: Asset[]) {
  const ys = items.map((a) => a.takenAt?.slice(0, 4)).filter((y): y is string => !!y).sort();
  return ys.length ? (ys[0] === ys.at(-1) ? ys[0] : `${ys[0]} – ${ys.at(-1)}`) : undefined;
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const now = () => new Date().toISOString();

// ───────── Reads ─────────

export async function getCurrentUser(): Promise<User> {
  await connection();
  return db().users.find((u) => u.id === DEMO_USER_ID)!;
}

export async function getUser(id: string) {
  return db().users.find((u) => u.id === id);
}

export interface ProjectSummary extends Project {
  role: Role;
  cover?: Asset;
  years?: string;
  counts: { assets: number; photos: number; videos: number; albums: number; people: number; places: number; stories: number; needsReview: number; contributors: number };
}

function summarize(p: Project, userId: string): ProjectSummary {
  const s = db();
  const assets = live().filter((a) => a.projectId === p.id);
  return {
    ...p,
    role: s.members.find((m) => m.projectId === p.id && m.userId === userId)?.role ?? "viewer",
    cover: assets.find((a) => a.id === p.coverAssetId) ?? assets[0],
    years: yearSpan(assets),
    counts: {
      assets: assets.length,
      photos: assets.filter((a) => a.kind === "photo").length,
      videos: assets.filter((a) => a.kind === "video").length,
      albums: s.albums.filter((a) => a.projectId === p.id && a.kind !== "inbox").length,
      people: s.people.filter((x) => x.projectId === p.id).length,
      places: s.places.filter((x) => x.projectId === p.id).length,
      stories: s.stories.filter((x) => x.projectId === p.id).length,
      needsReview: assets.filter((a) => a.status === "needs_details").length,
      contributors: s.members.filter((m) => m.projectId === p.id).length,
    },
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const user = await getCurrentUser();
  const s = db();
  const mine = new Set(s.members.filter((m) => m.userId === user.id).map((m) => m.projectId));
  return s.projects
    .filter((p) => mine.has(p.id))
    .map((p) => summarize(p, user.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<ProjectSummary | null> {
  const user = await getCurrentUser();
  const p = db().projects.find((x) => x.id === id);
  return p ? summarize(p, user.id) : null;
}

function matchesSmart(album: Album, a: Asset) {
  const r = album.rules ?? {};
  if (r.year && !a.takenAt?.startsWith(String(r.year))) return false;
  if (r.placeId && a.placeId !== r.placeId) return false;
  if (r.eventId && a.eventId !== r.eventId) return false;
  if (r.tagId && !a.tagIds.includes(r.tagId)) return false;
  if (r.personId && !a.people.some((p) => p.personId === r.personId)) return false;
  return true;
}

function assetsInAlbum(album: Album) {
  return live().filter((a) =>
    a.projectId === album.projectId && (album.kind === "smart" ? matchesSmart(album, a) : a.albumIds.includes(album.id)),
  );
}

export interface AlbumSummary extends Album {
  count: number;
  cover?: Asset;
  previews: Asset[];
  years?: string;
  peopleCount: number;
  placeCount: number;
}

function summarizeAlbum(al: Album): AlbumSummary {
  const items = assetsInAlbum(al);
  return {
    ...al,
    count: items.length,
    years: yearSpan(items),
    peopleCount: new Set(items.flatMap((a) => a.people.map((p) => p.personId))).size,
    placeCount: new Set(items.map((a) => a.placeId).filter(Boolean)).size,
    cover: items.find((a) => a.id === al.coverAssetId) ?? items[0],
    previews: items.slice(0, 4),
  };
}

export async function listAlbums(projectId: string): Promise<AlbumSummary[]> {
  await connection();
  return db().albums.filter((a) => a.projectId === projectId).map(summarizeAlbum);
}

export async function getAlbum(id: string): Promise<AlbumSummary | null> {
  await connection();
  const al = db().albums.find((a) => a.id === id);
  return al ? summarizeAlbum(al) : null;
}

export interface AssetFilter {
  albumId?: string;
  status?: AssetStatus;
  eventId?: string;
  placeId?: string;
  personId?: string;
  tagId?: string;
  year?: string;
  q?: string;
}

export async function listAssets(projectId: string, f: AssetFilter = {}): Promise<Asset[]> {
  await connection();
  const s = db();
  let items = live().filter((a) => a.projectId === projectId);
  if (f.albumId) {
    const al = s.albums.find((a) => a.id === f.albumId);
    items = al ? assetsInAlbum(al) : [];
  }
  if (f.status) items = items.filter((a) => a.status === f.status);
  if (f.eventId) items = items.filter((a) => a.eventId === f.eventId || s.events.find((e) => e.id === a.eventId)?.parentEventId === f.eventId);
  if (f.placeId) items = items.filter((a) => a.placeId === f.placeId);
  if (f.personId) items = items.filter((a) => a.people.some((p) => p.personId === f.personId));
  if (f.tagId) items = items.filter((a) => a.tagIds.includes(f.tagId!));
  if (f.year) items = items.filter((a) => a.takenAt?.startsWith(f.year!));
  if (f.q) {
    const q = f.q.toLowerCase();
    const hit = (name?: string) => !!name?.toLowerCase().includes(q);
    items = items.filter(
      (a) =>
        hit(a.filename) ||
        hit(a.caption) ||
        hit(s.places.find((p) => p.id === a.placeId)?.name) ||
        hit(s.events.find((e) => e.id === a.eventId)?.name) ||
        a.people.some((p) => hit(s.people.find((x) => x.id === p.personId)?.name)) ||
        a.tagIds.some((t) => hit(s.tags.find((x) => x.id === t)?.name)) ||
        hit(a.takenAt?.slice(0, 4)),
    );
  }
  return items;
}

export async function getAssetsById(ids: string[]) {
  const s = db();
  return ids.map((id) => s.assets.find((a) => a.id === id)).filter((a): a is Asset => !!a);
}

export interface ProjectMeta {
  people: Person[];
  places: Place[];
  events: Event[];
  tags: Tag[];
  albums: Album[];
}

/** Everything a picker/inspector needs to resolve ids to names. */
export async function getProjectMeta(projectId: string): Promise<ProjectMeta> {
  await connection();
  const s = db();
  const by = <T extends { projectId: string }>(xs: T[]) => xs.filter((x) => x.projectId === projectId);
  return { people: by(s.people), places: by(s.places), events: by(s.events), tags: by(s.tags), albums: by(s.albums) };
}

export interface MemberWithUser extends Member {
  user: User;
}

export async function listMembers(projectId: string): Promise<MemberWithUser[]> {
  await connection();
  const s = db();
  return s.members
    .filter((m) => m.projectId === projectId)
    .map((m) => ({ ...m, user: s.users.find((u) => u.id === m.userId)! }));
}

export async function listInvites(projectId: string): Promise<Invite[]> {
  await connection();
  return db().invites.filter((i) => i.projectId === projectId);
}

export async function listUploadLinks(projectId: string): Promise<UploadLink[]> {
  await connection();
  return db().uploadLinks.filter((l) => l.projectId === projectId && !l.revoked);
}

export async function getUploadLink(token: string) {
  await connection();
  const s = db();
  const link = s.uploadLinks.find((l) => l.token === token && !l.revoked);
  if (!link) return null;
  return { link, project: s.projects.find((p) => p.id === link.projectId)!, album: s.albums.find((a) => a.id === link.albumId) };
}

export async function listStories(projectId?: string): Promise<(Story & { cover?: Asset; sectionCount: number })[]> {
  const user = await getCurrentUser();
  const s = db();
  const mine = new Set(s.members.filter((m) => m.userId === user.id).map((m) => m.projectId));
  return s.stories
    .filter((st) => (projectId ? st.projectId === projectId : mine.has(st.projectId)))
    .map((st) => {
      const secs = s.sections.filter((x) => x.storyId === st.id);
      return { ...st, sectionCount: secs.length, cover: s.assets.find((a) => a.id === secs[0]?.assetIds[0]) };
    });
}

export async function getStory(id: string) {
  await connection();
  const s = db();
  const story = s.stories.find((x) => x.id === id);
  if (!story) return null;
  const sections = s.sections.filter((x) => x.storyId === id).sort((a, b) => a.position - b.position);
  return { story, sections };
}

/** Recently-uploaded items across all my projects, for the dashboard. */
export async function recentActivity() {
  const projects = await listProjects();
  const ids = new Set(projects.map((p) => p.id));
  return live()
    .filter((a) => ids.has(a.projectId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);
}

export interface Pulse {
  recent: { count: number; thumbs: Asset[]; latest?: string };
  shared: { count: number; thumbs: Asset[]; from: string[] };
  attention: { count: number; thumbs: Asset[]; unidentified: number };
  activity: { contributors: User[]; added: number };
}

/** The four little status cards (recent uploads, shared with you, needs attention, activity). */
export async function getPulse(projectId?: string): Promise<Pulse> {
  const user = await getCurrentUser();
  const s = db();
  const mine = new Set(s.members.filter((m) => m.userId === user.id).map((m) => m.projectId));
  const pool = live()
    .filter((a) => (projectId ? a.projectId === projectId : mine.has(a.projectId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const weekAgo = Date.parse("2026-10-16T12:00:00Z") - 7 * 86400_000;
  const thisWeek = pool.filter((a) => Date.parse(a.createdAt) > weekAgo);
  const byOthers = thisWeek.filter((a) => a.uploadedBy !== user.id);
  const attention = pool.filter((a) => a.status === "needs_details" || !a.takenAt);
  const nameOf = (id?: string) => {
    const u = s.users.find((x) => x.id === id);
    return u?.nickname ?? u?.name.split(" ")[0];
  };
  const contributorIds = [...new Set(thisWeek.map((a) => a.uploadedBy).filter((x): x is string => !!x))];
  return {
    recent: { count: thisWeek.length, thumbs: thisWeek.filter((a) => a.kind === "photo").slice(0, 3), latest: thisWeek[0]?.createdAt },
    shared: { count: byOthers.length, thumbs: byOthers.filter((a) => a.kind === "photo").slice(3, 6), from: [...new Set(byOthers.map((a) => nameOf(a.uploadedBy) ?? a.contributorName).filter((x): x is string => !!x))] },
    attention: { count: attention.length, thumbs: attention.filter((a) => a.kind === "photo").slice(0, 3), unidentified: pool.filter((a) => a.kind === "photo" && !a.people.length).length },
    activity: { contributors: contributorIds.map((id) => s.users.find((u) => u.id === id)!).filter(Boolean), added: thisWeek.length },
  };
}

export interface ActivityItem {
  id: string;
  user?: User;
  who: string;
  kind: "added" | "story" | "document" | "tagged";
  count: number;
  text?: string;
  at: string;
  thumbs: Asset[];
  filename?: string;
}

/** Project activity feed, derived from uploads (grouped per person per day). */
export async function projectActivity(projectId: string): Promise<ActivityItem[]> {
  await connection();
  const s = db();
  const items = live()
    .filter((a) => a.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups = new Map<string, Asset[]>();
  for (const a of items) {
    const key = `${a.uploadedBy ?? a.contributorName}|${a.createdAt.slice(0, 10)}|${a.kind === "document" ? "doc" : a.caption ? "story" : "add"}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups.entries()].slice(0, 12).map(([key, list]) => {
    const [who, , kind] = key.split("|");
    const user = s.users.find((u) => u.id === who);
    return {
      id: key,
      user,
      who: user?.nickname ?? user?.name.split(" ")[0] ?? who.replace(/ \(.+\)$/, ""),
      kind: kind === "doc" ? "document" : kind === "story" ? "story" : "added",
      count: list.length,
      text: kind === "story" ? list[0].caption : undefined,
      at: list[0].createdAt,
      thumbs: list.filter((a) => a.kind === "photo").slice(0, 2),
      filename: kind === "doc" ? list[0].filename : undefined,
    };
  });
}

export async function listTrash(projectId: string) {
  await connection();
  return db().assets.filter((a) => a.projectId === projectId && a.deletedAt);
}

export async function trashAssets(ids: string[], restore = false) {
  for (const a of db().assets.filter((x) => ids.includes(x.id))) a.deletedAt = restore ? undefined : now();
}

export async function addProjectNote(projectId: string, text: string) {
  const user = await getCurrentUser();
  const p = db().projects.find((x) => x.id === projectId);
  if (!p) return;
  (p.notes ??= []).push({ id: uid("n"), userId: user.id, text, createdAt: now() });
}

export async function listUsers() {
  return db().users;
}

// ───────── Writes ─────────

export async function updateAssets(ids: string[], patch: AssetPatch): Promise<Asset[]> {
  const s = db();
  const out: Asset[] = [];
  for (const a of s.assets.filter((x) => ids.includes(x.id))) {
    if (patch.takenAt !== undefined) a.takenAt = patch.takenAt ?? undefined;
    if (patch.datePrecision) a.datePrecision = patch.datePrecision;
    if (patch.placeId !== undefined) a.placeId = patch.placeId ?? undefined;
    if (patch.eventId !== undefined) a.eventId = patch.eventId ?? undefined;
    if (patch.caption !== undefined) a.caption = patch.caption ?? undefined;
    const add = <T,>(xs: T[], more?: T[]) => [...xs, ...(more ?? []).filter((m) => !xs.includes(m))];
    a.tagIds = add(a.tagIds, patch.addTagIds).filter((t) => !patch.removeTagIds?.includes(t));
    a.albumIds = add(a.albumIds, patch.addAlbumIds).filter((t) => !patch.removeAlbumIds?.includes(t));
    for (const pid of patch.addPersonIds ?? []) {
      if (!a.people.some((p) => p.personId === pid)) a.people.push({ personId: pid, confirmed: true });
    }
    a.people = a.people.filter((p) => !patch.removePersonIds?.includes(p.personId));
    if (patch.favorite !== undefined) a.favorite = patch.favorite;
    if (patch.rotation !== undefined) a.rotation = patch.rotation;
    if (patch.status) a.status = patch.status;
    else if (a.status === "needs_details" && (a.takenAt || a.placeId || a.eventId || a.people.length || a.tagIds.length))
      a.status = "tagged";
    out.push(a);
  }
  touchProject(out[0]?.projectId);
  return out;
}

export async function setFaceBox(assetId: string, personId: string, box: Asset["people"][number]["box"]) {
  const a = db().assets.find((x) => x.id === assetId);
  if (!a) return;
  const existing = a.people.find((p) => p.personId === personId);
  if (existing) existing.box = box;
  else a.people.push({ personId, box, confirmed: true });
  if (a.status === "needs_details") a.status = "tagged";
}

function touchProject(id?: string) {
  const p = db().projects.find((x) => x.id === id);
  if (p) p.updatedAt = now();
}

export async function createProject(input: { name: string; category: Project["category"]; tagline?: string; description?: string }) {
  const user = await getCurrentUser();
  const s = db();
  const p: Project = { id: uid("p"), ownerId: user.id, ...input, createdAt: now(), updatedAt: now() };
  s.projects.push(p);
  s.members.push({ projectId: p.id, userId: user.id, role: "owner" });
  s.albums.push({ id: uid("al"), projectId: p.id, name: "Inbox", kind: "inbox", createdAt: now() });
  return p;
}

export async function createAlbum(input: Omit<Album, "id" | "createdAt">, assetIds: string[] = []) {
  const s = db();
  const al: Album = { ...input, id: uid("al"), createdAt: now() };
  s.albums.push(al);
  if (assetIds.length) await updateAssets(assetIds, { addAlbumIds: [al.id] });
  return al;
}

export async function createPerson(input: Omit<Person, "id">) {
  const p: Person = { ...input, id: uid("pe") };
  db().people.push(p);
  return p;
}

export async function mergePeople(projectId: string, keepId: string, mergeId: string) {
  const s = db();
  for (const a of s.assets.filter((x) => x.projectId === projectId)) {
    const dup = a.people.find((p) => p.personId === mergeId);
    if (!dup) continue;
    a.people = a.people.filter((p) => p.personId !== mergeId);
    if (!a.people.some((p) => p.personId === keepId)) a.people.push({ ...dup, personId: keepId });
  }
  s.people = s.people.filter((p) => p.id !== mergeId);
}

export async function createPlace(input: Omit<Place, "id">) {
  const p: Place = { ...input, id: uid("pl") };
  db().places.push(p);
  return p;
}

export async function updatePlace(id: string, patch: Partial<Omit<Place, "id" | "projectId">>) {
  const p = db().places.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  return p;
}

export async function createEvent(input: Omit<Event, "id">) {
  const e: Event = { ...input, id: uid("ev") };
  db().events.push(e);
  return e;
}

export async function updateEvent(id: string, patch: Partial<Omit<Event, "id" | "projectId">>) {
  const e = db().events.find((x) => x.id === id);
  if (e) Object.assign(e, patch);
  return e;
}

export async function createTag(projectId: string, name: string) {
  const s = db();
  const existing = s.tags.find((t) => t.projectId === projectId && t.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const t: Tag = { id: uid("tg"), projectId, name };
  s.tags.push(t);
  return t;
}

export async function createInvite(input: Omit<Invite, "id" | "createdAt">) {
  const inv: Invite = { ...input, id: uid("inv"), createdAt: now() };
  db().invites.push(inv);
  return inv;
}

export async function setMemberRole(projectId: string, userId: string, role: Role) {
  const m = db().members.find((x) => x.projectId === projectId && x.userId === userId);
  if (m && m.role !== "owner") m.role = role;
}

export async function createUploadLink(input: { projectId: string; albumId?: string; label: string }) {
  const link: UploadLink = { ...input, id: uid("ul"), token: crypto.randomUUID().replace(/-/g, "").slice(0, 20), createdAt: now(), revoked: false };
  db().uploadLinks.push(link);
  return link;
}

export async function revokeUploadLink(id: string) {
  const l = db().uploadLinks.find((x) => x.id === id);
  if (l) l.revoked = true;
}

export interface NewAssetInput {
  projectId: string;
  albumId?: string;
  filename: string;
  url: string;
  kind: Asset["kind"];
  contributorName?: string;
  takenAt?: string;
  datePrecision?: Asset["datePrecision"];
  placeId?: string;
  eventId?: string;
  caption?: string;
  personIds?: string[];
  tagIds?: string[];
}

export async function addAssets(inputs: NewAssetInput[]) {
  const user = await getCurrentUser();
  const s = db();
  const created = inputs.map((i): Asset => {
    const inbox = s.albums.find((a) => a.projectId === i.projectId && a.kind === "inbox");
    const albumIds = [...new Set([i.albumId ?? inbox?.id].filter((x): x is string => !!x))];
    const hasDetails = !!(i.takenAt || i.placeId || i.eventId || i.personIds?.length || i.tagIds?.length);
    return {
      id: uid("as"),
      projectId: i.projectId,
      uploadedBy: i.contributorName ? undefined : user.id,
      contributorName: i.contributorName,
      kind: i.kind,
      url: i.url,
      thumbUrl: i.url,
      filename: i.filename,
      takenAt: i.takenAt,
      datePrecision: i.datePrecision ?? (i.takenAt ? "exact" : "unknown"),
      placeId: i.placeId,
      eventId: i.eventId,
      caption: i.caption,
      status: hasDetails ? "tagged" : "needs_details",
      people: (i.personIds ?? []).map((personId) => ({ personId, confirmed: true })),
      tagIds: i.tagIds ?? [],
      albumIds,
      createdAt: now(),
    };
  });
  s.assets.push(...created);
  touchProject(inputs[0]?.projectId);
  return created;
}

export async function createStory(input: { projectId: string; albumId?: string; title: string; assetIds: string[] }) {
  const s = db();
  const st: Story = { id: uid("st"), projectId: input.projectId, albumId: input.albumId, title: input.title, step: "plan", createdAt: now(), updatedAt: now() };
  s.stories.push(st);
  s.sections.push({ id: uid("sec"), storyId: st.id, position: 0, title: "Beginning", layout: "full_width", assetIds: input.assetIds.slice(0, 12) });
  return st;
}

export async function saveSections(storyId: string, sections: StorySection[]) {
  const s = db();
  s.sections = [...s.sections.filter((x) => x.storyId !== storyId), ...sections.map((x, i) => ({ ...x, storyId, position: i }))];
  const st = s.stories.find((x) => x.id === storyId);
  if (st) st.updatedAt = now();
}

export async function updateStory(id: string, patch: Partial<Pick<Story, "title" | "subtitle" | "step">>) {
  const st = db().stories.find((x) => x.id === id);
  if (st) Object.assign(st, patch, { updatedAt: now() });
  return st;
}

/** Spreads for the editor; generated from the storyboard the first time. */
export async function getSpreads(storyId: string): Promise<Spread[]> {
  await connection();
  const s = db();
  s.spreads ??= {};
  if (s.spreads[storyId]?.length) return s.spreads[storyId];
  const sections = s.sections.filter((x) => x.storyId === storyId).sort((a, b) => a.position - b.position);
  const spreads = sections.map((sec, i) => autoLayout(sec, i));
  s.spreads[storyId] = spreads;
  return spreads;
}

export async function saveSpreads(storyId: string, spreads: Spread[]) {
  (db().spreads ??= {})[storyId] = spreads;
  const st = db().stories.find((x) => x.id === storyId);
  if (st) Object.assign(st, { updatedAt: now(), step: st.step === "plan" ? "design" : st.step });
}

/** A pleasant default spread: title + story on the left, photos + widget on the right. */
function autoLayout(sec: StorySection, i: number): Spread {
  const el = (e: Omit<SpreadElement, "id">, k: number): SpreadElement => ({ id: `${sec.id}-e${k}`, ...e });
  const photos = sec.assetIds;
  const elements: SpreadElement[] = [
    el({ type: "heading", x: 4, y: 8, w: 22, h: 16, text: sec.title }, 0),
    el({ type: "text", x: 4, y: 27, w: 20, h: 6, text: (sec.subtitle ?? "").toUpperCase() }, 1),
    el({ type: "text", x: 4, y: 36, w: 20, h: 26, text: sec.summary ?? "" }, 2),
  ];
  if (photos[0]) elements.push(el({ type: "photo", x: 28, y: 8, w: 19, h: 44, assetId: photos[0] }, 3));
  if (photos[1]) elements.push(el({ type: "photo", x: 28, y: 56, w: 19, h: 36, assetId: photos[1] }, 4));
  elements.push(el({ type: "quote", x: 4, y: 68, w: 20, h: 22, text: "Some places just make you slow down and look a little longer." }, 5));
  if (photos[2]) elements.push(el({ type: "photo", x: 53, y: 34, w: 43, h: 30, assetId: photos[2] }, 6));
  if (sec.widget) elements.push(el({ type: "widget", x: 56, y: 8, w: 22, h: 22, widget: sec.widget }, 7));
  if (photos[3]) elements.push(el({ type: "photo", x: 72, y: 67, w: 11, h: 25, assetId: photos[3] }, 8));
  if (photos[4]) elements.push(el({ type: "photo", x: 85, y: 67, w: 11, h: 25, assetId: photos[4] }, 9));
  if (photos[5]) elements.push(el({ type: "photo", x: 53, y: 67, w: 17, h: 25, assetId: photos[5] }, 10));
  return { id: `spread-${sec.id}-${i}`, sectionId: sec.id, elements };
}

export async function updateStoryDetails(id: string, patch: { title?: string; subtitle?: string; details?: Record<string, string> }) {
  const st = db().stories.find((x) => x.id === id);
  if (!st) return;
  if (patch.title) st.title = patch.title;
  if (patch.subtitle !== undefined) st.subtitle = patch.subtitle;
  if (patch.details) st.details = { ...st.details, ...patch.details };
  st.updatedAt = now();
}

/** Albums across every project I belong to, most recently active first. */
export async function listMyAlbums(): Promise<AlbumSummary[]> {
  const projects = await listProjects();
  const ids = new Set(projects.map((p) => p.id));
  const order = new Map(projects.map((p, i) => [p.id, i]));
  return db()
    .albums.filter((a) => ids.has(a.projectId) && a.kind === "manual")
    .map(summarizeAlbum)
    .filter((a) => a.count > 0)
    .sort((a, b) => (order.get(a.projectId)! - order.get(b.projectId)!) || b.count - a.count);
}

export async function updateAlbum(id: string, patch: { name?: string; description?: string; category?: Album["category"] }) {
  const al = db().albums.find((a) => a.id === id);
  if (al) Object.assign(al, patch);
}

export async function purgeAssets(ids: string[]) {
  const s = db();
  s.assets = s.assets.filter((a) => !(ids.includes(a.id) && a.deletedAt));
}

/** People / places across every project I belong to. */
export async function listMyPeopleAndPlaces() {
  const projects = await listProjects();
  const ids = new Set(projects.map((p) => p.id));
  const s = db();
  const assets = live().filter((a) => ids.has(a.projectId));
  return {
    projects,
    people: s.people.filter((p) => ids.has(p.projectId)).map((p) => ({ ...p, count: assets.filter((a) => a.people.some((x) => x.personId === p.id)).length, cover: assets.find((a) => a.people.some((x) => x.personId === p.id) && a.kind === "photo") })),
    places: s.places.filter((p) => ids.has(p.projectId)).map((p) => ({ ...p, count: assets.filter((a) => a.placeId === p.id).length, cover: assets.find((a) => a.placeId === p.id && a.kind === "photo") })),
  };
}
