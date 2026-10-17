-- Revories — initial schema
-- Hierarchy: Project (umbrella archive) → Album (collection) → Assets.
-- People / Places / Events / Tags are cross-linked metadata scoped to a project.
-- Stories (books) are optional curated outputs built from project/album content.
-- Media bytes live in Cloudflare R2; rows here only hold storage keys.

create extension if not exists "pgcrypto";

-- ───────────────────────────── Enums ─────────────────────────────

-- Plain-English roles, ordered by power. "owner" is implicit for the creator.
create type member_role as enum ('viewer', 'contributor', 'organizer', 'editor', 'owner');
create type asset_kind as enum ('photo', 'video', 'document', 'artifact');
create type asset_status as enum ('needs_details', 'tagged', 'reviewed');
create type date_precision as enum ('exact', 'month', 'year', 'decade', 'unknown');
create type place_precision as enum ('exact', 'approximate');
create type album_kind as enum ('manual', 'smart', 'inbox');
create type story_step as enum ('plan', 'design', 'review', 'publish');

-- ───────────────────────────── Profiles ─────────────────────────────

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────────── Projects & membership ─────────────────────────────

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete restrict,
  name text not null,
  tagline text,
  description text,
  cover_asset_id uuid,
  -- contribution rules, privacy, etc. Progressive disclosure: start empty.
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_members (
  project_id uuid not null references projects on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role member_role not null,
  invited_by uuid references profiles,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table albums (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  description text,
  kind album_kind not null default 'manual',
  -- smart album rules, e.g. {"year": 1992} or {"tag": "Lake House"}
  rules jsonb,
  cover_asset_id uuid,
  position int not null default 0,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);
create unique index one_inbox_per_project on albums (project_id) where kind = 'inbox';

-- Album-scoped access for people who should only see one album.
create table album_members (
  album_id uuid not null references albums on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role member_role not null,
  created_at timestamptz not null default now(),
  primary key (album_id, user_id)
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  album_id uuid references albums on delete cascade,
  email text not null,
  role member_role not null check (role <> 'owner'),
  token text not null unique default encode(gen_random_bytes(18), 'base64url'),
  invited_by uuid not null references profiles,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Upload-only links for relatives who just need to contribute.
create table upload_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  album_id uuid references albums on delete set null,
  label text not null default 'Family upload link',
  token text not null unique default encode(gen_random_bytes(18), 'base64url'),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── Metadata entities ─────────────────────────────

create table places (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,              -- "Martin Lake House"
  address text,                    -- "Toledo Bend, Texas"
  lat double precision,
  lng double precision,
  precision place_precision not null default 'approximate',
  is_saved boolean not null default true,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,              -- "Memorial Day (Texas)"
  description text,
  recurring boolean not null default false,
  parent_event_id uuid references events on delete set null, -- "Memorial Day 1992" → "Memorial Day (Texas)"
  start_date date,
  end_date date,
  place_id uuid references places on delete set null,
  created_at timestamptz not null default now()
);

create table people (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  branch text,                     -- family branch, e.g. "LaDon Martin Branch"
  birth_year int,
  notes text,
  avatar_asset_id uuid,
  merged_into uuid references people on delete set null,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  color text,
  unique (project_id, name)
);

-- ───────────────────────────── Assets ─────────────────────────────

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  uploaded_by uuid references profiles on delete set null,
  upload_link_id uuid references upload_links on delete set null,
  contributor_name text,           -- for upload-link contributors without accounts
  kind asset_kind not null default 'photo',
  storage_key text not null,       -- R2 object key
  thumb_key text,
  filename text not null,
  mime_type text,
  byte_size bigint,
  width int,
  height int,
  checksum text,                   -- for duplicate detection
  taken_at date,
  date_precision date_precision not null default 'unknown',
  place_id uuid references places on delete set null,
  event_id uuid references events on delete set null,
  caption text,
  status asset_status not null default 'needs_details',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assets_project_idx on assets (project_id, created_at desc);
create index assets_status_idx on assets (project_id, status);
create index assets_checksum_idx on assets (project_id, checksum);

alter table projects add constraint projects_cover_fk foreign key (cover_asset_id) references assets on delete set null;
alter table albums add constraint albums_cover_fk foreign key (cover_asset_id) references assets on delete set null;
alter table people add constraint people_avatar_fk foreign key (avatar_asset_id) references assets on delete set null;

-- Items can live in many albums without leaving the project archive.
create table album_assets (
  album_id uuid not null references albums on delete cascade,
  asset_id uuid not null references assets on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (album_id, asset_id)
);

create table asset_people (
  asset_id uuid not null references assets on delete cascade,
  person_id uuid not null references people on delete cascade,
  face_box jsonb,                  -- {x,y,w,h} normalized 0–1
  confirmed boolean not null default true,
  primary key (asset_id, person_id)
);

create table asset_tags (
  asset_id uuid not null references assets on delete cascade,
  tag_id uuid not null references tags on delete cascade,
  primary key (asset_id, tag_id)
);

-- ───────────────────────────── Stories / Books (optional) ─────────────────────────────

create table stories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  album_id uuid references albums on delete set null,
  title text not null,
  subtitle text,
  step story_step not null default 'plan',
  settings jsonb not null default '{}',
  created_by uuid references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table story_sections (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories on delete cascade,
  position int not null default 0,
  title text not null,
  subtitle text,
  summary text,
  layout text not null default 'full_width',
  widget jsonb,                    -- {type: "weather"|"map"|"quote"|..., settings: {...}}
  created_at timestamptz not null default now()
);

create table section_assets (
  section_id uuid not null references story_sections on delete cascade,
  asset_id uuid not null references assets on delete cascade,
  position int not null default 0,
  primary key (section_id, asset_id)
);

create table story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references stories on delete cascade,
  section_id uuid references story_sections on delete set null,
  position int not null default 0,
  elements jsonb not null default '[]', -- positioned elements on the page
  notes text
);

-- ───────────────────────────── Access helpers ─────────────────────────────

create or replace function role_rank(r member_role) returns int
language sql immutable as $$
  select case r when 'viewer' then 1 when 'contributor' then 2 when 'organizer' then 3
                when 'editor' then 4 when 'owner' then 5 end
$$;

-- Caller's role on a project (null if none). SECURITY DEFINER avoids RLS recursion.
create or replace function project_role(p uuid) returns member_role
language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from projects where id = p and owner_id = auth.uid()) then 'owner'::member_role
              else (select role from project_members where project_id = p and user_id = auth.uid()) end
