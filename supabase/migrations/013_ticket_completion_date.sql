-- Add completion date to tickets
alter table public.tickets
  add column if not exists data_conclusao timestamptz null;
