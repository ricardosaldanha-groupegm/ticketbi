-- Add planned start date to subtickets
ALTER TABLE subtickets
  ADD COLUMN IF NOT EXISTS data_inicio_planeado DATE;