$$;

create or replace function has_project_role(p uuid, min member_role) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(role_rank(project_role(p)) >= role_rank(min), false)
$$;

-- Album-only members can see the album and its assets.
create or replace function can_view_album(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from albums al where al.id = a and has_project_role(al.project_id, 'viewer'))
      or exists (select 1 from album_members where album_id = a and user_id = auth.uid())
$$;

create or replace function can_view_asset(x uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from assets s where s.id = x and has_project_role(s.project_id, 'viewer'))
      or exists (select 1 from album_assets aa join album_members am on am.album_id = aa.album_id
                 where aa.asset_id = x and am.user_id = auth.uid())
$$;

-- Owner becomes a member row too, and every project gets an Inbox album.
create or replace function handle_new_project() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into project_members (project_id, user_id, role) values (new.id, new.owner_id, 'owner');
  insert into albums (project_id, name, description, kind, created_by)
  values (new.id, 'Inbox', 'New uploads land here until they are organized.', 'inbox', new.owner_id);
  return new;
end $$;

create trigger on_project_created after insert on projects
  for each row execute function handle_new_project();

-- ───────────────────────────── Row level security ─────────────────────────────

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table albums enable row level security;
alter table album_members enable row level security;
alter table invites enable row level security;
alter table upload_links enable row level security;
alter table places enable row level security;
alter table events enable row level security;
alter table people enable row level security;
alter table tags enable row level security;
alter table assets enable row level security;
alter table album_assets enable row level security;
alter table asset_people enable row level security;
alter table asset_tags enable row level security;
alter table stories enable row level security;
alter table story_sections enable row level security;
alter table section_assets enable row level security;
alter table story_pages enable row level security;

-- Profiles: anyone signed in can read names/avatars (needed for contributor lists).
create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles self update" on profiles for update to authenticated using (id = auth.uid());

create policy "projects read" on projects for select to authenticated
  using (has_project_role(id, 'viewer'));
create policy "projects create" on projects for insert to authenticated
  with check (owner_id = auth.uid());
create policy "projects update" on projects for update to authenticated
  using (has_project_role(id, 'editor'));
create policy "projects delete" on projects for delete to authenticated
  using (owner_id = auth.uid());

create policy "members read" on project_members for select to authenticated
  using (has_project_role(project_id, 'viewer'));
