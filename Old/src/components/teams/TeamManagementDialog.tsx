
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Team, TeamMember, TeamInvite } from '@/services/team/types';
import { getTeamMembers } from '@/services/team/memberOperations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import TeamMembersList from './TeamMembersList';
import TeamInviteForm from './TeamInviteForm';
import TeamInvitesList from './TeamInvitesList';

interface TeamManagementDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamManagementDialog: React.FC<TeamManagementDialogProps> = ({ 
  team, 
  open, 
  onOpenChange 
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [userRole, setUserRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (team && open) {
      fetchTeamData();
    }
  }, [team, open]);

  const fetchTeamData = async () => {
    if (!team?.id) return;
    
    setLoading(true);
    try {
      // Buscar membros da equipe
      const teamMembers = await getTeamMembers(team.id);
      setMembers(teamMembers);
      
      // Determinar a função do usuário atual na equipe
      const currentMember = teamMembers.find(member => member.user_id === user?.id);
      if (currentMember) {
        setUserRole(currentMember.role);
      }
      
      // Buscar convites pendentes da equipe
      const { data: invitesData, error: invitesError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', team.id)
        .eq('status', 'pending');
      
      if (invitesError) {
        console.error("Erro ao carregar convites:", invitesError);
        throw invitesError;
      }
      
      setInvites(invitesData as TeamInvite[]);
    } catch (error) {
      console.error("Erro ao carregar dados da equipe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Equipe</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="invite">Convidar</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            {loading ? (
              <div className="text-center py-8">Carregando membros...</div>
            ) : (
              <TeamMembersList 
                members={members} 
                teamId={team.id || ''} 
                currentUserId={user?.id || ''}
                onMemberUpdated={fetchTeamData}
              />
            )}
          </TabsContent>
          
          <TabsContent value="invite">
            <TeamInviteForm 
              teamId={team.id || ''} 
              onInviteSent={fetchTeamData}
              userRole={userRole}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            {loading ? (
              <div className="text-center py-8">Carregando convites...</div>
            ) : (
              <TeamInvitesList invites={invites} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementDialog;
