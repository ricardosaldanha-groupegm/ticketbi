-- Simple script to add objetivo column to existing tickets table

-- Add objetivo column
ALTER TABLE tickets ADD COLUMN objetivo TEXT;

-- Set default value for existing records
UPDATE tickets SET objetivo = 'Objetivo não especificado' WHERE objetivo IS NULL;

-- Make the column NOT NULL
ALTER TABLE tickets ALTER COLUMN objetivo SET NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' AND column_name = 'objetivo';
