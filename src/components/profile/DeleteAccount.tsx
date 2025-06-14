
import React, { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      // Chamar a função RPC para excluir os dados do usuário
      const { error: rpcError } = await supabase.rpc('delete_user_data', {
        user_id: user.id
      });
      
      if (rpcError) {
        throw rpcError;
      }
      
      // Deletar o usuário da autenticação
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        throw authError;
      }
      
      // Fazer logout
      await signOut();
      
      toast.success('Sua conta foi excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      toast.error(`Erro ao excluir conta: ${error.message || 'Ocorreu um erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir minha conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos,
            incluindo seu perfil, petições, documentos e arquivos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm">
            Digite <strong>excluir minha conta</strong> para confirmar:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="excluir minha conta"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (confirmText.toLowerCase() === 'excluir minha conta') {
                handleDeleteAccount();
              } else {
                toast.error('Texto de confirmação incorreto');
              }
            }}
            disabled={confirmText.toLowerCase() !== 'excluir minha conta' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir conta'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccount;
