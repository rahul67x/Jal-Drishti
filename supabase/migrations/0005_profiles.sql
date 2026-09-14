-- ===========================================================================
-- 0005_profiles.sql — user accounts and roles
-- ---------------------------------------------------------------------------
-- Supabase keeps its own auth.users table, which we cannot extend directly.
-- The standard pattern is a public.profiles table with the same id, populated
-- by a trigger whenever someone signs up.
--
-- Roles drive every write policy in migration 0007:
--   viewer  can read (this is also what anonymous visitors get)
--   editor  can upload images, write insights, generate reports
--   admin   can additionally create and delete sites
--
-- Decision on record: viewing is public, so judges never need an account.
-- Only editing requires a login.
-- ===========================================================================

create type public.user_role as enum ('viewer', 'editor', 'admin');

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_url   text,
  role         public.user_role not null default 'viewer',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table  public.profiles is
  'One row per authenticated user, mirroring auth.users and carrying their role.';
comment on column public.profiles.role is
  'viewer reads, editor manages content, admin manages sites.';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile on signup.
-- ---------------------------------------------------------------------------
-- New users default to 'viewer'. Promoting someone to editor or admin is a
-- deliberate manual step in the Supabase dashboard — a self-service signup must
-- never be able to grant itself write access.
--
-- GitHub OAuth puts the display name under different metadata keys depending on
-- the provider, so we try the common ones in order.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      new.email
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers used by the RLS policies in 0007.
-- ---------------------------------------------------------------------------
-- These are security definer so they can read profiles without the caller
-- needing their own select policy on it. search_path is pinned to defeat
-- search-path hijacking, which is the standard footgun with definer functions.
-- ---------------------------------------------------------------------------
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('editor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

comment on function public.is_editor() is
  'True when the current user may manage site content. Used by RLS write policies.';
comment on function public.is_admin() is
  'True when the current user may create or delete sites.';
