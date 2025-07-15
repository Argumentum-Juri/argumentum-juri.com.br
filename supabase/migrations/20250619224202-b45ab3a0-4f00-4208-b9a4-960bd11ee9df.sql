
-- Remove a versão antiga da função se existir
DROP FUNCTION IF EXISTS public.delete_user_data(uuid);

-- Recria a função com parâmetro renomeado para evitar ambiguidade
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  petition_ids UUID[];
BEGIN
  -- Obter os IDs de todas as petições do usuário
  SELECT array_agg(id) INTO petition_ids FROM public.petitions WHERE user_id = p_user_id;
  
  -- Remover arquivos anexados
  DELETE FROM public.petition_attachments WHERE petition_id = ANY(petition_ids);
  
  -- Remover documentos da petição
  DELETE FROM public.petition_documents WHERE petition_id = ANY(petition_ids);
  
  -- Remover comentários
  DELETE FROM public.petition_comments WHERE petition_id = ANY(petition_ids);
  
  -- Remover reviews
  DELETE FROM public.petition_reviews WHERE petition_id = ANY(petition_ids);
  
  -- Remover configurações de petição
  DELETE FROM public.petition_settings WHERE user_id = p_user_id;
  
  -- Remover transações de tokens
  DELETE FROM public.token_transactions WHERE user_id = p_user_id;
  
  -- Remover tokens do usuário
  DELETE FROM public.user_tokens WHERE user_id = p_user_id;
  
  -- Remover o usuário de todos os times
  DELETE FROM public.team_members WHERE user_id = p_user_id;
  
  -- Remover convites (buscar pelo email do perfil)
  DELETE FROM public.team_invites WHERE email = (SELECT email FROM public.profiles WHERE id = p_user_id);
  
  -- Remover renovações anuais de tokens
  DELETE FROM public.annual_token_renewal_tracker WHERE user_id = p_user_id;
  
  -- Remover petições
  DELETE FROM public.petitions WHERE user_id = p_user_id;
  
  -- Remover perfil
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Remover usuário do sistema de autenticação
  DELETE FROM auth.users WHERE id = p_user_id;
  
END;
$function$
