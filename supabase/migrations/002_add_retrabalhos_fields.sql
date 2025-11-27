-- Add retrabalhos fields to tickets and subtickets
DO $$
BEGIN
  -- Add retrabalhos_ticket to tickets if it doesn't exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'tickets' AND column_name = 'retrabalhos_ticket'
    ) THEN
      ALTER TABLE tickets
        ADD COLUMN retrabalhos_ticket INTEGER NOT NULL DEFAULT 0;
      RAISE NOTICE 'Added retrabalhos_ticket column to tickets table';
    END IF;
  END IF;

  -- Add retrabalhos to subtickets if it doesn't exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subtickets') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'subtickets' AND column_name = 'retrabalhos'
    ) THEN
      ALTER TABLE subtickets
        ADD COLUMN retrabalhos INTEGER NOT NULL DEFAULT 0;
      RAISE NOTICE 'Added retrabalhos column to subtickets table';
    END IF;
  END IF;
END $$;


