"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as data from "@/lib/data";
import type { AssetPatch, FaceBox, Invite, Role, SmartRules, Spread, Story, StorySection } from "@/lib/types";

// Every action is a public endpoint. In demo mode there is a single user; once
// Supabase auth is wired, each action re-checks the session and project role
// (RLS enforces it again at the database).

function clean(s: FormDataEntryValue | null) {
  const v = typeof s === "string" ? s.trim() : "";
  return v || undefined;
}

/** `quiet` skips re-rendering the route — for workspaces that keep their own local state. */
export async function updateAssetsAction(ids: string[], patch: AssetPatch, quiet = false) {
  if (!ids.length) return [];
  const updated = await data.updateAssets(ids, patch);
  if (!quiet) refresh();
  return updated;
}

export async function setFaceBoxAction(assetId: string, personId: string, box: FaceBox) {
  await data.setFaceBox(assetId, personId, box);
}

export async function createTagAction(projectId: string, name: string) {
  return data.createTag(projectId, name.trim());
}

export async function createPersonAction(projectId: string, name: string, branch?: string) {
  const p = await data.createPerson({ projectId, name: name.trim(), branch: branch?.trim() || undefined });
  refresh();
  return p;
}

export async function mergePeopleAction(projectId: string, keepId: string, mergeId: string) {
  await data.mergePeople(projectId, keepId, mergeId);
  refresh();
}

export async function createPlaceAction(
  projectId: string,
  name: string,
  address?: string,
  coords?: { lat: number; lng: number; precision: "exact" | "approximate" },
) {
  const p = await data.createPlace({ projectId, name: name.trim(), address: address?.trim() || undefined, precision: "approximate", ...coords });
  refresh();
  return p;
}

export async function updatePlaceAction(id: string, patch: { lat?: number; lng?: number; precision?: "exact" | "approximate"; name?: string; address?: string }) {
  await data.updatePlace(id, patch);
  refresh();
}

export async function createEventAction(projectId: string, name: string, recurring = false) {
  const e = await data.createEvent({ projectId, name: name.trim(), recurring });
  refresh();
  return e;
}

export async function createAlbumAction(projectId: string, name: string, assetIds: string[] = [], description?: string, rules?: SmartRules) {
  const al = await data.createAlbum({ projectId, name: name.trim(), kind: rules ? "smart" : "manual", description, rules }, rules ? [] : assetIds);
  refresh();
  return al;
}

export async function createProjectAction(formData: FormData) {
  const name = clean(formData.get("name"));
  if (!name) return;
  const category = (clean(formData.get("category")) ?? "family") as Parameters<typeof data.createProject>[0]["category"];
  const p = await data.createProject({ name, category, tagline: clean(formData.get("tagline")), description: clean(formData.get("description")) });
  redirect(`/projects/${p.id}`);
}

export async function uploadAction(inputs: data.NewAssetInput[]) {
  const created = await data.addAssets(inputs);
  refresh();
  return created.map((a) => a.id);
}

/** Upload-link contributions: the token is the only credential. */
export async function contributeAction(token: string, contributorName: string, files: { filename: string; url: string; kind: data.NewAssetInput["kind"] }[], note?: string) {
  const found = await data.getUploadLink(token);
  if (!found) throw new Error("This upload link is no longer active.");
  await data.addAssets(
    files.map((f) => ({ ...f, projectId: found.project.id, albumId: found.link.albumId, contributorName: contributorName || "A family member", caption: note })),
  );
}

export async function inviteAction(input: { projectId: string; albumId?: string; emails: string[]; role: Invite["role"] }) {
  for (const email of input.emails) {
    await data.createInvite({ projectId: input.projectId, albumId: input.albumId, email, role: input.role });
  }
  refresh();
}

export async function setRoleAction(projectId: string, userId: string, role: Role) {
  await data.setMemberRole(projectId, userId, role);
  refresh();
}

export async function createUploadLinkAction(projectId: string, albumId: string | undefined, label: string) {
  const link = await data.createUploadLink({ projectId, albumId, label });
  refresh();
  return link;
}

export async function revokeUploadLinkAction(id: string) {
  await data.revokeUploadLink(id);
  refresh();
}

export async function createStoryAction(input: { projectId: string; albumId?: string; title: string; assetIds: string[] }) {
  const st = await data.createStory(input);
  redirect(`/stories/${st.id}/storyboard`);
}

export async function saveSectionsAction(storyId: string, sections: StorySection[]) {
  await data.saveSections(storyId, sections);
}

export async function updateStoryAction(storyId: string, patch: Partial<Pick<Story, "title" | "subtitle" | "step">>) {
  await data.updateStory(storyId, patch);
}

export async function saveSpreadsAction(storyId: string, spreads: Spread[]) {
  await data.saveSpreads(storyId, spreads);
}

/** Book Maker: turn grouped "moments" into a story whose sections are those moments. */
export async function createBookFromMomentsAction(input: { projectId: string; title: string; moments: { title: string; assetIds: string[] }[] }) {
  const st = await data.createStory({ projectId: input.projectId, title: input.title, assetIds: [] });
  await data.saveSections(
    st.id,
    input.moments.map((m, i) => ({ id: `sec-${st.id}-${i}`, storyId: st.id, position: i, title: m.title, layout: "full_width", assetIds: m.assetIds })),
  );
  redirect(`/stories/${st.id}/storyboard`);
}

export async function updateEventAction(eventId: string, patch: { description?: string }) {
  await data.updateEvent(eventId, patch);
}

export async function trashAssetsAction(ids: string[], restore = false) {
  await data.trashAssets(ids, restore);
  refresh();
}

export async function addProjectNoteAction(projectId: string, text: string) {
  if (!text.trim()) return;
  await data.addProjectNote(projectId, text.trim().slice(0, 1000));
  refresh();
}

export async function updateStoryDetailsAction(storyId: string, patch: { title?: string; subtitle?: string; details?: Record<string, string> }) {
  await data.updateStoryDetails(storyId, patch);
  refresh();
}

export async function updateAlbumAction(albumId: string, patch: { name?: string; description?: string }) {
  await data.updateAlbum(albumId, patch);
  refresh();
}

/** A written memory (no file) — shows up as a story in the archive and activity feed. */
export async function addWrittenStoryAction(projectId: string, title: string, text: string) {
  if (!text.trim()) return;
  await data.addAssets([{ projectId, kind: "document", filename: `${(title.trim() || "A family story").slice(0, 60)}.txt`, url: "", caption: text.trim().slice(0, 4000) }]);
  refresh();
}

export async function purgeAssetsAction(ids: string[]) {
  await data.purgeAssets(ids);
  refresh();
}
