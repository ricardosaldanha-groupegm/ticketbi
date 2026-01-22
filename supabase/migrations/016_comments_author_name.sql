-- Add author_name column to comments table
ALTER TABLE comments
ADD COLUMN author_name TEXT;

-- Populate author_name for existing comments
UPDATE comments c
SET author_name = u.name
FROM users u
WHERE c.author_id = u.id;

-- Create function to automatically set author_name on insert
CREATE OR REPLACE FUNCTION set_comment_author_name()
RETURNS TRIGGER AS $$
BEGIN
  SELECT name INTO NEW.author_name
  FROM users
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set author_name when a comment is inserted
CREATE TRIGGER trigger_set_comment_author_name
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_author_name();

-- Create index on author_name for potential queries
CREATE INDEX IF NOT EXISTS idx_comments_author_name ON comments(author_name);
