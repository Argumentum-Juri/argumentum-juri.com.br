
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyInvites, respondToInvite } from '@/services/team';
import { TeamInvite } from '@/services/team/types';
import { toast } from "sonner";
import { Mail, Check, X } from "lucide-react";

interface MyInvitesProps {
  onInviteResponded: () => void;
}

const MyInvites: React.FC<MyInvitesProps> = ({ onInviteResponded }) => {
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const data = await getMyInvites();
      setInvites(data);
    } catch (error) {
      console.error("Erro ao buscar convites:", error);
      toast.error("Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    try {
      await respondToInvite(inviteId, accept);
      toast.success(accept ? "Convite aceito" : "Convite rejeitado");
      fetchInvites();
      onInviteResponded();
    } catch (error) {
      console.error("Erro ao responder convite:", error);
      toast.error("Erro ao processar sua resposta");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Convites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            Carregando convites...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Convites Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="bg-muted/40 p-4 rounded-md border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-medium">
                    Convite para equipe {invite.team?.id ? invite.team.id.substring(0, 8) + '...' : 'Desconhecida'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Função: {invite.role === 'gestor' ? 'Gestor' : 'Operador'}
                  </p>
                </div>
                <div className="flex space-x-2 self-end md:self-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleResponse(invite.id || '', false)}
                    disabled={!!responding}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleResponse(invite.id || '', true)}
                    disabled={!!responding}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aceitar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyInvites;
