
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { teamService } from '@/services/team';
import { Team } from '@/services/team';
import { useAuth } from './AuthContext';

interface TeamContextType {
  teamId: string | null;
  setTeamId: (id: string | null) => void;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType>({
  teamId: null,
  setTeamId: () => {},
  loading: true
});

export const useTeam = () => useContext(TeamContext);

interface TeamProviderProps {
  children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadUserTeam = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const teams = await teamService.getMyTeams();
        
        if (teams.length > 0) {
          // Se o usuário tiver uma equipe, usa a primeira
          setTeamId(teams[0].id || null);
        } else {
          setTeamId(null);
        }
      } catch (error) {
        console.error("Erro ao carregar equipe:", error);
        setTeamId(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserTeam();
  }, [user]);

  return (
    <TeamContext.Provider value={{ teamId, setTeamId, loading }}>
      {children}
    </TeamContext.Provider>
  );
};

export default TeamContext;
