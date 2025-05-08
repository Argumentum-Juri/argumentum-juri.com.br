
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { TeamInvite } from '@/services/team/types';

interface TeamInvitesListProps {
  invites: TeamInvite[];
}

const TeamInvitesList: React.FC<TeamInvitesListProps> = ({ invites }) => {
  if (invites.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Nenhum convite pendente</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aceito</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <div key={invite.id} className="p-3 bg-background rounded-md border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{invite.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  Função: <span className="font-medium">{invite.role === 'gestor' ? 'Gestor' : 'Operador'}</span>
                </p>
                {getStatusBadge(invite.status)}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {new Date(invite.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamInvitesList;
