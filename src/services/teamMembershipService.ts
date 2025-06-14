
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: string;
  created_at?: string;
}

/**
 * Serviço para gerenciar a associação de usuários a equipes
 * com tratamento de erros melhorado para evitar problemas com RLS recursivo
 */
export const teamMembershipService = {
  /**
   * Busca as equipes do usuário atual com fallback para localStorage em caso de erro
   */
  getUserTeamIds: async (userId: string): Promise<string[]> => {
    try {
      // Tenta buscar diretamente da função RPC segura em vez da tabela com RLS
      const { data, error } = await supabase
        .rpc('get_user_teams', { input_user_id: userId });
      
      if (error) {
        console.error("Erro ao buscar equipes via RPC:", error);
        throw error;
      }
      
      // Converter o resultado para array de strings ou retornar array vazio
      if (Array.isArray(data)) {
        // Se data já for um array de strings, simplesmente retornamos
        if (data.length === 0) {
          return [];
        }
        
        return data.map(item => {
          if (typeof item === 'string') {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            // Precisamos verificar se existe a propriedade team_id no objeto
            // TypeScript precisa de type guard para garantir acesso seguro
            if (item && 'team_id' in item) {
              return String(item.team_id);
            } else if (item && 'team_name' in item && 'team_id' in item) {
              return String((item as any).team_id);
            }
          }
          // Fallback: converter o item para string 
          return String(item);
        });
      }
      
      // Se data não for um array ou estiver vazio, retornamos um array vazio
      return [];
    } catch (error) {
      console.error("Erro no getUserTeamIds:", error);
      
      // Tentar recuperar do localStorage como fallback
      const cachedTeamId = localStorage.getItem('user_team_id');
      if (cachedTeamId) {
        console.log("Usando team_id em cache como fallback:", cachedTeamId);
        return [cachedTeamId];
      }
      
      // Se tudo falhar, retornar array vazio
      return [];
    }
  },
  
  /**
   * Verifica se um usuário é membro de uma equipe específica
   */
  isUserTeamMember: async (userId: string, teamId: string): Promise<boolean> => {
    try {
      // Tenta verificar usando a função RPC segura em vez da tabela com RLS
      const { data, error } = await supabase
        .rpc('is_team_member_safe', { user_id: userId, team_id: teamId });
      
      if (error) {
        console.error("Erro ao verificar associação à equipe via RPC:", error);
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error("Erro no isUserTeamMember:", error);
      
      // Tentar verificar através do localStorage em caso de falha
      const cachedTeamId = localStorage.getItem('user_team_id');
      if (cachedTeamId === teamId) {
        console.log("Usando verificação de cache como fallback para membros da equipe");
        return true;
      }
      
      return false;
    }
  },
  
  /**
   * Busca todos os membros de uma equipe
   */
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar membros da equipe:", error);
      throw error;
    }
  }
};

export default teamMembershipService;
