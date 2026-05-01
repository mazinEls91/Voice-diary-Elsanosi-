-- ============================================================
-- Voice Diary — Supabase Schema
-- ============================================================

-- ---- Profiles -----------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view profiles of people who shared with them"
  on public.profiles for select
  using (
    id in (
      select shared_by from public.shared_entries where shared_with = auth.uid()
    )
  );

-- ---- Entries ------------------------------------------------
create table public.entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles on delete cascade,
  title            text not null default 'Untitled entry',
  audio_path       text not null,        -- Supabase Storage path
  transcript       text,
  duration_seconds integer not null default 0,
  synced_at        timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.entries enable row level security;

create policy "Owners can do everything with their entries"
  on public.entries for all using (auth.uid() = user_id);

create policy "Shared users can view entries shared with them"
  on public.entries for select
  using (
    id in (
      select entry_id from public.shared_entries where shared_with = auth.uid()
    )
  );

-- ---- Tags ---------------------------------------------------
create table public.tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  name    text not null,
  unique (user_id, name)
);

create table public.entry_tags (
  entry_id uuid references public.entries on delete cascade,
  tag_id   uuid references public.tags on delete cascade,
  primary key (entry_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;

create policy "Users manage their own tags"
  on public.tags for all using (auth.uid() = user_id);

create policy "Users manage tags on their entries"
  on public.entry_tags for all
  using (entry_id in (select id from public.entries where user_id = auth.uid()));

-- ---- Brainstorm Sessions ------------------------------------
-- Each session is an AI podcast conversation tied to one entry.
create table public.brainstorm_sessions (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid not null references public.entries on delete cascade,
  user_id    uuid not null references public.profiles on delete cascade,
  title      text not null default 'Brainstorm',
  created_at timestamptz default now()
);

create table public.brainstorm_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.brainstorm_sessions on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,             -- transcript text
  audio_path text,                      -- set for user voice turns
  created_at timestamptz default now()
);

alter table public.brainstorm_sessions enable row level security;
alter table public.brainstorm_messages enable row level security;

create policy "Users manage their own brainstorm sessions"
  on public.brainstorm_sessions for all using (auth.uid() = user_id);

create policy "Users manage messages in their sessions"
  on public.brainstorm_messages for all
  using (
    session_id in (
      select id from public.brainstorm_sessions where user_id = auth.uid()
    )
  );

-- ---- Sharing ------------------------------------------------
create table public.shared_entries (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references public.entries on delete cascade,
  shared_by   uuid not null references public.profiles on delete cascade,
  shared_with uuid not null references public.profiles on delete cascade,
  can_comment boolean not null default false,
  created_at  timestamptz default now(),
  unique (entry_id, shared_with)
);

alter table public.shared_entries enable row level security;

create policy "Owner can share their entries"
  on public.shared_entries for insert
  with check (shared_by = auth.uid() and entry_id in (
    select id from public.entries where user_id = auth.uid()
  ));

create policy "Owner and recipient can see the share record"
  on public.shared_entries for select
  using (shared_by = auth.uid() or shared_with = auth.uid());

create policy "Owner can revoke sharing"
  on public.shared_entries for delete using (shared_by = auth.uid());

-- ---- Storage buckets (run in Supabase dashboard) -----------
-- create storage bucket 'audio-entries' (private)
-- create storage bucket 'brainstorm-audio' (private)
