-- Add date fields to subtickets
ALTER TABLE subtickets
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_conclusao DATE;

-- Optional: you may add indexes later if filtering by these dates
-- CREATE INDEX IF NOT EXISTS idx_subtickets_data_inicio ON subtickets(data_inicio);
-- CREATE INDEX IF NOT EXISTS idx_subtickets_data_conclusao ON subtickets(data_conclusao);

