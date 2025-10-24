-- Create table for ticket interested users (watchers)
create table if not exists public.ticket_watchers (
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (ticket_id, user_id)
);

-- Helpful indexes
create index if not exists idx_ticket_watchers_user on public.ticket_watchers(user_id);
create index if not exists idx_ticket_watchers_ticket on public.ticket_watchers(ticket_id);

