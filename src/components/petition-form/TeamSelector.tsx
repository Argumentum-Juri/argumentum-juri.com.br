
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamService } from '@/services/team';
import { Team } from '@/services/team';
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ selectedTeamId, onTeamChange }) => {
  const { teamId, activeTeam, teamLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  
  useEffect(() => {
    if (activeTeam) {
      setTeam({ id: activeTeam.id, name: activeTeam.name || 'Minha Equipe' });
      
      // Se ainda não tiver um time selecionado, seleciona automaticamente a equipe do usuário
      if (!selectedTeamId && teamId) {
        onTeamChange(teamId);
      }
    } else {
      setTeam(null);
    }
  }, [activeTeam, teamId, selectedTeamId, onTeamChange]);
  
  const handleTeamChange = (value: string) => {
    if (value === "personal") {
      onTeamChange(null);
    } else {
      onTeamChange(value);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="team" className="flex items-center">
        <Users className="h-4 w-4 mr-2" />
        Compartilhar com Equipe
      </Label>
      {teamLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : team ? (
        <Select value={selectedTeamId || "personal"} onValueChange={handleTeamChange}>
          <SelectTrigger id="team">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Apenas para mim</SelectItem>
            <SelectItem value={team.id!}>Minha Equipe</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <>
          <Select disabled>
            <SelectTrigger id="team">
              <SelectValue placeholder="Nenhuma equipe disponível" />
            </SelectTrigger>
          </Select>
          <div className="text-xs text-muted-foreground mt-2">
            Consulte o administrador para configurar sua equipe.
          </div>
        </>
      )}
      {selectedTeamId && team && (
        <p className="text-xs text-muted-foreground">
          Compartilhando com sua equipe. Todos os membros poderão visualizar esta petição.
        </p>
      )}
    </div>
  );
};

export default TeamSelector;
