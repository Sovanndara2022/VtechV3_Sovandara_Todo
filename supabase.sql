Create extension if not exists "pgcrypto";

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  todo text not null check (char_length(trim(todo)) > 0),
  is_completed boolean not null default false,
  created_at_ms bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.todos enable row level security;

drop policy if exists "anon select"  on public.todos;
drop policy if exists "anon insert"  on public.todos;
drop policy if exists "anon update"  on public.todos;
drop policy if exists "anon delete"  on public.todos;

create policy "anon select" on public.todos for select using (true);
create policy "anon insert" on public.todos for insert with check (true);
create policy "anon update" on public.todos for update using (true);
create policy "anon delete" on public.todos for delete using (true);

alter publication supabase_realtime add table public.todos;

-- CRITICAL: make PostgREST see the new table immediately
NOTIFY pgrst, 'reload schema';
