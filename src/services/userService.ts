
import { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço de gerenciamento de usuários
 */
export const userService = {
  /**
   * Busca o perfil do usuário pelo ID
   * @param userId - ID do usuário
   * @returns Perfil do usuário ou null se não encontrado
   */
  getUserProfile: async (userId: string): Promise<Profile | null> => {
    try {
      console.log(`getUserProfile: Fetching profile for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`getUserProfile: Error fetching profile for ${userId}:`, error.message);
        return null;
      }

      if (!data) {
        console.warn(`getUserProfile: No profile found for ${userId}`);
        return null;
      }

      console.log(`getUserProfile: Profile found for ${userId}`);
      return data as Profile;
    } catch (error: any) {
      console.error(`getUserProfile: Exception for ${userId}:`, error.message);
      return null;
    }
  },

  /**
   * Verifica se um usuário é administrador
   * @param userId - ID do usuário
   * @returns true se o usuário é administrador, false caso contrário
   */
  isUserAdmin: async (userId: string): Promise<boolean> => {
    try {
      console.log(`isUserAdmin: Checking admin status for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`isUserAdmin: Error checking admin status for ${userId}:`, error.message);
        return false;
      }

      const isAdmin = !!data?.is_admin;
      console.log(`isUserAdmin: User ${userId} is admin: ${isAdmin}`);
      return isAdmin;
    } catch (error: any) {
      console.error(`isUserAdmin: Exception for ${userId}:`, error.message);
      return false;
    }
  },

  /**
   * Busca todos os usuários não administradores
   * @returns Lista de usuários e contagem
   */
  getAllNonAdminUsers: async (): Promise<{ data: Profile[], count: number }> => {
    try {
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('is_admin', false)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching non-admin users:", error);
        return { data: [], count: 0 };
      }
      
      return { data: data as Profile[], count: count || 0 };
    } catch (error) {
      console.error("Error in getAllNonAdminUsers:", error);
      return { data: [], count: 0 };
    }
  }
};

// Estas funções individuais são mantidas para compatibilidade com código existente
export const getUserProfile = userService.getUserProfile;
export const isUserAdmin = userService.isUserAdmin;
