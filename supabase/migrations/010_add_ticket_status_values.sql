-- Add new ticket_status enum values: 'Aguardando 3ºs' and 'Standby'
DO $$
BEGIN
  BEGIN
    ALTER TYPE ticket_status ADD VALUE 'Aguardando 3ºs';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER TYPE ticket_status ADD VALUE 'Standby';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END
$$;

