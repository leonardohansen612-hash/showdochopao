create extension if not exists pgcrypto;

create table if not exists public.questions (
  id bigint primary key,
  difficulty smallint not null check (difficulty between 1 and 15),
  category text not null,
  prompt text not null,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  correct_answer text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null default ('Show do Chopão ' || to_char(now(), 'DD/MM/YYYY HH24:MI')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.used_questions (
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete cascade,
  player_no integer,
  used_at timestamptz not null default now(),
  primary key (session_id, question_id)
);

create index if not exists idx_questions_difficulty_active
  on public.questions(difficulty, active);

create index if not exists idx_used_questions_session
  on public.used_questions(session_id);

alter table public.questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.used_questions enable row level security;

drop policy if exists "public read active questions" on public.questions;
create policy "public read active questions"
on public.questions for select
to anon
using (active = true);

drop policy if exists "public create sessions" on public.game_sessions;
create policy "public create sessions"
on public.game_sessions for insert
to anon
with check (true);

drop policy if exists "public read sessions" on public.game_sessions;
create policy "public read sessions"
on public.game_sessions for select
to anon
using (true);

drop policy if exists "public update sessions" on public.game_sessions;
create policy "public update sessions"
on public.game_sessions for update
to anon
using (true)
with check (true);

drop policy if exists "public read used questions" on public.used_questions;
create policy "public read used questions"
on public.used_questions for select
to anon
using (true);

drop policy if exists "public mark used questions" on public.used_questions;
create policy "public mark used questions"
on public.used_questions for insert
to anon
with check (true);
