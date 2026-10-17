// Demo data used when Supabase isn't configured, so the UI is explorable
// end-to-end. Deterministic: same seed → same library on every boot.

import { PHOTOS, face, unsplash } from "@/lib/demo/photos";
import type {
  Album,
  Asset,
  AssetKind,
  AssetStatus,
  Category,
  Event,
  Invite,
  Member,
  Person,
  Place,
  Project,
  Spread,
  Story,
  StorySection,
  Tag,
  UploadLink,
  User,
} from "@/lib/types";

export interface Store {
  users: User[];
  projects: Project[];
  members: Member[];
  albums: Album[];
  assets: Asset[];
  people: Person[];
  places: Place[];
  events: Event[];
  tags: Tag[];
  invites: Invite[];
  uploadLinks: UploadLink[];
  stories: Story[];
  sections: StorySection[];
  spreads: Record<string, Spread[]>;
}

export const DEMO_USER_ID = "u-emily";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function createSeed(): Store {
  const rand = rng(1992);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

  // ───────── People who use the app ─────────
  const users: User[] = [
    { id: DEMO_USER_ID, name: "Emily Martin", email: "emily@example.com", avatarUrl: face(PHOTOS.women[0]) },
    { id: "u-mom", name: "Susan Martin", nickname: "Mom", email: "susan@example.com", avatarUrl: face(PHOTOS.women[3]) },
    { id: "u-dad", name: "Robert Martin", nickname: "Dad", email: "robert@example.com", avatarUrl: face(PHOTOS.men[0]) },
    { id: "u-jake", name: "Jake Martin", nickname: "Jake", email: "jake@example.com", avatarUrl: face(PHOTOS.men[2]) },
    { id: "u-sarah", name: "Sarah Robinson", nickname: "Sarah", email: "sarah@example.com", avatarUrl: face(PHOTOS.women[1]) },
    { id: "u-mark", name: "Mark Robinson", nickname: "Mark", email: "mark@example.com", avatarUrl: face(PHOTOS.men[3]) },
    { id: "u-lisa", name: "Lisa Shirley", nickname: "Aunt Lisa", email: "lisa@example.com", avatarUrl: face(PHOTOS.women[4]) },
    { id: "u-chris", name: "Chris Martin", nickname: "Chris", email: "chris@example.com", avatarUrl: face(PHOTOS.men[4]) },
    { id: "u-megan", name: "Megan Shirley", nickname: "Megan", email: "megan@example.com", avatarUrl: face(PHOTOS.women[5]) },
    { id: "u-tom", name: "Tom Shirley", nickname: "Uncle Tom", email: "tom@example.com", avatarUrl: face(PHOTOS.men[5]) },
    { id: "u-david", name: "David Martin", nickname: "David", email: "david@example.com", avatarUrl: face(PHOTOS.men[1]) },
  ];

  const projects: Project[] = [];
  const members: Member[] = [];
  const albums: Album[] = [];
  const assets: Asset[] = [];
  const people: Person[] = [];
  const places: Place[] = [];
  const events: Event[] = [];
  const tags: Tag[] = [];

  /** Push a run of assets built from photo ids. */
  function addRun(opts: {
    projectId: string;
    prefix: string;
    photos: readonly string[];
    years: [number, number];
    month?: number;
    albumIds: string[];
    placeId?: string;
    eventId?: string;
    tagIds?: string[];
    uploaders: string[];
    status?: AssetStatus;
    personPool?: string[];
    created?: (i: number) => string;
  }) {
    const out: Asset[] = [];
    opts.photos.forEach((id, i) => {
      const year = opts.years[0] + Math.round(((opts.years[1] - opts.years[0]) * i) / Math.max(opts.photos.length - 1, 1));
      const month = opts.month ?? 1 + Math.floor(rand() * 12);
      const day = 1 + Math.floor(rand() * 27);
      const video = rand() < 0.12;
      const kind: AssetKind = video ? "video" : "photo";
      const status: AssetStatus = opts.status ?? (rand() < 0.7 ? "reviewed" : "tagged");
      const raw = status === "needs_details";
      const ppl = (opts.personPool ?? []).filter(() => rand() < 0.35).slice(0, 6);
      out.push({
        id: `${opts.prefix}-${i + 1}`,
        projectId: opts.projectId,
        uploadedBy: pick(opts.uploaders),
        kind,
        ...unsplash(id),
        width: 4032,
        height: 3024,
        byteSize: 2_400_000 + Math.floor(rand() * 3_000_000),
        durationSec: video ? 12 + Math.floor(rand() * 50) : undefined,
        favorite: rand() < 0.15,
        filename: `${video ? "VID" : "IMG"}_${year}_${pad(i + 1, 3)}.${video ? "mov" : "jpg"}`,
        takenAt: raw ? undefined : `${year}-${pad(month)}-${pad(day)}`,
        datePrecision: raw ? "unknown" : year < 1975 ? "year" : rand() < 0.5 ? "exact" : "month",
        placeId: raw ? undefined : opts.placeId,
        eventId: raw ? undefined : opts.eventId,
        status,
        people: raw ? [] : ppl.map((personId) => ({ personId, confirmed: true })),
        tagIds: raw ? [] : (opts.tagIds ?? []).filter(() => rand() < 0.7),
        albumIds: opts.albumIds,
        createdAt: opts.created ? opts.created(i) : `2026-0${3 + (i % 6)}-1${i % 9}T12:00:00Z`,
      });
    });
    assets.push(...out);
    return out;
  }

  function addProject(p: Omit<Project, "createdAt">, memberRoles: [string, Member["role"]][]) {
    projects.push({ createdAt: "2026-01-02T10:00:00Z", ...p });
    memberRoles.forEach(([userId, role]) => members.push({ projectId: p.id, userId, role }));
    albums.push({ id: `${p.id}-inbox`, projectId: p.id, name: "Inbox", kind: "inbox", description: "New uploads land here until they are organized.", createdAt: "2026-01-02T10:00:00Z" });
  }

  // ───────── Martin Family Archive ─────────
  const P = "p-martin";
  addProject(
    {
      id: P,
      ownerId: DEMO_USER_ID,
      name: "Martin Family Archive",
      category: "family",
      tagline: "Our people. Our places. Our stories. Always.",
      description:
        "A collection of memories from our family reunions, lake summers and holidays. Add your photos, videos, and stories to help preserve these special times for future generations.",
      hero: { quote: "Same lake.\nNew stories.\nStill family." },
      notes: [
        { id: "n-1", userId: "u-mom", text: "Does anyone have photos from the 1996 reunion at Grandma's? Mine are all blurry!", createdAt: "2026-10-14T18:20:00Z" },
        { id: "n-2", userId: "u-dad", text: "Scanned Grandpa's slides — they're in the inbox. Help me name everyone?", createdAt: "2026-10-15T09:05:00Z" },
      ],
      updatedAt: "2026-10-16T09:12:00Z",
    },
    [
      [DEMO_USER_ID, "owner"],
      ["u-mom", "editor"],
      ["u-dad", "organizer"],
      ["u-jake", "contributor"],
      ["u-sarah", "contributor"],
      ["u-mark", "contributor"],
      ["u-lisa", "contributor"],
      ["u-chris", "contributor"],
      ["u-megan", "contributor"],
      ["u-tom", "contributor"],
      ["u-david", "viewer"],
    ],
  );

  places.push(
    { id: "pl-lake", projectId: P, name: "Lake House", address: "Lake Martin, Alabama", lat: 32.68, lng: -85.92, precision: "exact" },
    { id: "pl-grandma", projectId: P, name: "Grandma's House", address: "Tyler, Texas", lat: 32.35, lng: -95.3, precision: "exact" },
    { id: "pl-nantucket", projectId: P, name: "Nantucket, MA", address: "Nantucket, Massachusetts", lat: 41.28, lng: -70.1, precision: "approximate" },
    { id: "pl-home", projectId: P, name: "Our Hometown", address: "Birmingham, Alabama", lat: 33.52, lng: -86.8, precision: "approximate" },
  );

  const fam: [string, string, number, string][] = [
    ["Mom", "Martin", 1962, face(PHOTOS.women[3])],
    ["Dad", "Martin", 1960, face(PHOTOS.men[0])],
    ["Emma", "Martin", 2019, face(PHOTOS.kids[0])],
    ["Noah", "Martin", 2016, face(PHOTOS.kids[1])],
    ["Olivia", "Robinson", 2014, face(PHOTOS.kids[2])],
    ["Grandma", "Elders", 1934, face(PHOTOS.elders[0])],
    ["Grandpa", "Elders", 1931, face(PHOTOS.elders[1])],
    ["Jake", "Martin", 1990, face(PHOTOS.men[2])],
    ["Aunt Lisa", "Shirley", 1965, face(PHOTOS.women[4])],
  ];
  fam.forEach(([name, branch, birthYear, avatarUrl], i) => people.push({ id: `pe-${i}`, projectId: P, name, branch: `${branch} family`, birthYear, avatarUrl }));
  const allPeople = people.map((p) => p.id);

  ["Family Reunion", "Summer", "Lake", "Cousins", "Grandparents", "Holidays", "Fishing", "Fireworks"].forEach((name, i) => tags.push({ id: `tg-${i}`, projectId: P, name }));

  events.push(
    { id: "ev-memorial", projectId: P, name: "Memorial Day at the Lake", recurring: true, placeId: "pl-lake", description: "Every year at the lake house since 1990." },
    { id: "ev-reunion", projectId: P, name: "Family Reunions", recurring: true, placeId: "pl-lake" },
    {
      id: "ev-reunion-92",
      projectId: P,
      name: "Family Reunion 1992",
      recurring: false,
      parentEventId: "ev-reunion",
      startDate: "1992-07-10",
      endDate: "1992-07-14",
      placeId: "pl-lake",
      weather: "Sunny, 88°F",
      description: "The summer the whole family made it to the lake together. Fishing off the dock, fireworks on the Fourth, and Grandpa's famous fish fry.",
    },
    { id: "ev-christmas", projectId: P, name: "Christmas at Grandma's", recurring: true, placeId: "pl-grandma" },
    { id: "ev-nantucket", projectId: P, name: "Summers in Nantucket", recurring: true, placeId: "pl-nantucket" },
    { id: "ev-remembrance", projectId: P, name: "Remembrance Gatherings", recurring: true, placeId: "pl-grandma", description: "Honoring the ones who came before us." },
  );

  albums.push(
    {
      id: "al-reunions",
      projectId: P,
      name: "Family Reunions",
      category: "family",
      kind: "manual",
      description: "Family reunions through the years — lake houses, holiday gatherings, and all the cousins, grandparents, and unforgettable moments that bring us together.",
      createdAt: "2026-03-04T15:00:00Z",
    },
    { id: "al-christmas", projectId: P, name: "Christmas Memories", category: "holidays", kind: "manual", createdAt: "2026-03-05T15:00:00Z" },
    { id: "al-lake", projectId: P, name: "Lake House Summers", category: "everyday", kind: "manual", createdAt: "2026-03-06T15:00:00Z" },
    { id: "al-grandparents", projectId: P, name: "Grandma & Grandpa", category: "family", kind: "manual", createdAt: "2026-03-07T15:00:00Z" },
    { id: "al-cousins", projectId: P, name: "Cousins Growing Up", category: "milestones", kind: "manual", createdAt: "2026-03-08T15:00:00Z" },
    { id: "al-1992", projectId: P, name: "Family Reunion 1992", category: "family", kind: "manual", description: "A special summer", createdAt: "2026-03-09T15:00:00Z" },
  );

  const martinUploaders = ["u-mom", "u-dad", "u-jake", "u-sarah", "u-mark", "u-chris", "u-megan", "u-tom", DEMO_USER_ID];
  addRun({ projectId: P, prefix: "as-92", photos: [...PHOTOS.dock.slice(0, 10), ...PHOTOS.fireworks, ...PHOTOS.chairs.slice(0, 1), ...PHOTOS.reunion.slice(6)], years: [1992, 1992], month: 7, albumIds: ["al-1992", "al-reunions"], placeId: "pl-lake", eventId: "ev-reunion-92", tagIds: ["tg-0", "tg-1", "tg-6", "tg-7"], uploaders: martinUploaders, personPool: allPeople });
  addRun({ projectId: P, prefix: "as-reu", photos: PHOTOS.reunion.slice(0, 6), years: [1990, 2024], month: 7, albumIds: ["al-reunions"], placeId: "pl-home", eventId: "ev-reunion", tagIds: ["tg-0", "tg-3"], uploaders: martinUploaders, personPool: allPeople });
  addRun({ projectId: P, prefix: "as-xmas", photos: PHOTOS.christmas, years: [1989, 2024], month: 12, albumIds: ["al-christmas"], placeId: "pl-grandma", eventId: "ev-christmas", tagIds: ["tg-5"], uploaders: martinUploaders, personPool: allPeople });
  addRun({ projectId: P, prefix: "as-lake", photos: [...PHOTOS.lake, ...PHOTOS.house, ...PHOTOS.chairs.slice(1), ...PHOTOS.dock.slice(10, 12)], years: [1995, 2024], month: 6, albumIds: ["al-lake"], placeId: "pl-lake", eventId: "ev-memorial", tagIds: ["tg-1", "tg-2", "tg-6"], uploaders: martinUploaders, personPool: allPeople });
  addRun({ projectId: P, prefix: "as-gp", photos: [...PHOTOS.vintage.slice(0, 8), ...PHOTOS.elders], years: [1950, 2024], albumIds: ["al-grandparents"], placeId: "pl-grandma", eventId: "ev-remembrance", tagIds: ["tg-4"], uploaders: martinUploaders, personPool: ["pe-5", "pe-6", "pe-0", "pe-1"] });
  addRun({ projectId: P, prefix: "as-cuz", photos: [...PHOTOS.kids, ...PHOTOS.beach, ...PHOTOS.ski], years: [1988, 2024], albumIds: ["al-cousins"], placeId: "pl-nantucket", eventId: "ev-nantucket", tagIds: ["tg-3", "tg-1"], uploaders: martinUploaders, personPool: allPeople });

  // Fresh uploads waiting in the Upload & Review queue (July 1994 at the lake, mid-sort).
  const now = Date.parse("2026-10-16T12:00:00Z");
  const inbox = addRun({
    projectId: P,
    prefix: "as-new",
    photos: [...PHOTOS.dock.slice(12, 16), ...PHOTOS.vintage.slice(8), ...PHOTOS.fireworks.slice(0, 1), ...PHOTOS.lake.slice(0, 3), ...PHOTOS.dog.slice(0, 1), ...PHOTOS.reunion.slice(0, 2)],
    years: [1994, 1994],
    month: 7,
    albumIds: [`${P}-inbox`],
    uploaders: ["u-jake", "u-mom", "u-sarah", "u-chris", "u-megan", "u-tom", "u-mark"],
    status: "needs_details",
    created: (i) => new Date(now - (i * 3 + 2) * 3600_000).toISOString(),
  });
  inbox.forEach((a, i) => {
    // Most already carry camera dates — the queue only needs the rest.
    if (i % 3 !== 2) {
      a.takenAt = `1994-07-${pad(12 + (i % 9))}`;
      a.datePrecision = "exact";
    }
    a.favorite = false;
  });
  inbox[2].contributorName = "Aunt Lisa (upload link)";
  inbox[2].uploadedBy = undefined;
  inbox[5].kind = "document";
  inbox[5].filename = "lake-martin-1994-itinerary.pdf";

  // A showcase memory with a caption
  const show = assets.find((a) => a.id === "as-92-1")!;
  show.caption = "Cousins on the dock after lunch. Fishing and hanging out.";
  show.people = ["pe-2", "pe-3", "pe-4", "pe-7"].map((personId) => ({ personId, confirmed: true }));
  show.favorite = true;

  assets.push({
    id: "as-cover",
    projectId: P,
    uploadedBy: "u-mom",
    kind: "photo",
    url: "/demo/martin-cover.jpg",
    thumbUrl: "/demo/martin-cover.jpg",
    width: 2300,
    height: 576,
    byteSize: 1_900_000,
    filename: "IMG_2019_dock.jpg",
    takenAt: "2019-05-26",
    datePrecision: "exact",
    placeId: "pl-lake",
    eventId: "ev-memorial",
    caption: "Same lake. New stories. Still family.",
    status: "reviewed",
    favorite: true,
    people: [{ personId: "pe-6", confirmed: true }],
    tagIds: ["tg-2"],
    albumIds: ["al-lake", "al-reunions"],
    createdAt: "2026-05-30T12:00:00Z",
  });
  projects[0].coverAssetId = "as-cover";
  const setCover = (albumId: string, assetId: string) => (albums.find((a) => a.id === albumId)!.coverAssetId = assetId);
  setCover("al-reunions", "as-reu-1");
  setCover("al-christmas", "as-xmas-6");
  setCover("al-lake", "as-lake-2");
  setCover("al-grandparents", "as-gp-9");
  setCover("al-cousins", "as-cuz-2");
  setCover("al-1992", "as-92-14");

  // ───────── The rest of the library ─────────
  const simple: {
    id: string;
    name: string;
    category: Category;
    tagline: string;
    albums: { id: string; name: string; category: Category; photos: readonly string[]; years: [number, number] }[];
    place: Place;
    updatedAt: string;
  }[] = [
    {
      id: "p-greece",
      name: "Greece 2025",
      category: "travel",
      tagline: "Islands, sunsets, and so much more.",
      albums: [{ id: "al-s-all", name: "Santorini Adventure", category: "travel", photos: [...PHOTOS.airplane, ...PHOTOS.santorini], years: [2024, 2024] }],
      place: { id: "pl-oia", projectId: "p-greece", name: "Oia", address: "Santorini, Greece", lat: 36.4618, lng: 25.3753, precision: "exact" },
      updatedAt: "2026-10-15T20:00:00Z",
    },
    {
      id: "p-emma",
      name: "Emma – First Year",
      category: "milestones",
      tagline: "All your firsts and more.",
      albums: [
        { id: "al-emma-steps", name: "Emma's First Steps", category: "milestones", photos: PHOTOS.baby, years: [2020, 2020] },
        { id: "al-emma-one", name: "Emma Turns One", category: "milestones", photos: PHOTOS.birthday, years: [2020, 2020] },
      ],
      place: { id: "pl-emma-home", projectId: "p-emma", name: "Home", address: "Birmingham, Alabama", lat: 33.52, lng: -86.8, precision: "approximate" },
      updatedAt: "2026-10-12T14:00:00Z",
    },
    {
      id: "p-alabama",
      name: "Alabama 2015 Season",
      category: "sports",
      tagline: "A season to remember.",
      albums: [{ id: "al-senior-season", name: "Senior Season", category: "sports", photos: PHOTOS.football, years: [2015, 2015] }],
      place: { id: "pl-stadium", projectId: "p-alabama", name: "Bryant–Denny Stadium", address: "Tuscaloosa, Alabama", lat: 33.208, lng: -87.55, precision: "exact" },
      updatedAt: "2026-10-09T14:00:00Z",
    },
    {
      id: "p-christmas",
      name: "Christmas Traditions",
      category: "holidays",
      tagline: "Our favorite holiday moments.",
      albums: [{ id: "al-xmas-89", name: "Christmas 1989", category: "holidays", photos: PHOTOS.christmas.slice(0, 6), years: [1989, 2023] }],
      place: { id: "pl-xmas", projectId: "p-christmas", name: "Grandma's House", address: "Tyler, Texas", lat: 32.35, lng: -95.3, precision: "approximate" },
      updatedAt: "2026-10-02T14:00:00Z",
    },
    {
      id: "p-senior",
      name: "Senior Year",
      category: "school",
      tagline: "Friends, achievements, new beginnings.",
      albums: [{ id: "al-grad", name: "Graduation Day", category: "school", photos: PHOTOS.graduation, years: [2014, 2014] }],
      place: { id: "pl-school", projectId: "p-senior", name: "Mountain Brook High", address: "Birmingham, Alabama", lat: 33.48, lng: -86.75, precision: "approximate" },
      updatedAt: "2026-09-28T14:00:00Z",
    },
    {
      id: "p-everyday",
      name: "Everyday Moments",
      category: "everyday",
      tagline: "The little things that mean the most.",
      albums: [
        { id: "al-dogs", name: "Our Dogs", category: "everyday", photos: PHOTOS.dog, years: [2018, 2025] },
        { id: "al-beach", name: "Beach Week", category: "travel", photos: PHOTOS.beach, years: [2023, 2023] },
        { id: "al-ski", name: "Ski Trip", category: "travel", photos: PHOTOS.ski, years: [2024, 2024] },
        { id: "al-dinner", name: "Family Dinner", category: "everyday", photos: PHOTOS.dinner, years: [2025, 2025] },
      ],
      place: { id: "pl-everyday", projectId: "p-everyday", name: "Home", address: "Birmingham, Alabama", lat: 33.52, lng: -86.8, precision: "approximate" },
      updatedAt: "2026-09-20T14:00:00Z",
    },
    {
      id: "p-wedding",
      name: "Our Wedding",
      category: "life_events",
      tagline: "The beginning of forever.",
      albums: [{ id: "al-wedding", name: "Wedding Day", category: "life_events", photos: PHOTOS.wedding, years: [2022, 2022] }],
      place: { id: "pl-wedding", projectId: "p-wedding", name: "The Garden at Aldridge", address: "Birmingham, Alabama", lat: 33.39, lng: -86.79, precision: "exact" },
      updatedAt: "2026-09-02T14:00:00Z",
    },
  ];

  simple.forEach((sp, si) => {
    addProject(
      { id: sp.id, ownerId: DEMO_USER_ID, name: sp.name, category: sp.category, tagline: sp.tagline, updatedAt: sp.updatedAt },
      [[DEMO_USER_ID, "owner"], ["u-mom", "contributor"], ["u-dad", "viewer"], ...(si % 2 ? ([["u-jake", "contributor"]] as [string, Member["role"]][]) : [])],
    );
    places.push(sp.place);
    sp.albums.forEach((al) => {
      albums.push({ id: al.id, projectId: sp.id, name: al.name, category: al.category, kind: "manual", createdAt: sp.updatedAt });
      const prefix = al.id === "al-s-all" ? "as-s" : `as-${al.id.slice(3)}`;
      const run = addRun({ projectId: sp.id, prefix, photos: al.photos, years: al.years, month: al.id === "al-s-all" ? 6 : undefined, albumIds: [al.id], placeId: sp.place.id, uploaders: [DEMO_USER_ID, "u-mom"] });
      albums.find((a) => a.id === al.id)!.coverAssetId = run[Math.min(2, run.length - 1)].id;
    });
    const firstPhoto = assets.find((a) => a.projectId === sp.id && a.kind === "photo");
    projects.find((p) => p.id === sp.id)!.coverAssetId = firstPhoto?.id;
  });
  // Santorini: dates within the trip, photos only, and a better cover.
  assets
    .filter((a) => a.id.startsWith("as-s-"))
    .forEach((a, i) => {
      a.takenAt = `2024-06-${pad(10 + Math.floor(i / 3))}`;
      a.datePrecision = "exact";
      a.kind = "photo";
      a.durationSec = undefined;
    });
  projects.find((p) => p.id === "p-greece")!.coverAssetId = "as-s-5";
  albums.find((a) => a.id === "al-s-all")!.coverAssetId = "as-s-5";

  // ───────── Stories / books ─────────
  const stories: Story[] = [
    {
      id: "st-santorini",
      projectId: "p-greece",
      albumId: "al-s-all",
      title: "Santorini Adventure",
      subtitle: "A Family Journey",
      step: "plan",
      details: {
        dateLabel: "June 10 – June 20, 2024",
        style: "Modern Classic",
        size: "11 x 8.5 in (Landscape)",
        notes: "A beautiful journey through Santorini — the places we explored, the people we met, and the moments that made it so special.",
      },
      createdAt: "2024-07-01T10:00:00Z",
      updatedAt: "2026-10-15T12:00:00Z",
    },
    {
      id: "st-martin",
      projectId: P,
      albumId: "al-reunions",
      title: "Martin Family Stories",
      subtitle: "A life well lived.",
      step: "plan",
      details: { dateLabel: "1950 – 2024", style: "Heritage", size: "12 x 12 in (Square)" },
      createdAt: "2024-01-12T10:00:00Z",
      updatedAt: "2026-10-02T12:00:00Z",
    },
  ];
  const s = (n: number) => `as-s-${n}`;
  const sectionDefs: [string, string, string, string[]][] = [
    ["The Arrival", "First views, new beginnings", "Our Santorini adventure began with an early morning flight, a lot of excitement, and a dream to see the iconic white buildings and blue domes in person.", [s(1), s(9), s(4), s(14)]],
    ["Coastal Walk", "Cliffside paths and endless views", "Stepping off the main trail, we found quiet paths, whitewashed walls, and views more beautiful than we imagined.", [s(5), s(13), s(16), s(7)]],
    ["City Details", "Small moments, big character", "Blue domes, narrow alleys, charming cafés, and little details that make Santorini so unforgettable.", [s(11), s(12), s(17), s(14)]],
    ["Food & Flavors", "Incredible food, warm people", "From fresh seafood and local wines to cozy tavernas, every meal was a highlight. Santorini tastes like sunshine.", [s(19), s(20), s(22), s(23)]],
    ["Sunsets & Evenings", "Golden hours we’ll never forget", "Each evening brought a new kind of magic — from Oia’s famous sunsets to quiet moments on our terrace.", [s(18), s(26), s(8), s(10)]],
    ["People", "The best part of the journey", "New friends, kind locals, and all of us together. These are the moments that matter most.", [s(21), s(24), s(25), s(27)]],
  ];
  const sections: StorySection[] = sectionDefs.map(([title, subtitle, summary, ids], i) => ({
    id: `sec-${i}`,
    storyId: "st-santorini",
    position: i,
    title,
    subtitle,
    summary,
    layout: (["full_width", "two_column", "grid", "collage", "full_width", "grid"] as const)[i],
    widget: i === 0 ? { type: "weather", settings: { temp: 24, label: "Sunny skies", placeName: "Santorini" } } : i === 1 ? { type: "map", settings: { placeName: "Oia, Santorini", lat: 36.4618, lng: 25.3753, level: "region", detail: "country", showInset: true, parts: { city: "Oia", region: "South Aegean", country: "Greece", countryCode: "GR" } } } : undefined,
    assetIds: ids,
  }));
  sections.push(
    { id: "sec-m-0", storyId: "st-martin", position: 0, title: "Where It All Began", summary: "Grandma and Grandpa, the house in Tyler, and the first summers at the lake.", layout: "full_width", assetIds: ["as-gp-1", "as-gp-2", "as-gp-3"] },
    { id: "sec-m-1", storyId: "st-martin", position: 1, title: "Summers at the Lake", summary: "Cannonballs off the dock and fireworks on the Fourth.", layout: "grid", assetIds: ["as-92-1", "as-92-2", "as-92-3", "as-lake-1"] },
  );

  const uploadLinks: UploadLink[] = [{ id: "ul-1", projectId: P, albumId: `${P}-inbox`, label: "Family upload link", token: "martin-family-uploads", createdAt: "2026-05-01T10:00:00Z", revoked: false }];

  return { users, projects, members, albums, assets, people, places, events, tags, invites: [], uploadLinks, stories, sections, spreads: {} };
}
