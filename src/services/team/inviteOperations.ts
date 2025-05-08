
import { supabase } from "@/integrations/supabase/client";
import { Team, TeamInvite } from "./types";

export const inviteToTeam = async (teamId: string, email: string, role: string): Promise<TeamInvite> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.id) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      email,
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
    .eq("email", profile.email)
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
  
  const { data: invite, error: inviteError } = await supabase
    .from("team_invites")
    .update({ status })
    .eq("id", inviteId)
    .select("*")
    .single();
  
  if (inviteError) {
    console.error("Error updating invite:", inviteError);
    throw inviteError;
  }
  
  if (accept) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) {
      throw new Error("User not authenticated");
    }
    
    const memberRole = (invite as any).role || "operador";
    
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: user.user.id,
        role: memberRole
      });
    
    if (memberError) {
      console.error("Error adding team member:", memberError);
      throw memberError;
    }
  }
  
  return true;
};
