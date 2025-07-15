
import { supabase } from "@/integrations/supabase/client";
import { Team, TeamInvite } from "./types";
import { clearAllUserCaches } from "@/utils/cacheUtils";

export const inviteToTeam = async (teamId: string, email: string, role: string): Promise<TeamInvite> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email: email.toLowerCase(), // Garantir que o email seja salvo em minúsculas
      inviter_id: user.user.id,
      role: role
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating team invite:", error);
    throw error;
  }
  
  return data as TeamInvite;
};

export const getMyInvites = async (): Promise<(TeamInvite & { team?: Team })[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    return [];
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.user.id)
    .single();
  
  if (!profile?.email) {
    return [];
  }
  
  const { data, error } = await supabase
    .from("team_invites")
    .select("*, teams(*)")
    .eq("email", profile.email.toLowerCase()) // Garantir busca case-insensitive
    .eq("status", "pending");
  
  if (error) {
    console.error("Error fetching invites:", error);
    throw error;
  }
  
  return data.map(invite => {
    return {
      id: invite.id,
      team_id: invite.team_id,
      email: invite.email,
      status: invite.status as 'pending' | 'accepted' | 'rejected' | 'expired',
      inviter_id: invite.inviter_id,
      role: (invite as any).role || "operador",
      created_at: invite.created_at,
      expires_at: invite.expires_at,
      team: invite.teams as Team
    };
  });
};

export const respondToInvite = async (inviteId: string, accept: boolean): Promise<boolean> => {
  const status = accept ? "accepted" : "rejected";
  
  try {
    // Buscar detalhes do convite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*, teams(*)")
      .eq("id", inviteId)
      .single();
    
    if (inviteError) {
      console.error("Error fetching invite details:", inviteError);
      throw inviteError;
    }
    
    // Verificar se o convite já foi aceito, rejeitado ou expirou
    if (invite.status !== 'pending') {
      throw new Error(`Este convite já foi ${invite.status === 'accepted' ? 'aceito' : 
                      invite.status === 'rejected' ? 'rejeitado' : 'expirado'}`);
    }
    
    // Atualizar status do convite
    const { error: updateError } = await supabase
      .from("team_invites")
      .update({ status })
      .eq("id", inviteId);
    
    if (updateError) {
      console.error("Error updating invite:", updateError);
      throw updateError;
    }
    
    // Se o usuário aceitou o convite
    if (accept) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        throw new Error("User not authenticated");
      }
      
      const userId = userData.user.id;
      
      // Verificar se o usuário já é membro desta equipe
      const { data: existingMembership, error: membershipError } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", invite.team_id)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (membershipError) {
        console.error("Error checking existing membership:", membershipError);
      }
      
      if (!existingMembership) {
        // Se não for membro, adicionar
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({
            team_id: invite.team_id,
            user_id: userId,
            role: invite.role || "operador"
          });
        
        if (memberError) {
          console.error("Error adding team member:", memberError);
          throw memberError;
        }
      }
      
      // Verificar se o usuário é proprietário de uma equipe
      const { data: ownedTeams, error: ownedTeamsError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "owner");
      
      if (ownedTeamsError) {
        console.error("Error checking user owned teams:", ownedTeamsError);
      }
      
      // Se o usuário é dono de alguma equipe, tratar a migração
      if (ownedTeams && ownedTeams.length > 0) {
        for (const teamMembership of ownedTeams) {
          const teamId = teamMembership.team_id;
          
          // Verificar se é a única pessoa na equipe
          const { data: teamMembers, error: membersError } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", teamId);
          
          if (membersError) {
            console.error(`Error checking team members for team ${teamId}:`, membersError);
            continue;
          }
          
          if (teamMembers.length === 1) {
            // Se o usuário é o único membro da equipe, remover o membro e excluir a equipe
            console.log(`Usuário ${userId} é o único membro da equipe ${teamId}. Excluindo equipe...`);
            
            // Primeiro remover o usuário como membro
            const { error: removeMemberError } = await supabase
              .from("team_members")
              .delete()
              .eq("team_id", teamId)
              .eq("user_id", userId);
            
            if (removeMemberError) {
              console.error(`Error removing user from team ${teamId}:`, removeMemberError);
            }
            
            // Depois excluir a equipe
            const { error: deleteTeamError } = await supabase
              .from("teams")
              .delete()
              .eq("id", teamId);
            
            if (deleteTeamError) {
              console.error(`Error deleting team ${teamId}:`, deleteTeamError);
            }
          } else {
            // Se há outros membros, apenas remover o usuário como proprietário
            console.log(`Removendo usuário ${userId} como proprietário da equipe ${teamId}.`);
            
            const { error: removeMemberError } = await supabase
              .from("team_members")
              .delete()
              .eq("team_id", teamId)
              .eq("user_id", userId)
              .eq("role", "owner");
            
            if (removeMemberError) {
              console.error(`Error removing user as owner from team ${teamId}:`, removeMemberError);
            }
          }
        }
      }
      
      // Cancelar outros convites pendentes para o mesmo usuário/email
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      
      if (userProfile?.email) {
        const { error: cancelError } = await supabase
          .from("team_invites")
          .update({ status: "expired" })
          .eq("email", userProfile.email.toLowerCase())
          .neq("id", inviteId)
          .eq("status", "pending");
          
        if (cancelError) {
          console.error("Error canceling other pending invites:", cancelError);
        }
      }
      
      // Limpar todos os caches do usuário para evitar problemas de dados inconsistentes
      clearAllUserCaches();
    }
    
    return true;
  } catch (error) {
    console.error("Error responding to invite:", error);
    throw error;
  }
};
