
import { supabase } from "@/integrations/supabase/client";

export const handleUserRegistration = async (userId: string, email: string, inviteId?: string): Promise<void> => {
  try {
    console.log(`Processando registro do usuário ${userId} com email ${email}`, inviteId ? `e convite ${inviteId}` : '');
    
    // Check if the user is an admin - if so, don't create a team
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
      
    if (profileData?.is_admin) {
      console.log(`Usuário ${userId} é administrador. Não criando equipe.`);
      return;
    }
    
    // Se temos um ID de convite, processa ele primeiro
    if (inviteId) {
      console.log(`Processando convite específico ${inviteId}`);
      
      const { data: inviteData, error: inviteError } = await supabase
        .from("team_invites")
        .select("*")
        .eq("id", inviteId)
        .single();
      
      if (inviteError) {
        console.error("Erro ao buscar convite:", inviteError);
      } else if (inviteData) {
        // Atualizar status do convite
        const { error: updateError } = await supabase
          .from("team_invites")
          .update({ status: "accepted" })
          .eq("id", inviteData.id);
        
        if (updateError) {
          console.error("Erro ao atualizar status do convite:", updateError);
          throw updateError;
        }
        
        // Adicionar usuário à equipe
        const memberRole = inviteData.role || "operador";
        
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({
            team_id: inviteData.team_id,
            user_id: userId,
            role: memberRole
          });
        
        if (memberError) {
          console.error("Erro ao adicionar usuário à equipe:", memberError);
          throw memberError;
        }
        
        console.log(`Usuário ${userId} adicionado à equipe ${inviteData.team_id} como ${memberRole} via convite específico`);
        return;
      }
    }
    
    // Check for pending invites by email
    const { data: pendingInvites, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("email", email)
      .eq("status", "pending");
    
    if (inviteError) {
      console.error("Erro ao verificar convites pendentes:", inviteError);
      throw inviteError;
    }
    
    // Se houver convites pendentes, aceite o primeiro e adicione o usuário àquela equipe
    if (pendingInvites && pendingInvites.length > 0) {
      const invite = pendingInvites[0];
      console.log(`Convite pendente encontrado para equipe ${invite.team_id}, aceitando automaticamente`);
      
      // Atualizar status do convite
      const { error: updateError } = await supabase
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);
      
      if (updateError) {
        console.error("Erro ao atualizar status do convite:", updateError);
        throw updateError;
      }
      
      // Adicionar usuário à equipe
      const memberRole = invite.role || "operador";
      
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: invite.team_id,
          user_id: userId,
          role: memberRole
        });
      
      if (memberError) {
        console.error("Erro ao adicionar usuário à equipe:", memberError);
        throw memberError;
      }
      
      console.log(`Usuário ${userId} adicionado à equipe ${invite.team_id} como ${memberRole} automaticamente`);
      return;
    }
    
    // Se não houver convites, uma equipe será criada automaticamente pelo trigger do banco de dados
    console.log(`Nenhum convite pendente encontrado para ${email}. Uma equipe será criada pelo trigger do banco de dados.`);
  } catch (error) {
    console.error("Erro ao processar registro de usuário:", error);
    throw error;
  }
};
