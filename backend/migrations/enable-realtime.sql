-- Habilitar Supabase Realtime nas tabelas de chat
-- Rodar no Supabase SQL Editor (DEPOIS de chat-tables.sql)
-- Permite que o frontend receba INSERT em tempo real via websocket

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
