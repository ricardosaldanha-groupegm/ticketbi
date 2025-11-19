-- Add enums and columns for ticket classification
DO $$
BEGIN
  -- Create enum for delivery type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_type') THEN
    CREATE TYPE delivery_type AS ENUM (
      'BI',
      'PHC',
      'Salesforce',
      'Automação',
      'Suporte',
      'Dados/Análises',
      'Interno'
    );
  END IF;

  -- Create enum for ticket nature if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_nature') THEN
    CREATE TYPE ticket_nature AS ENUM (
      'Novo',
      'Correção',
      'Retrabalho',
      'Esclarecimento',
      'Ajuste',
      'Suporte',
      'Reunião/Discussão',
      'Interno'
    );
  END IF;
END $$;

-- Add columns to tickets if they do not exist
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS entrega_tipo delivery_type NOT NULL DEFAULT 'Interno',
  ADD COLUMN IF NOT EXISTS natureza ticket_nature NOT NULL DEFAULT 'Novo';

