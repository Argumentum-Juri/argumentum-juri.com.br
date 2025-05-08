
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Team } from '@/services/team/types';

interface TeamCardProps {
  team: Team;
  onManageTeam: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onManageTeam }) => {
  const navigate = useNavigate();
  const memberCount = team.members?.length || 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Equipe</span>
            <Badge variant="outline" className="ml-2">
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">ID: {team.id?.substring(0, 8)}...</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          className="w-full" 
          onClick={() => onManageTeam(team)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Gerenciar Equipe
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TeamCard;
