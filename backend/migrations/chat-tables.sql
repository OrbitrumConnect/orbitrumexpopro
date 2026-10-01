-- Chat Sessions: conversas diretas entre cliente e profissional
-- Roda no painel Supabase > SQL Editor
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  professional_id INTEGER NOT NULL,
  professional_name TEXT NOT NULL,
  service_type TEXT,
  token_cost INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Chat Messages: mensagens individuais de cada conversa
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Index para busca rapida por chat_id
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);

-- Index para busca por usuario (cliente ou profissional)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_client ON chat_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_professional ON chat_sessions(professional_id);

-- RLS: habilitar Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politica: todos autenticados podem ler/escrever (o backend valida acesso)
CREATE POLICY "chat_sessions_all" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chat_messages_all" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
