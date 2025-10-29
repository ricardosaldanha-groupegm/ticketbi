-- Comment attachments junction table to link attachments to comments
CREATE TABLE IF NOT EXISTS comment_attachments (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, attachment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_attachment_id ON comment_attachments(attachment_id);

