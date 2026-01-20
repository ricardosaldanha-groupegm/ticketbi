-- Descrições (comments) das colunas da tabela tickets
-- Executar no Supabase SQL Editor

comment on column public.tickets.id is 'Identificador único do ticket.';
comment on column public.tickets.created_by is 'Utilizador que criou o ticket (FK users.id).';
comment on column public.tickets.gestor_id is 'Gestor BI atribuído ao ticket (FK users.id).';
comment on column public.tickets.estado is 'Estado atual do ticket.';
comment on column public.tickets.pedido_por is 'Nome do utilizador que fez o pedido.';
comment on column public.tickets.data_pedido is 'Data em que o pedido foi registado.';
comment on column public.tickets.assunto is 'Assunto/título do ticket.';
comment on column public.tickets.descricao is 'Descrição detalhada do pedido.';
comment on column public.tickets.objetivo is 'Objetivo do pedido (como será utilizada a informação).';
comment on column public.tickets.urgencia is 'Urgência do pedido (1-3).';
comment on column public.tickets.importancia is 'Importância do pedido (1-3).';
comment on column public.tickets.prioridade is 'Prioridade calculada (urgencia x importancia).';
comment on column public.tickets.data_esperada is 'Data esperada para conclusão (informativa).';
comment on column public.tickets.data_prevista_conclusao is 'Data prevista de conclusão (definida pelo BI).';
comment on column public.tickets.data_primeiro_contacto is 'Data do primeiro contacto do BI com o pedido.';
comment on column public.tickets.data_inicio is 'Data de início do trabalho no ticket.';
comment on column public.tickets.data_conclusao is 'Data de conclusão do ticket.';
comment on column public.tickets.entrega_tipo is 'Tipo de entrega (BI, PHC, Salesforce, etc.).';
comment on column public.tickets.natureza is 'Natureza do ticket (Novo, Correção, Retrabalho, etc.).';
comment on column public.tickets.retrabalhos_ticket is 'Número de retrabalhos registados no ticket.';
comment on column public.tickets.internal_notes is 'Notas internas (visíveis para BI/Admin).';
comment on column public.tickets.created_at is 'Data de criação do registo.';
comment on column public.tickets.updated_at is 'Data da última atualização do registo.';
