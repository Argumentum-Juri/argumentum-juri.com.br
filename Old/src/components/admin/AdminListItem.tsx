
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types";
import { adminService } from '@/services/adminService';
import { useToast } from "@/hooks/use-toast";

interface AdminListItemProps {
  admin: Profile;
  currentUserId?: string;
  onUserRemoved: () => void;
}

const AdminListItem: React.FC<AdminListItemProps> = ({ admin, currentUserId, onUserRemoved }) => {
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = React.useState(false);
  
  const handleRemoveUser = async () => {
    if (admin.id === currentUserId) {
      toast({
        variant: "destructive",
        title: "Operação não permitida",
        description: "Você não pode remover seu próprio usuário.",
      });
      return;
    }

    // Confirmação antes de remover
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${admin.name || admin.email}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsRemoving(true);
      await adminService.removeUser(admin.id);
      
      toast({
        title: "Usuário removido",
        description: `O usuário ${admin.name || admin.email} foi removido com sucesso.`,
      });
      
      onUserRemoved();
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover o usuário.",
      });
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <div className="font-medium">{admin.name || 'Sem nome'}</div>
        <div className="text-sm text-muted-foreground">{admin.email}</div>
      </div>
      <div>
        {admin.id !== currentUserId ? (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleRemoveUser}
            disabled={isRemoving}
          >
            {isRemoving ? "Removendo..." : "Remover Usuário"}
          </Button>
        ) : (
          <Badge>Usuário atual</Badge>
        )}
      </div>
    </div>
  );
};

export default AdminListItem;
