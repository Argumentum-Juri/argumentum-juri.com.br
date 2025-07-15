
import { supabase } from "@/integrations/supabase/client";
import { Team } from "./types";

export const createTeam = async (): Promise<Team> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error("User not authenticated");
  }
  
  // First create the team
  // Explicitly cast to any to bypass TypeScript's outdated type definitions
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert({} as any)
    .select()
    .single();
  
  if (teamError) {
    console.error("Error creating team:", teamError);
    throw teamError;
  }
  
  // Then add the current user as the team owner
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamData.id,
      user_id: user.user.id,
      role: 'owner'
    });
  
  if (memberError) {
    console.error("Error adding team owner:", memberError);
    throw memberError;
  }
  
  return teamData as Team;
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();
  
  if (error) {
    console.error("Error fetching team:", error);
    return null;
  }
  
  return data as Team;
};

export const updateTeam = async (teamId: string, updates: Partial<Team>): Promise<Team | null> => {
  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating team:", error);
    throw error;
  }
  
  return data as Team;
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);
  
  if (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
  
  return true;
};

export const getMyTeams = async (): Promise<Team[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    return [];
  }
  
  try {
    // Primeiro, busca os IDs das equipes diretamente da tabela team_members
    const { data: teamMemberships, error } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.user.id);
    
    if (error) {
      console.error("Error fetching team memberships:", error);
      throw error;
    }
    
    // Se não há participações em equipes, retorna array vazio
    if (!teamMemberships || teamMemberships.length === 0) {
      return [];
    }
    
    // Extrai os IDs das equipes
    const teamIds = teamMemberships.map(membership => membership.team_id);
    
    // Busca os detalhes das equipes usando os IDs
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);
    
    if (teamsError) {
      console.error("Error fetching teams details:", teamsError);
      throw teamsError;
    }
    
    return teams as Team[];
  } catch (error) {
    console.error("Error in getMyTeams:", error);
    throw error;
  }
};
