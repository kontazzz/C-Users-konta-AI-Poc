-- Pet Food Checker アプリ専用テーブル(Supabase / PostgreSQL)。
-- 既存の dog_food_db(SQLite: schema.sql / seed_reference.sql)には手を加えません。
-- Supabase ダッシュボードの SQL Editor でこのファイルを実行してください。

create extension if not exists pgcrypto;

-- 犬プロフィール(ユーザーごと、同名は上書き)
create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  age_years numeric,
  weight_kg numeric,
  breed text,
  life_stage text check (life_stage in ('puppy', 'adult', 'senior')),
  allergies text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- 診断履歴
create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dog_id uuid references public.dogs (id) on delete set null,
  dog_name text,
  product_id integer,
  product_name text,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_diagnoses_user_created
  on public.diagnoses (user_id, created_at desc);

-- RLS: 本人の行だけ読み書き可能
alter table public.dogs enable row level security;
alter table public.diagnoses enable row level security;

drop policy if exists "dogs_own_rows" on public.dogs;
create policy "dogs_own_rows" on public.dogs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "diagnoses_own_rows" on public.diagnoses;
create policy "diagnoses_own_rows" on public.diagnoses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
