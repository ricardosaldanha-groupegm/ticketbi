-- Create tickets table with all required fields including objetivo
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_por VARCHAR(255) NOT NULL,
  assunto VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  objetivo TEXT NOT NULL,
  urgencia INTEGER NOT NULL CHECK (urgencia >= 1 AND urgencia <= 5),
  importancia INTEGER NOT NULL CHECK (importancia >= 1 AND importancia <= 5),
  data_esperada DATE,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente', 'em_analise', 'em_curso', 'em_validacao', 'concluido', 'rejeitado', 'bloqueado')),
  gestor_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_gestor_id ON tickets(gestor_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Insert some sample tickets for testing
INSERT INTO tickets (pedido_por, assunto, descricao, objetivo, urgencia, importancia, data_esperada, estado) VALUES
('Ricardo Saldanha', 'Relatório de Vendas Q3', 'Preciso de um relatório detalhado das vendas do terceiro trimestre com análise por região e produto.', 'O objetivo é apresentar os resultados do Q3 na reunião de direção e identificar tendências para o planeamento do Q4.', 3, 4, '2025-10-15', 'pendente'),
('Jonh Dow', 'Dashboard de KPIs', 'Criar um dashboard interativo para monitorizar os KPIs principais da empresa em tempo real.', 'O dashboard será usado diariamente pela equipa de gestão para tomar decisões operacionais rápidas.', 4, 5, '2025-10-20', 'em_analise'),
('Jonh Dow 1', 'Análise de Clientes', 'Análise de comportamento de clientes para identificar padrões de compra e oportunidades de upselling.', 'Esta análise vai ajudar a equipa de marketing a criar campanhas mais direcionadas e aumentar a conversão.', 2, 3, '2025-10-25', 'pendente');
