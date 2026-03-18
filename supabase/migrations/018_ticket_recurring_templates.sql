DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_recurrence_frequency') THEN
    CREATE TYPE ticket_recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly');
  END IF;
END $$;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS recurring_template_id UUID,
  ADD COLUMN IF NOT EXISTS recurring_instance_date DATE;

CREATE TABLE IF NOT EXISTS ticket_recurring_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gestor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  pedido_por TEXT NOT NULL,
  assunto TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  urgencia INTEGER NOT NULL DEFAULT 1 CHECK (urgencia >= 1 AND urgencia <= 3),
  importancia INTEGER NOT NULL DEFAULT 1 CHECK (importancia >= 1 AND importancia <= 3),
  entrega_tipo delivery_type NOT NULL,
  natureza ticket_nature NOT NULL DEFAULT 'Novo',
  data_esperada DATE,
  data_prevista_conclusao DATE,
  frequency ticket_recurrence_frequency NOT NULL,
  start_date DATE NOT NULL,
  next_run_date DATE NOT NULL,
  end_date DATE,
  last_run_at TIMESTAMPTZ,
  last_created_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recurring_template_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS ticket_recurring_template_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES ticket_recurring_templates(id) ON DELETE CASCADE,
  assignee_bi_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  urgencia INTEGER NOT NULL DEFAULT 1 CHECK (urgencia >= 1 AND urgencia <= 3),
  importancia INTEGER NOT NULL DEFAULT 1 CHECK (importancia >= 1 AND importancia <= 3),
  estado subticket_status NOT NULL DEFAULT 'novo',
  data_inicio DATE,
  data_inicio_planeado DATE,
  data_esperada DATE,
  data_conclusao DATE,
  retrabalhos INTEGER NOT NULL DEFAULT 0 CHECK (retrabalhos >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'tickets_recurring_template_id_fkey'
      AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets
      ADD CONSTRAINT tickets_recurring_template_id_fkey
      FOREIGN KEY (recurring_template_id) REFERENCES ticket_recurring_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_recurring_instance_unique
  ON tickets (recurring_template_id, recurring_instance_date)
  WHERE recurring_template_id IS NOT NULL AND recurring_instance_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_recurring_templates_next_run
  ON ticket_recurring_templates (active, next_run_date);

CREATE INDEX IF NOT EXISTS idx_ticket_recurring_templates_created_by
  ON ticket_recurring_templates (created_by);

CREATE INDEX IF NOT EXISTS idx_ticket_recurring_template_subtasks_template
  ON ticket_recurring_template_subtasks (template_id);

DROP TRIGGER IF EXISTS update_ticket_recurring_templates_updated_at ON ticket_recurring_templates;
CREATE TRIGGER update_ticket_recurring_templates_updated_at
  BEFORE UPDATE ON ticket_recurring_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_recurring_template_subtasks_updated_at ON ticket_recurring_template_subtasks;
CREATE TRIGGER update_ticket_recurring_template_subtasks_updated_at
  BEFORE UPDATE ON ticket_recurring_template_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
