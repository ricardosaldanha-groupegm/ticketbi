-- Add start date to tickets
alter table public.tickets
  add column if not exists data_inicio timestamptz null;
