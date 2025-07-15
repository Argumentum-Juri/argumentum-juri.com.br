
import React, { useEffect, useState } from 'react';
import { getMyTeams, getTeamMembers, getMyInvites } from '@/services/team';
import { Team, TeamMember, TeamInvite } from '@/services/team/types';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { useTeams } from '@/hooks/useTeams';
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
import { supabase } from '@/integrations/supabase/client';

const Teams = () => {
  console.log('[Teams] 🚀 Componente Teams renderizando...');
  
  const { user } = useGoAuth();
  
  // Hook de equipes com logs
  const { teams: hookTeams, isLoading: hookLoading, error: hookError, refreshTeams } = useTeams();
  console.log('[Teams] 📋 Hook useTeams retornou:', { 
    teams: hookTeams, 
    isLoading: hookLoading, 
    error: hookError 
  });

  // Estados locais para compatibilidade com o código legado
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [userRole, setUserRole] = useState<string>('member');

  // Usar os dados do hook quando disponíveis
  useEffect(() => {
    console.log('[Teams] 🔄 useEffect para sincronizar dados do hook');
    if (hookTeams && Array.isArray(hookTeams)) {
      console.log('[Teams] ✅ Sincronizando dados do hook:', hookTeams);
      
      // Transformar os dados da nova API para o formato esperado
      const transformedTeams = hookTeams.map(item => ({
        id: item.team_id || item.teams?.id,
        name: item.teams?.name || 'Equipe',
        ...item.teams
      }));
      
      setTeams(transformedTeams);
      setLoading(false);
      
      if (hookTeams.length > 0 && !selectedTeam) {
        const firstTeam = transformedTeams[0];
        const teamId = hookTeams[0].team_id || hookTeams[0].teams?.id;
        
        console.log('[Teams] 🎯 Selecionando primeira equipe:', { firstTeam, teamId });
        
        if (teamId) {
          setSelectedTeam(firstTeam);
          setSelectedTeamId(teamId);
        }
      }
    } else if (!hookLoading && hookTeams !== undefined) {
      console.log('[Teams] 📭 Hook retornou lista vazia ou undefined');
      setTeams([]);
      setLoading(false);
    }
  }, [hookTeams, hookLoading, selectedTeam]);

  // Buscar dados da equipe quando selectedTeamId muda
  useEffect(() => {
    if (selectedTeamId) {
      console.log('[Teams] 🔍 Buscando dados da equipe com ID:', selectedTeamId);
      fetchTeamData(selectedTeamId);
    }
  }, [selectedTeamId]);

  // Fallback para o método legado se necessário
  useEffect(() => {
    console.log('[Teams] 🔄 useEffect inicial para fallback');
    if (hookError) {
      console.log('[Teams] ❌ Erro no hook, usando fallback legado:', hookError);
      fetchTeamsLegacy();
    }
  }, [hookError]);

  const fetchTeamsLegacy = async () => {
    console.log('[Teams] 🏗️ Executando fetch legado...');
    setLoading(true);
    try {
      const data = await getMyTeams();
      console.log('[Teams] ✅ Dados legados recebidos:', data);
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeam(data[0]);
        setSelectedTeamId(data[0].id || '');
      }
    } catch (error) {
      console.error("[Teams] ❌ Erro ao carregar equipes (legado):", error);
      toast.error("Erro ao carregar suas equipes");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const invitesData = await getMyInvites();
      console.log('[Teams] 📨 Convites carregados:', invitesData);
    } catch (error) {
      console.error("Erro ao carregar convites:", error);
    }
  };

  const fetchTeamData = async (teamId: string) => {
    console.log('[Teams] 🔍 Buscando dados da equipe:', teamId);
    
    if (!teamId) {
      console.error('[Teams] ❌ Team ID vazio, não é possível buscar dados');
      return;
    }
    
    try {
      const membersData = await getTeamMembers(teamId);
      console.log('[Teams] 👥 Membros carregados:', membersData);
      setMembers(membersData);
      
      // Determinar a função do usuário atual na equipe
      const currentMember = membersData.find(member => member.user_id === user?.id);
      if (currentMember) {
        setUserRole(currentMember.role);
        console.log('[Teams] 👤 Role do usuário atual:', currentMember.role);
      }
      
      // Buscar os convites pendentes da equipe
      const { data: invitesData, error: invitesError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending');
        
      if (invitesError) {
        console.error("Erro ao carregar convites da equipe:", invitesError);
      } else {
        console.log('[Teams] 📧 Convites da equipe carregados:', invitesData);
        setInvites(invitesData as TeamInvite[]);
      }
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
      toast.error("Erro ao carregar membros da equipe");
    }
  };

  const handleTeamSelect = (team: Team) => {
    console.log('[Teams] 🔄 Selecionando equipe:', team);
    setSelectedTeam(team);
    setSelectedTeamId(team.id || '');
  };

  const handleInviteSent = () => {
    if (selectedTeamId) {
      fetchTeamData(selectedTeamId);
    }
    setShowInviteDialog(false);
    toast.success("Convite enviado com sucesso");
  };

  const handleMemberUpdated = () => {
    if (selectedTeamId) {
      fetchTeamData(selectedTeamId);
    }
  };

  const handleInviteResponded = () => {
    if (refreshTeams) {
      console.log('[Teams] 🔄 Refresh via hook');
      refreshTeams();
    } else {
      console.log('[Teams] 🔄 Refresh via método legado');
      fetchTeamsLegacy();
    }
    fetchInvites();
  };

  // Verificar se o usuário pode convidar (é proprietário ou gestor)
  const canInvite = userRole === 'owner' || userRole === 'gestor';

  console.log('[Teams] 🎯 Estado atual:', { 
    teams: teams.length, 
    loading, 
    selectedTeam: selectedTeam?.name || 'nenhuma',
    selectedTeamId,
    hookLoading,
    hookError 
  });

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua equipe e convite novos membros
          </p>
        </div>
        {selectedTeam && canInvite && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
      </div>

      <MyInvites onInviteResponded={handleInviteResponded} />

      {loading || hookLoading ? (
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
            {hookError && (
              <p className="text-sm text-red-500 mt-2">
                Erro do hook: {hookError}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {selectedTeam && selectedTeamId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="text-xl font-semibold">Membros da Equipe</h2>
                  <Badge>{members.length} membros</Badge>
                </CardHeader>
                <CardContent>
                  <TeamMembersList 
                    members={members} 
                    teamId={selectedTeamId} 
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
          {selectedTeam && selectedTeamId && (
            <TeamInviteForm 
              teamId={selectedTeamId} 
              onInviteSent={handleInviteSent} 
              userRole={userRole}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
