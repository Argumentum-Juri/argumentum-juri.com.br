
// Add the file path as appropriate
import { supabase } from "@/integrations/supabase/client";
import { TeamMember } from "./types";

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profile: profiles (id, name, email, avatar_url)
      `)
      .eq('team_id', teamId);
      
    if (error) throw error;
    
    return data as TeamMember[];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

// Function to check if the current user is the owner of a team
export const isTeamOwner = async (teamId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;
    
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userData.user.id)
      .eq('role', 'owner')
      .maybeSingle();
      
    if (error) {
      console.error("Error checking team owner:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in isTeamOwner:", error);
    return false;
  }
};

// Add this missing function that was imported but not implemented
export const isTeamMember = async (teamId: string, userId?: string): Promise<boolean> => {
  try {
    // If userId is not provided, use the current user
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser();
      targetUserId = userData?.user?.id;
    }
    
    if (!targetUserId) return false;
    
    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking team membership:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error in isTeamMember:", error);
    return false;
  }
};

export const addTeamMember = async (
  teamId: string, 
  userId: string,
  role: string = 'operador'
): Promise<TeamMember | null> => {
  try {
    // Check if user is already a member
    const isMember = await isTeamMember(teamId, userId);
    if (isMember) {
      console.log("User is already a team member");
      return null;
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data as TeamMember;
  } catch (error) {
    console.error("Error adding team member:", error);
    throw error;
  }
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    // Check if the user to remove is the owner
    const { data: ownerCheck, error: ownerError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
      
    if (ownerError) throw ownerError;
    
    if (ownerCheck.role === 'owner') {
      throw new Error("Cannot remove the team owner");
    }
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error removing team member:", error);
    throw error;
  }
};

export const updateTeamMemberRole = async (
  teamId: string,
  userId: string,
  newRole: string
): Promise<TeamMember | null> => {
  try {
    // Check if the user is the owner (owners cannot have their role changed)
    const { data: ownerCheck, error: ownerError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();
      
    if (ownerError) throw ownerError;
    
    if (ownerCheck.role === 'owner') {
      throw new Error("Cannot change the role of the team owner");
    }
    
    const { data, error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data as TeamMember;
  } catch (error) {
    console.error("Error updating team member role:", error);
    throw error;
  }
};
