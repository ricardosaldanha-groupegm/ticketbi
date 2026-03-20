alter table public.tickets
  add column if not exists duracao_prevista integer null,
  add column if not exists data_inicio_planeada date null;

alter table public.tickets
  drop constraint if exists tickets_duracao_prevista_positive;

alter table public.tickets
  add constraint tickets_duracao_prevista_positive
  check (duracao_prevista is null or duracao_prevista > 0);
