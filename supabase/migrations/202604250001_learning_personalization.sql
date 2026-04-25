-- Learning personalization v1: goals, deterministic recommendations, tutor memory.

create extension if not exists pgcrypto;

create table if not exists public.learning_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    target_role text not null,
    skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
    focus_areas text[] not null default '{}',
    current_skills text[] not null default '{}',
    hours_per_week integer not null check (hours_per_week between 1 and 60),
    timeline_months integer not null check (timeline_months between 1 and 24),
    preferred_language text not null default 'vi' check (preferred_language in ('vi', 'en')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id)
);

create table if not exists public.learning_recommendations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    target_type text not null check (target_type in ('course', 'roadmap', 'lesson')),
    target_id text not null,
    title text not null,
    score integer not null check (score between 0 and 100),
    reason text not null,
    source text not null,
    status text not null default 'active' check (status in ('active', 'dismissed', 'completed')),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, target_type, target_id)
);

create table if not exists public.ai_tutor_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    course_id text,
    lesson_id text,
    title text,
    memory_summary text not null default '',
    suggested_next_actions text[] not null default '{}',
    last_interaction_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_learning_recommendations_user_status_score
    on public.learning_recommendations (user_id, status, score desc, updated_at desc);

create index if not exists idx_ai_tutor_sessions_user_last_interaction
    on public.ai_tutor_sessions (user_id, last_interaction_at desc);

create or replace function public.set_learning_personalization_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_learning_goals_updated_at on public.learning_goals;
create trigger trg_learning_goals_updated_at
before update on public.learning_goals
for each row execute function public.set_learning_personalization_updated_at();

drop trigger if exists trg_learning_recommendations_updated_at on public.learning_recommendations;
create trigger trg_learning_recommendations_updated_at
before update on public.learning_recommendations
for each row execute function public.set_learning_personalization_updated_at();

drop trigger if exists trg_ai_tutor_sessions_updated_at on public.ai_tutor_sessions;
create trigger trg_ai_tutor_sessions_updated_at
before update on public.ai_tutor_sessions
for each row execute function public.set_learning_personalization_updated_at();

alter table public.learning_goals enable row level security;
alter table public.learning_recommendations enable row level security;
alter table public.ai_tutor_sessions enable row level security;
