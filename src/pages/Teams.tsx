
import React, { useEffect, useState } from 'react';
import { getMyTeams, getTeamMembers } from '@/services/team';
import { Team, TeamMember, TeamInvite } from '@/services/team/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

// Components
import MyInvites from "@/components/teams/MyInvites";
import TeamMembersList from "@/components/teams/TeamMembersList";
import TeamInvitesList from "@/components/teams/TeamInvitesList";

// UI Components
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TeamInviteForm from "@/components/teams/TeamInviteForm";

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
      fetchTeamData(teams[0].id || '');
    }
  }, [teams]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await getMyTeams();
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeam(data[0]);
        await fetchTeamData(data[0].id || '');
      }
    } catch (error) {
      console.error("Erro ao carregar equipes:", error);
      toast.error("Erro ao carregar suas equipes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (teamId: string) => {
    try {
      const membersData = await getTeamMembers(teamId);
      setMembers(membersData);
      
      // Em uma implementação real, aqui poderíamos buscar os convites também
      setInvites([]);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
      toast.error("Erro ao carregar membros da equipe");
    }
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamData(team.id || '');
  };

  const handleInviteSent = () => {
    if (selectedTeam) {
      fetchTeamData(selectedTeam.id || '');
    }
    setShowInviteDialog(false);
    toast.success("Convite enviado com sucesso");
  };

  const handleMemberUpdated = () => {
    if (selectedTeam) {
      fetchTeamData(selectedTeam.id || '');
    }
  };

  const handleInviteResponded = () => {
    fetchTeams();
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua equipe e convide novos membros
          </p>
        </div>
        {selectedTeam && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
      </div>

      <MyInvites onInviteResponded={handleInviteResponded} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <Card className="h-[200px] animate-pulse bg-muted/50" />
          </div>
          <div className="md:col-span-1">
            <Card className="h-[200px] animate-pulse bg-muted/50" />
          </div>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Você não possui equipes</h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Crie sua primeira equipe para começar a compartilhar petições com outros usuários
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {selectedTeam && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-xl font-semibold">Membros da Equipe</h2>
                  <Badge>{members.length} membros</Badge>
                </CardHeader>
                <CardContent>
                  <TeamMembersList 
                    members={members} 
                    teamId={selectedTeam.id || ''} 
                    currentUserId={user?.id || ''}
                    onMemberUpdated={handleMemberUpdated}
                  />
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Convites Pendentes</h3>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum convite pendente
                  </div>
                ) : (
                  <TeamInvitesList invites={invites} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialog for inviting a new member */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <TeamInviteForm 
              teamId={selectedTeam.id || ''} 
              onInviteSent={handleInviteSent} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
