-- Add objetivo column to existing tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS objetivo TEXT;

-- Update existing tickets with a default objetivo value if they don't have one
UPDATE tickets 
SET objetivo = 'Objetivo não especificado' 
WHERE objetivo IS NULL OR objetivo = '';

-- Make objetivo column NOT NULL after updating existing records
ALTER TABLE tickets ALTER COLUMN objetivo SET NOT NULL;

-- Add a check constraint to ensure objetivo is not empty
ALTER TABLE tickets ADD CONSTRAINT check_objetivo_not_empty 
CHECK (LENGTH(TRIM(objetivo)) > 0);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
