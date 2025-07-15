
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamService } from '@/services/team';
import { Team } from '@/services/team';
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoAuth } from "@/contexts/GoAuthContext";

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ selectedTeamId, onTeamChange }) => {
  const { user } = useGoAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Para o GoAuthContext, precisamos buscar a equipe do usuário de forma diferente
    // Por enquanto, simulamos uma equipe básica se o usuário existir
    if (user) {
      // Simular busca de equipe - em implementação real, usar API adequada
      setTeam({ id: 'default-team', name: 'Minha Equipe' });
      
      // Se ainda não tiver um time selecionado, seleciona automaticamente
      if (!selectedTeamId) {
        onTeamChange('default-team');
      }
    } else {
      setTeam(null);
    }
    setLoading(false);
  }, [user, selectedTeamId, onTeamChange]);
  
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
      {loading ? (
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