create policy "members manage" on project_members for all to authenticated
  using (has_project_role(project_id, 'editor')) with check (has_project_role(project_id, 'editor') and role <> 'owner');

create policy "albums read" on albums for select to authenticated using (can_view_album(id));
create policy "albums write" on albums for all to authenticated
  using (has_project_role(project_id, 'organizer')) with check (has_project_role(project_id, 'organizer'));

create policy "album members read" on album_members for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from albums a where a.id = album_id and has_project_role(a.project_id, 'viewer')));
create policy "album members manage" on album_members for all to authenticated
  using (exists (select 1 from albums a where a.id = album_id and has_project_role(a.project_id, 'editor')))
  with check (exists (select 1 from albums a where a.id = album_id and has_project_role(a.project_id, 'editor')));

create policy "invites manage" on invites for all to authenticated
  using (has_project_role(project_id, 'editor')) with check (has_project_role(project_id, 'editor') and invited_by = auth.uid());

create policy "upload links manage" on upload_links for all to authenticated
  using (has_project_role(project_id, 'editor')) with check (has_project_role(project_id, 'editor') and created_by = auth.uid());

-- Project-scoped metadata: viewers read, organizers write.
do $$
declare t text;
begin
  foreach t in array array['places', 'events', 'people', 'tags', 'stories'] loop
    execute format('create policy "%1$s read" on %1$I for select to authenticated using (has_project_role(project_id, ''viewer''))', t);
    execute format('create policy "%1$s write" on %1$I for all to authenticated using (has_project_role(project_id, ''organizer'')) with check (has_project_role(project_id, ''organizer''))', t);
  end loop;
end $$;

create policy "assets read" on assets for select to authenticated using (can_view_asset(id));
create policy "assets insert" on assets for insert to authenticated
  with check (has_project_role(project_id, 'contributor') and uploaded_by = auth.uid());
create policy "assets update" on assets for update to authenticated
  using (has_project_role(project_id, 'organizer'));
create policy "assets delete" on assets for delete to authenticated
  using (has_project_role(project_id, 'editor') or (uploaded_by = auth.uid() and status = 'needs_details'));

create policy "album assets read" on album_assets for select to authenticated using (can_view_album(album_id));
create policy "album assets write" on album_assets for all to authenticated
  using (exists (select 1 from albums a where a.id = album_id and has_project_role(a.project_id, 'contributor')))
  with check (exists (select 1 from albums a where a.id = album_id and has_project_role(a.project_id, 'contributor')));

create policy "asset people read" on asset_people for select to authenticated using (can_view_asset(asset_id));
create policy "asset people write" on asset_people for all to authenticated
  using (exists (select 1 from assets s where s.id = asset_id and has_project_role(s.project_id, 'organizer')))
  with check (exists (select 1 from assets s where s.id = asset_id and has_project_role(s.project_id, 'organizer')));

create policy "asset tags read" on asset_tags for select to authenticated using (can_view_asset(asset_id));
create policy "asset tags write" on asset_tags for all to authenticated
  using (exists (select 1 from assets s where s.id = asset_id and has_project_role(s.project_id, 'organizer')))
  with check (exists (select 1 from assets s where s.id = asset_id and has_project_role(s.project_id, 'organizer')));

-- Story children inherit access from their story's project; editors build books.
create or replace function story_project(s uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select project_id from stories where id = s
$$;

create policy "sections read" on story_sections for select to authenticated using (has_project_role(story_project(story_id), 'viewer'));
create policy "sections write" on story_sections for all to authenticated
  using (has_project_role(story_project(story_id), 'editor')) with check (has_project_role(story_project(story_id), 'editor'));
create policy "pages read" on story_pages for select to authenticated using (has_project_role(story_project(story_id), 'viewer'));
create policy "pages write" on story_pages for all to authenticated
  using (has_project_role(story_project(story_id), 'editor')) with check (has_project_role(story_project(story_id), 'editor'));
create policy "section assets read" on section_assets for select to authenticated
  using (exists (select 1 from story_sections ss where ss.id = section_id and has_project_role(story_project(ss.story_id), 'viewer')));
create policy "section assets write" on section_assets for all to authenticated
  using (exists (select 1 from story_sections ss where ss.id = section_id and has_project_role(story_project(ss.story_id), 'editor')))
  with check (exists (select 1 from story_sections ss where ss.id = section_id and has_project_role(story_project(ss.story_id), 'editor')));
