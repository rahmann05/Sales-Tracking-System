-- Infrastructure only: transient Socket.IO packets, never business evidence.
CREATE TABLE IF NOT EXISTS socket_io_attachments (
 id bigserial PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT NOW(),
 payload bytea NOT NULL
);
CREATE INDEX IF NOT EXISTS socket_io_attachments_created_at_idx ON socket_io_attachments(created_at);
