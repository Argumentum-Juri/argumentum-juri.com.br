
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "./types";

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  // Abordagem simplificada para evitar problemas de RLS
  const { data, error } = await supabase
    .from("team_members")
    .select("*, user_id")
    .eq("team_id", teamId);
  
  if (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
  
  // Obter informações de perfil para cada membro separadamente
  const members: TeamMember[] = [];
  for (const member of data) {
    // Obter perfil do usuário
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", member.user_id)
      .single();
      
    if (profileData) {
      // Explicitly cast person_type to ensure it matches the required type
      const typedProfile = {
        ...profileData,
        person_type: profileData.person_type as 'fisica' | 'juridica' | undefined
      };
      
      members.push({
        ...member,
        profile: typedProfile
      });
    } else {
      members.push({
        ...member,
        profile: undefined
      });
    }
  }
  
  return members;
};

export const isTeamOwner = async (teamId: string): Promise<boolean> => {
  try {
    // Abordagem direta para verificar se o usuário atual é proprietário
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) {
      return false;
    }
    
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", user.user.id)
      .eq("role", "owner")
      .maybeSingle();
    
    if (error) {
      console.error("Error checking if user is team owner:", error);
      return false;
    }
    
    return !!data; // Converte para booleano
  } catch (error) {
    console.error("Error in isTeamOwner:", error);
    return false;
  }
};

export const addTeamMember = async (teamId: string, userId: string, role: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role
      });
    
    if (error) {
      console.error("Error adding team member:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in addTeamMember:", error);
    return false;
  }
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error removing team member:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeTeamMember:", error);
    return false;
  }
};

export const updateTeamMemberRole = async (teamId: string, userId: string, newRole: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("team_id", teamId)
      .eq("user_id", userId);
    
    if (error) {
      console.error("Error updating team member role:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateTeamMemberRole:", error);
    return false;
  }
};
