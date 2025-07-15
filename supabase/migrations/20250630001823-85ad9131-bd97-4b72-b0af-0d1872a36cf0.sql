
-- Configurar REPLICA IDENTITY FULL para capturar dados completos das mudanças
ALTER TABLE public.user_tokens REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação supabase_realtime para ativar funcionalidade real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tokens;
