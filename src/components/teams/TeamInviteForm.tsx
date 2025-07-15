
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteToTeam } from "@/services/team";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';

interface TeamInviteFormProps {
  teamId: string;
  onInviteSent: () => void;
  userRole?: string;
}

const TeamInviteForm: React.FC<TeamInviteFormProps> = ({ teamId, onInviteSent, userRole = "owner" }) => {
  const { user } = useGoAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("operador");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Verificar se o usuário tem permissão para convidar membros
  const canInvite = userRole === "owner" || userRole === "gestor";
  
  if (!canInvite) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted/40">
        <p className="text-muted-foreground">
          Apenas membros com permissão de gestor ou proprietário podem convidar novos membros.
        </p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    setIsLoading(true);
    try {
      // Criar convite no banco de dados
      const invite = await inviteToTeam(teamId, email, role);
      
      // Obter o token da sessão atual
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        toast.error("Sessão inválida", {
          description: "Por favor, faça login novamente para continuar."
        });
        return;
      }
      
      // Enviar email de convite usando a função edge
      const { data, error } = await supabase.functions.invoke("team-invite-email", {
        body: { 
          email, 
          teamId, 
          role,
          inviterId: user?.id
        },
        headers: { 
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (error) {
        console.error("Erro ao enviar email de convite:", error);
        toast.warning("Convite criado, mas houve um erro ao enviar o email");
      } else {
        toast.success(`Convite enviado para ${email}`);
      }
      
      setEmail("");
      onInviteSent();
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      toast.error("Erro ao enviar convite. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email do convidado</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Função na equipe</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione um papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="operador">Operador</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar Convite"}
      </Button>
    </form>
  );
};

export default TeamInviteForm;
