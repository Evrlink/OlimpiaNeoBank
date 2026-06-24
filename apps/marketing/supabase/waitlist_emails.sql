-- Olimpia marketing waitlist
-- Run in Supabase Dashboard → SQL Editor (new project or existing project).

create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'marketing_modal',
  created_at timestamptz not null default now(),
  constraint waitlist_emails_email_unique unique (email)
);

create index if not exists waitlist_emails_created_at_idx
  on public.waitlist_emails (created_at desc);

alter table public.waitlist_emails enable row level security;

-- Anonymous site visitors may INSERT only (no read/update/delete).
drop policy if exists "Allow anonymous waitlist signups" on public.waitlist_emails;
create policy "Allow anonymous waitlist signups"
  on public.waitlist_emails
  for insert
  to anon
  with check (
    email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    and char_length(email) <= 255
    and source is not null
    and char_length(source) <= 100
  );

-- View/export signups in Supabase Dashboard → Table Editor (service role / dashboard auth).
-- Do not add SELECT policies for anon.
