
import { supabase } from '@/integrations/supabase/client';

/**
 * Função auxiliar para obter as configurações de petições de um usuário de forma segura
 */
export const safeGetPetitionSettings = async (userId: string) => {
  try {
    // Verificamos primeiro se existem configurações para este usuário
    const { data: checkData, error: checkError } = await supabase
      .from('petition_settings')
      .select('id')
      .eq('user_id', userId);
    
    if (checkError || !checkData || checkData.length === 0) {
      console.log(`No settings found for user ${userId}, returning null`);
      return null;
    }
    
    // Se existem, então obtemos as configurações
    const { data, error } = await supabase
      .from('petition_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Usando maybeSingle em vez de single para evitar erros
    
    if (error) {
      console.error("Error fetching petition settings:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching petition settings:", error);
    return null;
  }
};
