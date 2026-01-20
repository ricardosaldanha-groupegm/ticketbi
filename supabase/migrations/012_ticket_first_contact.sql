-- Add first contact date to tickets
alter table public.tickets
  add column if not exists data_primeiro_contacto timestamptz null;

-- Add planned completion date (triggers first contact)
alter table public.tickets
  add column if not exists data_prevista_conclusao timestamptz null;
