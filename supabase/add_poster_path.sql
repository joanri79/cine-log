-- Add poster_path to contenidos table
ALTER TABLE contenidos ADD COLUMN IF NOT EXISTS poster_path TEXT;
