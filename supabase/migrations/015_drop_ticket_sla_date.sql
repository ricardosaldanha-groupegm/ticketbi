-- Remove SLA date from tickets
alter table public.tickets
  drop column if exists sla_date;
