-- Snapshots diários de tickets e subtarefas para análise histórica

-- 1) Tabela de snapshots diários de tickets
CREATE TABLE IF NOT EXISTS ticket_daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    estado ticket_status NOT NULL,
    prioridade INTEGER,
    urgencia INTEGER,
    importancia INTEGER,
    gestor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    retrabalhos_ticket INTEGER NOT NULL DEFAULT 0,
    total_retrabalhos_subtarefas INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ticket_daily_snapshots_unique_per_day UNIQUE (ticket_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_ticket_daily_snapshots_date
    ON ticket_daily_snapshots (snapshot_date);

CREATE INDEX IF NOT EXISTS idx_ticket_daily_snapshots_estado
    ON ticket_daily_snapshots (estado);


-- 2) Tabela de snapshots diários de subtarefas
CREATE TABLE IF NOT EXISTS subticket_daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subticket_id UUID NOT NULL REFERENCES subtickets(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    estado subticket_status NOT NULL,
    prioridade INTEGER,
    urgencia INTEGER,
    importancia INTEGER,
    assignee_bi_id UUID REFERENCES users(id) ON DELETE SET NULL,
    retrabalhos INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT subticket_daily_snapshots_unique_per_day UNIQUE (subticket_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_subticket_daily_snapshots_date
    ON subticket_daily_snapshots (snapshot_date);

CREATE INDEX IF NOT EXISTS idx_subticket_daily_snapshots_estado
    ON subticket_daily_snapshots (estado);

CREATE INDEX IF NOT EXISTS idx_subticket_daily_snapshots_ticket
    ON subticket_daily_snapshots (ticket_id);


-- 3) Função para tirar snapshot diário (tickets + subtarefas)
CREATE OR REPLACE FUNCTION take_daily_ticket_snapshots(p_snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Snapshots de tickets (ex.: apenas não concluídos; ajuste o WHERE conforme necessário)
  INSERT INTO ticket_daily_snapshots (
    ticket_id,
    snapshot_date,
    estado,
    prioridade,
    urgencia,
    importancia,
    gestor_id,
    retrabalhos_ticket,
    total_retrabalhos_subtarefas
  )
  SELECT
    t.id AS ticket_id,
    p_snapshot_date AS snapshot_date,
    t.estado,
    t.prioridade,
    t.urgencia,
    t.importancia,
    t.gestor_id,
    COALESCE(t.retrabalhos_ticket, 0) AS retrabalhos_ticket,
    COALESCE(agg.total_retrabalhos, 0) AS total_retrabalhos_subtarefas
  FROM tickets t
  LEFT JOIN (
    SELECT
      ticket_id,
      SUM(COALESCE(retrabalhos, 0)) AS total_retrabalhos
    FROM subtickets
    GROUP BY ticket_id
  ) agg ON agg.ticket_id = t.id
  WHERE t.estado <> 'concluido'
  ON CONFLICT (ticket_id, snapshot_date) DO UPDATE
  SET
    estado = EXCLUDED.estado,
    prioridade = EXCLUDED.prioridade,
    urgencia = EXCLUDED.urgencia,
    importancia = EXCLUDED.importancia,
    gestor_id = EXCLUDED.gestor_id,
    retrabalhos_ticket = EXCLUDED.retrabalhos_ticket,
    total_retrabalhos_subtarefas = EXCLUDED.total_retrabalhos_subtarefas;


  -- Snapshots de subtarefas (também só não concluídas, ajuste conforme necessário)
  INSERT INTO subticket_daily_snapshots (
    subticket_id,
    ticket_id,
    snapshot_date,
    estado,
    prioridade,
    urgencia,
    importancia,
    assignee_bi_id,
    retrabalhos
  )
  SELECT
    s.id AS subticket_id,
    s.ticket_id,
    p_snapshot_date AS snapshot_date,
    s.estado,
    s.prioridade,
    s.urgencia,
    s.importancia,
    s.assignee_bi_id,
    COALESCE(s.retrabalhos, 0) AS retrabalhos
  FROM subtickets s
  WHERE s.estado <> 'concluido'
  ON CONFLICT (subticket_id, snapshot_date) DO UPDATE
  SET
    estado = EXCLUDED.estado,
    prioridade = EXCLUDED.prioridade,
    urgencia = EXCLUDED.urgencia,
    importancia = EXCLUDED.importancia,
    assignee_bi_id = EXCLUDED.assignee_bi_id,
    retrabalhos = EXCLUDED.retrabalhos;
END;
$$;

-- NOTA:
-- Para agendar esta função diariamente no Supabase, pode:
-- 1) Usar pg_cron (se disponível):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--    SELECT cron.schedule(
--      'daily_ticket_snapshots',
--      '0 23 * * *',
--      $$SELECT take_daily_ticket_snapshots();$$
--    );
--
-- ou
-- 2) Criar uma Scheduled Function no painel do Supabase que execute:
--    SELECT take_daily_ticket_snapshots();


