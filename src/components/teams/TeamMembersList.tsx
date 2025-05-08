
import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { TeamMember } from '@/services/team/types';
import { isTeamOwner, removeTeamMember, updateTeamMemberRole } from '@/services/team/memberOperations';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamMembersListProps {
  members: TeamMember[];
  teamId: string;
  currentUserId: string;
  onMemberUpdated: () => void;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  teamId,
  currentUserId,
  onMemberUpdated
}) => {
  const [loading, setLoading] = React.useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const handleRemoveMember = async (memberId: string) => {
    if (confirm("Tem certeza que deseja remover este membro da equipe?")) {
      setLoading(memberId);
      try {
        await removeTeamMember(teamId, memberId);
        toast.success("Membro removido com sucesso");
        onMemberUpdated();
      } catch (error) {
        console.error("Erro ao remover membro:", error);
        toast.error("Erro ao remover membro");
      } finally {
        setLoading(null);
      }
    }
  };
  
  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(memberId);
    try {
      await updateTeamMemberRole(teamId, memberId, newRole);
      toast.success("Função atualizada com sucesso");
      onMemberUpdated();
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      toast.error("Erro ao atualizar função");
    } finally {
      setLoading(null);
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="outline" className="whitespace-nowrap">Proprietário</Badge>;
      case 'gestor':
        return <Badge className="bg-blue-500 whitespace-nowrap">Gestor</Badge>;
      case 'operador':
        return <Badge className="whitespace-nowrap">Operador</Badge>;
      default:
        return <Badge variant="outline" className="whitespace-nowrap">{role}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {members.map(member => (
        <div key={member.id} className="user-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {member.profile?.name?.[0] || member.user_id?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="cursor-help">
                      <p className="font-medium">
                        {member.profile?.name || 'Usuário'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-xs">
                        {member.profile?.email || 'Email não disponível'}
                      </p>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent align="start" className="w-80 z-50 bg-background/100">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold">ID:</span> {member.user_id}
                      </p>
                      {member.profile?.person_type && (
                        <p className="text-sm">
                          <span className="font-semibold">Tipo:</span> {member.profile.person_type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-semibold">Desde:</span> {new Date(member.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <div className="mr-2">
                {getRoleBadge(member.role)}
              </div>
              
              {member.user_id !== currentUserId && member.role !== 'owner' && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select 
                    className="text-xs bg-background border rounded px-2 py-1 flex-grow min-w-[100px]" 
                    value={member.role} 
                    onChange={e => handleRoleChange(member.user_id, e.target.value)} 
                    disabled={loading === member.user_id || member.role === 'owner'}
                  >
                    <option value="gestor">Gestor</option>
                    <option value="operador">Operador</option>
                  </select>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemoveMember(member.user_id)} 
                    disabled={loading === member.user_id}
                    className="flex-grow sm:flex-grow-0 min-w-[80px]"
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamMembersList;
