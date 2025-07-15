import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from '@/services/team/types';
import { getTeamMembers, isTeamOwner, removeTeamMember, updateTeamMemberRole } from '@/services/team';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, UserX, Users, UserCog } from 'lucide-react';
import { useGoAuth } from '@/contexts/GoAuthContext';

interface TeamMembersListProps {
  teamId: string;
  onMemberChange?: () => void;
  // Additional properties for TeamManagementDialog functionality
  members?: TeamMember[];
  currentUserId?: string;
  onMemberUpdated?: () => void | Promise<void>;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({ 
  teamId, 
  onMemberChange,
  // Support both interfaces
  members: initialMembers,
  currentUserId,
  onMemberUpdated
}) => {
  const { user } = useGoAuth();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers || []);
  const [loading, setLoading] = useState(!initialMembers);
  const [isOwner, setIsOwner] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const effectiveUserId = currentUserId || user?.id;

  useEffect(() => {
    // If members were passed in and we're in dialog mode, don't fetch again
    if (initialMembers) {
      setMembers(initialMembers);
      setLoading(false);
    } else {
      fetchMembers();
    }
    checkIsOwner();
  }, [teamId, initialMembers]);

  const fetchMembers = async () => {
    if (initialMembers) return; // Skip if members were provided externally
    
    setLoading(true);
    try {
      const teamMembers = await getTeamMembers(teamId);
      setMembers(teamMembers);
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      toast.error("Erro ao carregar membros da equipe");
    } finally {
      setLoading(false);
    }
  };

  const checkIsOwner = async () => {
    try {
      const result = await isTeamOwner(teamId);
      setIsOwner(result);
    } catch (error) {
      console.error("Erro ao verificar propriedade:", error);
      setIsOwner(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === effectiveUserId) {
      toast.error("Você não pode remover a si mesmo da equipe");
      return;
    }

    setActionLoading(memberId);
    try {
      const success = await removeTeamMember(teamId, userId);
      if (success) {
        toast.success("Membro removido com sucesso");
        
        // Call the appropriate callback based on which prop was provided
        if (onMemberUpdated) {
          await onMemberUpdated();
        } else if (onMemberChange) {
          onMemberChange();
        } else {
          fetchMembers(); // Fallback to just refreshing the list
        }
      } else {
        toast.error("Erro ao remover membro");
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (memberId: string, userId: string, newRole: string) => {
    setActionLoading(memberId);
    try {
      const success = await updateTeamMemberRole(teamId, userId, newRole);
      if (success) {
        toast.success("Função atualizada com sucesso");
        
        // Call the appropriate callback based on which prop was provided
        if (onMemberUpdated) {
          await onMemberUpdated();
        } else if (onMemberChange) {
          onMemberChange();
        } else {
          fetchMembers(); // Fallback to just refreshing the list
        }
      } else {
        toast.error("Erro ao atualizar função");
      }
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      toast.error("Erro ao atualizar função");
    } finally {
      setActionLoading(null);
    }
  };

  // Helper to get the display name for a role
  const getRoleLabel = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'owner': return 'Proprietário';
      case 'gestor': return 'Gestor';
      case 'operador': return 'Operador';
      default: return role;
    }
  };

  // Helper to get the badge variant for a role
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role.toLowerCase()) {
      case 'owner': return 'default';
      case 'gestor': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className={initialMembers ? "shadow-none border-0" : ""}>
      {!initialMembers && (
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Membros da Equipe</CardTitle>
          </div>
        </CardHeader>
      )}
      <CardContent className={initialMembers ? "p-0" : ""}>
        {loading ? (
          <div className="text-center py-4">
            Carregando membros...
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum membro encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage 
                      src={member.profile?.avatar_url || ''} 
                      alt={member.profile?.name || 'Membro'} 
                    />
                    <AvatarFallback>
                      {(member.profile?.name || 'M')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.profile?.name || 'Usuário sem nome'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profile?.email || 'Email não disponível'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {getRoleLabel(member.role)}
                  </Badge>
                  
                  {isOwner && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          disabled={!!actionLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Opções</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === 'operador' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(member.id!, member.user_id, 'gestor')}
                            disabled={actionLoading === member.id}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Promover a Gestor
                          </DropdownMenuItem>
                        )}
                        
                        {member.role === 'gestor' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(member.id!, member.user_id, 'operador')}
                            disabled={actionLoading === member.id}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Rebaixar a Operador
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id!, member.user_id)}
                          disabled={actionLoading === member.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remover da Equipe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembersList;
