-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('requester', 'bi', 'admin');
CREATE TYPE ticket_status AS ENUM ('novo', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado');
CREATE TYPE subticket_status AS ENUM ('novo', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'requester',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gestor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    estado ticket_status NOT NULL DEFAULT 'novo',
    pedido_por TEXT NOT NULL,
    data_pedido TIMESTAMPTZ DEFAULT NOW(),
    assunto TEXT NOT NULL,
    descricao TEXT,
    urgencia INTEGER CHECK (urgencia >= 1 AND urgencia <= 5) DEFAULT 1,
    importancia INTEGER CHECK (importancia >= 1 AND importancia <= 5) DEFAULT 1,
    prioridade INTEGER GENERATED ALWAYS AS (urgencia * importancia) STORED,
    data_esperada DATE,
    sla_date DATE,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtickets table
CREATE TABLE subtickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    assignee_bi_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    estado subticket_status NOT NULL DEFAULT 'novo',
    urgencia INTEGER CHECK (urgencia >= 1 AND urgencia <= 5) DEFAULT 1,
    importancia INTEGER CHECK (importancia >= 1 AND importancia <= 5) DEFAULT 1,
    prioridade INTEGER GENERATED ALWAYS AS (urgencia * importancia) STORED,
    data_esperada DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    subticket_id UUID REFERENCES subtickets(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT attachment_belongs_to_ticket_or_subticket CHECK (
        (ticket_id IS NOT NULL AND subticket_id IS NULL) OR 
        (ticket_id IS NULL AND subticket_id IS NOT NULL)
    )
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    subticket_id UUID REFERENCES subtickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comment_belongs_to_ticket_or_subticket CHECK (
        (ticket_id IS NOT NULL AND subticket_id IS NULL) OR 
        (ticket_id IS NULL AND subticket_id IS NOT NULL)
    )
);

-- Audit logs table (optional)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity TEXT NOT NULL CHECK (entity IN ('ticket', 'subticket')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_gestor_id ON tickets(gestor_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

CREATE INDEX idx_subtickets_ticket_id ON subtickets(ticket_id);
CREATE INDEX idx_subtickets_assignee_bi_id ON subtickets(assignee_bi_id);
CREATE INDEX idx_subtickets_estado ON subtickets(estado);

CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_subticket_id ON attachments(subticket_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_comments_subticket_id ON comments(subticket_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtickets_updated_at BEFORE UPDATE ON subtickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
