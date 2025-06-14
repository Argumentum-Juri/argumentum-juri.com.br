
import { supabase } from "@/integrations/supabase/client";

export const handleUserRegistration = async (userId: string, email: string, inviteId?: string): Promise<void> => {
  try {
    console.log(`Processando registro do usuário ${userId} com email ${email}`, inviteId ? `e convite ${inviteId}` : '');
    
    // Check if the user is an admin - if so, don't create a team
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      console.error("Erro ao verificar perfil do usuário:", profileError);
      // Continue com o processo mas log o erro
    }
      
    if (profileData?.is_admin) {
      console.log(`Usuário ${userId} é administrador. Não criando equipe.`);
      return;
    }
    
    // Se temos um ID de convite específico, processamos ele primeiro
    if (inviteId) {
      console.log(`Processando convite específico: ${inviteId}`);
      await processInviteById(userId, email, inviteId);
      return;
    }
    
    // Verificar se existem convites pendentes por email
    // IMPORTANTE: Não criar equipe se há convites pendentes, deixar para o fluxo de aceitação de convite
    const { data: pendingInvites, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("email", email.toLowerCase()) // Garantir que o email seja case-insensitive
      .eq("status", "pending");
    
    if (inviteError) {
      console.error("Erro ao verificar convites pendentes:", inviteError);
    }
    
    // Se existem convites pendentes, NÃO criamos equipe automaticamente
    // O usuário vai lidar com os convites através da interface e decidir se vai aceitar ou rejeitar
    if (pendingInvites && pendingInvites.length > 0) {
      console.log(`Usuário ${userId} possui ${pendingInvites.length} convites pendentes. Não criando equipe automaticamente.`);
      return;
    }
    
    // Apenas criar equipe se não há convites pendentes e o usuário não é administrador
    console.log(`Nenhum convite pendente encontrado para ${email}. Criando uma nova equipe.`);
    
    await createTeamForUser(userId);
  } catch (error) {
    console.error("Erro ao processar registro de usuário:", error);
    // Don't throw the error, just log it to prevent blocking the user registration flow
  }
};

async function createTeamForUser(userId: string): Promise<void> {
  try {
    // Criar uma nova equipe - sem nome explícito, já que o schema não suporta
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({})
      .select()
      .single();
    
    if (teamError) {
      console.error("Erro ao criar equipe:", teamError);
      return;
    }
    
    // Adicionar o usuário como proprietário da equipe
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamData.id,
        user_id: userId,
        role: "owner"
      });
    
    if (memberError) {
      console.error("Erro ao adicionar usuário como proprietário da equipe:", memberError);
    } else {
      console.log(`Equipe criada com sucesso para o usuário ${userId}. ID da equipe: ${teamData.id}`);
    }
  } catch (error) {
    console.error("Erro ao criar equipe para novo usuário:", error);
  }
}

async function processInviteById(userId: string, email: string, inviteId: string): Promise<void> {
  try {
    const { data: inviteData, error: inviteError } = await supabase
      .from("team_invites")
      .select("*, teams(*)")
      .eq("id", inviteId)
      .single();
    
    if (inviteError) {
      console.error("Erro ao buscar convite:", inviteError);
      throw inviteError;
    } 
    
    if (!inviteData) {
      console.error("Convite não encontrado");
      return;
    }
    
    // Verificar se o email do convite corresponde ao email do usuário
    if (inviteData.email.toLowerCase() !== email.toLowerCase()) {
      console.error(`Email do usuário (${email}) não corresponde ao email do convite (${inviteData.email})`);
      return;
    }
    
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
    
    // Cancelar outros convites pendentes para o mesmo email
    const { error: cancelError } = await supabase
      .from("team_invites")
      .update({ status: "expired" })
      .eq("email", email)
      .neq("id", inviteData.id)
      .eq("status", "pending");
      
    if (cancelError) {
      console.error("Erro ao cancelar outros convites pendentes:", cancelError);
    }
  } catch (error) {
    console.error("Erro ao processar convite:", error);
    throw error; // Propagar o erro para que possa ser tratado adequadamente
  }
}
